// app/api/approval/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

const STATUS_TRANSITIONS: Record<string, Record<string, string>> = {
  created: { resubmit: "awaiting_manager" },
  awaiting_manager: {
    approved: "awaiting_hr",
    modified: "awaiting_hr",
    rejected: "created",
  },
  awaiting_hr: { approved: "awaiting_finance", rejected: "awaiting_manager" },
  awaiting_finance: {
    approved: "awaiting_employee_action",
    modified: "awaiting_employee_action",
    rejected: "awaiting_hr",
  },
  awaiting_employee_action: {
    report_added: "awaiting_report_approval",
    rejected: "awaiting_employee_action",
  },
  awaiting_report_approval: {
    approved: "completed",
    rejected: "awaiting_employee_action",
  },
  rejected: {},
  completed: {},
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      request_id,
      approver_email,
      approver_role,
      approver_id,
      action_status,
      comment,
      new_cost_estimate,
      new_start_date,
      new_end_date,
      action_type,
      resubmit_destination,
      resubmit_purpose,
      resubmit_cost_estimate,
      resubmit_start_date,
      resubmit_end_date,
    } = body;

    const request = await prisma.request.findUnique({
      where: { id: request_id },
      include: {
        approvals: true,
        changeLogs: true,
        employee: true,
      },
    });

    if (!request)
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );

    const today = new Date();

    // 1️⃣ Пересогласование сотрудником
    if (
      action_type === "resubmit" &&
      request.current_approver_role === "employee" &&
      request.status === "created"
    ) {
      const alreadyViewed = await prisma.viewedBy.findUnique({
        where: {
          request_id_user_id: {
            request_id,
            user_id: approver_id,
          },
        },
      });
      const updatedRequest = await prisma.request.update({
        where: { id: request_id },
        data: {
          destination: resubmit_destination,
          purpose: resubmit_purpose,
          cost_estimate: resubmit_cost_estimate,
          start_date: new Date(resubmit_start_date),
          end_date: new Date(resubmit_end_date),
          status: "awaiting_manager",
          current_approver_role: "manager",
          is_modified: false,
          last_modified_actor_id: approver_id,
          viewedBy: alreadyViewed
            ? undefined
            : { create: { user_id: approver_id } },
          approvals: {
            create: {
              approver_id,
              approver_role: "employee",
              approver_email: approver_email,
              action: "resubmitted",
              comment: comment || "Повторная отправка после доработки",
              date: today,
            },
          },
        },
        include: { approvals: true, changeLogs: true },
      });

      return NextResponse.json(updatedRequest);
    }

    // 2️⃣ Изменение заявки (менеджер/финансист)
    const changes: any[] = [];
    if (
      new_cost_estimate !== undefined &&
      new_cost_estimate !== request.cost_estimate
    ) {
      changes.push({
        date: today,
        actor_role: approver_role,
        field_name: "Бюджет",
        old_value: `${request.cost_estimate}`,
        new_value: `${new_cost_estimate}`,
      });
      request.cost_estimate = new_cost_estimate;
    }
    if (approver_role === "manager") {
      if (
        new_start_date &&
        new Date(new_start_date).toISOString() !==
          request.start_date.toISOString()
      ) {
        changes.push({
          date: today,
          actor_role: approver_role,
          field_name: "Начало",
          old_value: request.start_date.toISOString(),
          new_value: new Date(new_start_date).toISOString(),
        });
        request.start_date = new Date(new_start_date);
      }
      if (
        new_end_date &&
        new Date(new_end_date).toISOString() !== request.end_date.toISOString()
      ) {
        changes.push({
          date: today,
          actor_role: approver_role,
          field_name: "Конец",
          old_value: request.end_date.toISOString(),
          new_value: new Date(new_end_date).toISOString(),
        });
        request.end_date = new Date(new_end_date);
      }
    }

    if (changes.length > 0) {
      // Проверяем, есть ли уже запись в viewedBy
      const alreadyViewed = await prisma.viewedBy.findUnique({
        where: {
          request_id_user_id: {
            request_id,
            user_id: approver_id,
          },
        },
      });
      const updatedRequest = await prisma.request.update({
        where: { id: request_id },
        data: {
          is_modified: true,
          last_modified_actor_id: approver_id,
          viewedBy: alreadyViewed
            ? undefined
            : { create: { user_id: approver_id } },
          cost_estimate: request.cost_estimate,
          start_date: request.start_date,
          end_date: request.end_date,
          approvals: {
            create: {
              approver_id,
              approver_role,
              action: "modified",
              approver_email: approver_email,
              comment: comment || "Внесены правки",
              date: today,
            },
          },
          changeLogs: { createMany: { data: changes } },
          status:
            approver_role === "manager"
              ? "awaiting_hr"
              : "awaiting_employee_action",
          current_approver_role:
            approver_role === "manager" ? "hr" : "employee",
        },
        include: { approvals: true, changeLogs: true },
      });

      return NextResponse.json(updatedRequest);
    }

    // 3️⃣ Стандартное действие: approve/reject
    if (action_status && ["approved", "rejected"].includes(action_status)) {
      const nextStatus = STATUS_TRANSITIONS[request.status]?.[action_status];
      if (!nextStatus)
        return NextResponse.json(
          { message: "Invalid transition" },
          { status: 400 }
        );

      const updatedRequest = await prisma.request.update({
        where: { id: request_id },
        data: {
          status: nextStatus,
          approvals: {
            create: {
              approver_id,
              approver_role,
              action: action_status,
              approver_email: approver_email,
              comment,
              date: today,
            },
          },
          is_modified:
            action_status === "rejected" ? true : request.is_modified,
          last_modified_actor_id:
            action_status === "rejected"
              ? approver_id
              : request.last_modified_actor_id,
          viewedBy:
            action_status === "rejected"
              ? {
                  deleteMany: {}, // очищаем старые записи
                  create: { user_id: approver_id }, // создаём новую запись для уведомления
                }
              : undefined,
          changeLogs:
            action_status === "rejected"
              ? {
                  create: {
                    date: today,
                    actor_role: approver_role,
                    field_name: "Статус",
                    old_value: request.status,
                    new_value: nextStatus,
                  },
                }
              : undefined,
          current_approver_role:
            nextStatus === "created" ||
            nextStatus === "awaiting_employee_action"
              ? "employee"
              : nextStatus === "completed"
              ? "archive"
              : (nextStatus.split("_")[1] as string),
        },
        include: { approvals: true, changeLogs: true },
      });

      return NextResponse.json(updatedRequest);
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("Approval error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
