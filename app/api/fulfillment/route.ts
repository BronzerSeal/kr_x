import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      request_id,
      user_id,
      fulfillment_status,
      action,
      report_text,
      approver_email,
    } = body;

    const request = await prisma.request.findUnique({
      where: { id: Number(request_id) },
      include: { approvals: true, changeLogs: true },
    });

    if (!request)
      return NextResponse.json(
        { message: "Request not found." },
        { status: 404 }
      );

    const today = new Date();

    const triggerNotification = async (
      field: string,
      oldValue: string,
      newValue: string
    ) => {
      await prisma.changeLog.create({
        data: {
          request_id: request.id,
          date: today,
          actor_role: "employee",
          field_name: field,
          old_value: oldValue,
          new_value: newValue,
        },
      });

      await prisma.request.update({
        where: { id: request.id },
        data: {
          is_modified: true,
          last_modified_actor_id: user_id,
        },
      });
    };

    // Смена статуса выполнения
    if (
      fulfillment_status &&
      fulfillment_status !== request.fulfillment_status
    ) {
      const oldStatus = request.fulfillment_status;

      await prisma.request.update({
        where: { id: request.id },
        data: { fulfillment_status },
      });

      await triggerNotification(
        "Статус выполнения",
        oldStatus,
        fulfillment_status
      );

      return NextResponse.json({ message: "Fulfillment status updated." });
    }

    // Добавление отчета
    if (action === "add_report") {
      const updated = await prisma.request.update({
        where: { id: request.id },
        data: {
          report_text: report_text || "",
          report_added: true,
          status: "awaiting_report_approval",
          current_approver_role: "finance",
        },
      });

      await triggerNotification("Отчет", "Не сдан", "Отправлен на проверку");

      await prisma.approval.create({
        data: {
          request_id: request.id,
          approver_id: user_id,
          approver_role: "employee",
          action: "resubmitted",
          comment: "Отчет отправлен.",
          date: today,
          approver_email: approver_email,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (e) {
    console.error("Fulfillment API error:", e);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
