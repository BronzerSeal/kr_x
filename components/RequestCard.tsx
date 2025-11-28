import { RequestData } from "@/types/requestsTypes";
import { Chip } from "@heroui/react";
import Link from "next/link";

type ColorVariant = "primary" | "secondary" | "success" | "warning" | "danger";

export const RequestCard = ({
  request,
  userId,
}: {
  request: RequestData;
  userId: number;
}) => {
  let statusColor: ColorVariant = "danger";
  let statusText = "";

  console.log(request);
  // Определяем статус и цвет
  if (request.status === "rejected") {
    statusColor = "danger";
    statusText = "ОТКЛОНЕНА";
  } else if (request.status === "awaiting_employee_action") {
    statusColor = "secondary";
    statusText = "НА ВЫПОЛНЕНИИ";
  } else if (request.status === "awaiting_report_approval") {
    statusColor = "warning";
    statusText = "ОТЧЕТ НА ПРОВЕРКЕ";
  } else if (request.status === "completed") {
    statusColor = "success";
    statusText = "ЗАВЕРШЕНА";
  } else if (request.status === "created") {
    statusColor = "danger";
    statusText = `ТРЕБУЕТ ДОРАБОТКИ`;
  } else if (request.status.startsWith("awaiting")) {
    statusColor = "primary";
    statusText = `ОЖИДАЕТ ${
      request.current_approver_role === "hr"
        ? "T-C"
        : request.current_approver_role.toUpperCase()
    }`;
  } else {
    statusText = request.status.toUpperCase();
  }

  // Логика колокольчика: есть изменения И изменены не мной И я еще не видел
  const showBell =
    request.is_modified &&
    request.last_modified_actor_id !== String(userId) &&
    !request.viewedBy.some((v) => v.user_id === String(userId));

  // Преобразуем даты в читаемый формат
  const startDate = new Date(request.start_date).toLocaleDateString("ru-RU");
  const endDate = new Date(request.end_date).toLocaleDateString("ru-RU");

  return (
    <Link
      href={`/requests/${request.id}`}
      className="block border border-gray-400 rounded-lg shadow hover:shadow-lg transition bg-white p-4"
    >
      <div className="flex justify-between mb-2">
        <Chip variant="shadow" radius="sm" color={statusColor}>
          {statusText}
        </Chip>
        {showBell && (
          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse flex justify-center items-center">
            🔔
          </span>
        )}
      </div>
      <h3 className="font-bold text-gray-800 mt-2">{request.destination}</h3>
      <p className="text-sm text-gray-500">
        {startDate} — {endDate} •{" "}
        {new Intl.NumberFormat("ru-RU").format(request.cost_estimate)} ₽
      </p>
    </Link>
  );
};
