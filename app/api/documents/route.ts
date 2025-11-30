import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { put } from "@vercel/blob"; // npm install @vercel/blob
import { del } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Извлекаем текстовые поля
    const request_id = formData.get("request_id") as string;
    const user_role = formData.get("user_role") as string;
    const user_id = formData.get("user_id") as string;
    const document_type = formData.get("document_type") as string;

    // Получаем файлы
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { message: "No files provided" },
        { status: 400 }
      );
    }

    // Загружаем файлы в Vercel Blob
    const filesForDb = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;

        const blob = await put(fileName, file, {
          access: "public",
          addRandomSuffix: true, // чтобы не было конфликтов имен
        });

        return { file_name: fileName, file_data: blob.url };
      })
    );

    // Проверка заявки
    const request = await prisma.request.findUnique({
      where: { id: Number(request_id) },
    });
    if (!request)
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );

    // Проверка прав
    if (
      ((document_type === "passport" || document_type === "receipts") &&
        user_role !== "employee") ||
      ((document_type === "travel" || document_type === "hotel") &&
        user_role !== "hr")
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Создаем записи в БД
    const createdFiles = await Promise.all(
      filesForDb.map((f) => {
        const data = {
          request_id: Number(request_id),
          file_name: f.file_name,
          file_data: f.file_data, // сохраняем URL на blob
        };

        switch (document_type) {
          case "passport":
            return prisma.passportPhoto.create({ data });
          case "receipts":
            return prisma.receiptFile.create({ data });
          case "travel":
            return prisma.travelTicket.create({ data });
          case "hotel":
            return prisma.hotelBooking.create({ data });
          default:
            throw new Error("Unknown document type");
        }
      })
    );

    // Лог изменений заявки
    await prisma.request.update({
      where: { id: Number(request_id) },
      data: { is_modified: true, last_modified_actor_id: String(user_id) },
    });

    // Логирование изменений
    await prisma.changeLog.createMany({
      data: createdFiles.map(() => ({
        request_id: Number(request_id),
        date: new Date(),
        actor_role: user_role,
        field_name: document_type,
        old_value: "Файлы",
        new_value: "Добавлены новые файлы",
      })),
    });

    return NextResponse.json({
      message: "Files uploaded",
      files: createdFiles,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { file_id, document_type, request_id, user_id } = body;

    if (!file_id) {
      return new NextResponse("Missing file_id", { status: 400 });
    }

    // Получаем запись файла из БД
    let deletedFile;
    switch (document_type) {
      case "passport":
        deletedFile = await prisma.passportPhoto.findUnique({
          where: { id: file_id },
        });
        break;
      case "receipts":
        deletedFile = await prisma.receiptFile.findUnique({
          where: { id: file_id },
        });
        break;
      case "travel":
        deletedFile = await prisma.travelTicket.findUnique({
          where: { id: file_id },
        });
        break;
      case "hotel":
        deletedFile = await prisma.hotelBooking.findUnique({
          where: { id: file_id },
        });
        break;
      default:
        return new NextResponse("Unknown document type", { status: 400 });
    }

    if (!deletedFile)
      return new NextResponse("File not found", { status: 404 });

    // Удаляем файл из Vercel Blob
    try {
      // file_data теперь содержит URL на blob, нужно взять имя файла из URL
      const url = new URL(deletedFile.file_data);
      const blobName = url.pathname.split("/").pop()!; // получаем имя файла
      await del(blobName); // удаляем из Vercel Blob
    } catch (err) {
      console.warn("Не удалось удалить файл из blob:", err);
    }

    // Удаляем запись из БД
    switch (document_type) {
      case "passport":
        await prisma.passportPhoto.delete({ where: { id: file_id } });
        break;
      case "receipts":
        await prisma.receiptFile.delete({ where: { id: file_id } });
        break;
      case "travel":
        await prisma.travelTicket.delete({ where: { id: file_id } });
        break;
      case "hotel":
        await prisma.hotelBooking.delete({ where: { id: file_id } });
        break;
    }

    // Логирование изменений заявки
    await prisma.request.update({
      where: { id: request_id },
      data: {
        is_modified: true,
        last_modified_actor_id: user_id,
      },
    });

    return new NextResponse("File deleted", { status: 200 });
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
