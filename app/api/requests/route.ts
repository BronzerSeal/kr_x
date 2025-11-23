import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

interface FileAttachment {
  name: string;
  data: string;
}

export async function GET() {
  try {
    const requests = await prisma.request.findMany({
      include: {
        approvals: true,
        changeLogs: true,
        hotelBookings: true,
        passportPhotos: true,
        receiptFiles: true,
        travelTickets: true,
        viewedBy: true,
      },
    });
    return NextResponse.json(requests);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employee_id,
      destination,
      purpose,
      start_date,
      end_date,
      cost_estimate,
      passport_photos,
    } = body;

    if (!employee_id || !destination) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    console.log(employee_id);
    console.log(destination);
    console.log(purpose);
    console.log(start_date);
    console.log(end_date);
    console.log(cost_estimate);
    console.log(passport_photos);

    // Создание заявки
    const newRequest = await prisma.request.create({
      data: {
        employee_id,
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
        last_modified_actor_id: employee_id,
        approvals: {
          create: [
            {
              approver_id: employee_id,
              approver_role: "employee",
              action: "resubmitted",
              comment: "Создана заявка.",
              date: new Date(),
            },
          ],
        },
        passportPhotos: passport_photos?.length
          ? {
              create: passport_photos.map((f: FileAttachment) => ({
                file_name: f.name,
                file_data: f.data,
              })),
            }
          : undefined,
      },
      include: {
        approvals: true,
        passportPhotos: true,
      },
    });

    // Добавляем просмотр пользователем
    if (employee_id) {
      await prisma.viewedBy.create({
        data: {
          request_id: newRequest.id,
          user_id: employee_id,
        },
      });
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
