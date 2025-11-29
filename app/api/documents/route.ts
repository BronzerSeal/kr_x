import fs from "fs/promises";
import formidable from "formidable";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import path from "path";
export const config = { api: { bodyParser: false } };

interface FileAttachment {
  name: string;
  data: string;
}

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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filesForDb = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);

        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));

        return { file_name: fileName, file_data: `/uploads/${fileName}` };
      })
    );
    console.log(filesForDb);
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
          file_data: f.file_data,
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
  const body = await req.json();
  const { file_id, document_type, request_id, user_id } = body;

  if (!file_id) {
    return new Response("Missing file_id", { status: 400 });
  }

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
      return new Response("Unknown document type", { status: 400 });
  }

  if (!deletedFile) return new Response("File not found", { status: 404 });

  try {
    const filePath = path.join(process.cwd(), "public", deletedFile.file_data);
    await fs.unlink(filePath);
  } catch (err) {
    console.warn("Не удалось удалить файл с диска:", err);
  }

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

  // Логирование в request
  await prisma.request.update({
    where: { id: request_id },
    data: {
      is_modified: true,
      last_modified_actor_id: user_id,
    },
  });

  return new Response("File deleted", { status: 200 });
}
