import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

interface FileAttachment {
  name: string;
  data: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request_id, user_role, user_id, document_type, files } = body;

    console.log(files);

    // if (!files || !Array.isArray(files) || files.length === 0) {
    //   return NextResponse.json(
    //     { message: "No files provided" },
    //     { status: 400 }
    //   );
    // }

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

    // Создаём только новые файлы
    const createdFiles = await Promise.all(
      (files as FileAttachment[]).map((f) => {
        const data = {
          request_id: Number(request_id),
          file_name: f.name,
          file_data: f.data,
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
      data: {
        is_modified: true,
        last_modified_actor_id: user_id,
      },
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
      deletedFile = await prisma.passportPhoto.delete({
        where: { id: file_id },
      });
      break;
    case "receipts":
      deletedFile = await prisma.receiptFile.delete({
        where: { id: file_id },
      });
      break;
    case "travel":
      deletedFile = await prisma.travelTicket.delete({
        where: { id: file_id },
      });
      break;
    case "hotel":
      deletedFile = await prisma.hotelBooking.delete({
        where: { id: file_id },
      });
      break;
    default:
      return new Response("Unknown document type", { status: 400 });
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
