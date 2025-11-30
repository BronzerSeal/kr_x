import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { put } from "@vercel/blob"; // npm install @vercel/blob

interface FileAttachment {
  name: string;
  url: string;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const employee_id = formData.get("employee_id") as string;
    const destination = formData.get("destination") as string;
    const purpose = formData.get("purpose") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const cost_estimate = formData.get("cost_estimate") as string;

    if (!employee_id || !destination || !start_date || !end_date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Файлы
    const files = formData.getAll("passport_files") as File[];
    const uploadedFiles: FileAttachment[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;

      // Загружаем файл в Vercel Blob
      const blob = await put(fileName, file, {
        access: "public",
        addRandomSuffix: true,
      });

      uploadedFiles.push({ name: fileName, url: blob.url });
    }

    const newRequest = await prisma.request.create({
      data: {
        employee_id: String(employee_id),
        created_by_role: "employee",
        destination,
        purpose,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        cost_estimate: Number(cost_estimate),
        status: "awaiting_manager",
        current_approver_role: "manager",
        fulfillment_status: "waiting_dates",
        report_added: false,
        report_text: "",
        is_modified: false,
        last_modified_actor_id: String(employee_id),
        passportPhotos: uploadedFiles.length
          ? {
              create: uploadedFiles.map((f) => ({
                file_name: f.name,
                file_data: f.url, // сохраняем URL на blob
              })),
            }
          : undefined,
        approvals: {
          create: [
            {
              approver_id: String(employee_id),
              approver_role: "employee",
              action: "resubmitted",
              comment: "Создана заявка.",
              date: new Date(),
            },
          ],
        },
      },
      include: { passportPhotos: true, approvals: true },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
