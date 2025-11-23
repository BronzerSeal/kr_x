"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, TrainTrack } from "lucide-react";
import {
  RequestData,
  FulfillmentStatus,
  FileAttachment,
} from "../../../types/requestsTypes";
import { useAuthStore } from "@/store/auth.store";
import { getRequestsByRequestID } from "@/actions/getRequests";
import { DocumentSection } from "@/components/DocumentSection";
import { convertFiles } from "@/utils/convertFiles";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@heroui/button";
import { Input } from "@heroui/react";

interface RequestDetail extends RequestData {
  employee_name: string;
}

const INITIAL_STATE: RequestDetail = {
  id: 0,
  employee_id: 0,
  employee_name: "",
  destination: "",
  purpose: "",
  start_date: "",
  end_date: "",
  cost_estimate: 0,
  status: "created",
  current_approver_role: "employee",
  approvals: [],
  created_by_role: "employee",
  fulfillment_status: "waiting_dates",
  report_added: false,
  report_text: "",
  receipt_files: [],
  is_modified: false,
  change_history: [],
  viewed_by_ids: [],
  passportPhotos: [],
  travelTickets: [],
  hotelBookings: [],
};

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  waiting_dates: "Ждет даты",
  in_progress: "В командировке",
  returned: "Вернулся",
};

export default function RequestDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [user, setUser] = useState<any>(null);
  const { session, status } = useAuthStore();

  // Состояния для Отчета
  const [reportText, setReportText] = useState("");
  const [selectedReportFiles, setSelectedReportFiles] =
    useState<FileList | null>(null);
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<FulfillmentStatus>("waiting_dates");

  // Состояния для формы редактирования (Менеджер/Финансист)
  const [editCost, setEditCost] = useState(0);
  const [editStart, setEditStart] = useState<Date>();
  const [editEnd, setEditEnd] = useState<Date>();

  // Состояния для формы доработки (Сотрудник)
  const [empEditDest, setEmpEditDest] = useState("");
  const [empEditCost, setEmpEditCost] = useState(0);
  const [empEditPurpose, setEmpEditPurpose] = useState("");
  const [empEditStart, setEmpEditStart] = useState<Date>();
  const [empEditEnd, setEmpEditEnd] = useState<Date>();

  const fetchData = async () => {
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session.user);
    if (id) {
      const res = await getRequestsByRequestID(+id);
      console.log(res);
      if (res[0].id) {
        const found = res[0];

        setRequest({
          ...INITIAL_STATE,
          ...found,
          employee_name: "Сотрудник",
        });
        setReportText(found.report_text || "");
        setFulfillmentStatus(found.fulfillment_status);

        setEditCost(found.cost_estimate);
        setEditStart(found.start_date);
        setEditEnd(found.end_date);
        setEmpEditDest(found.destination);
        setEmpEditCost(found.cost_estimate);
        setEmpEditPurpose(found.purpose);
        setEmpEditStart(found.start_date);
        setEmpEditEnd(found.end_date);

        if (!session.user) return;
        // Mark seen: Отметка о просмотре для снятия колокольчика
        if (
          found.is_modified &&
          found.last_modified_actor_id !== session.user.id &&
          !found.viewedBy.includes(session.user.id)
        ) {
          fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "mark_seen",
              request_id: found.id,
              user_id: session?.user?.id, // <--- здесь
            }),
          });
        }
      } else router.replace("/dashboard");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, router, session]);

  // ФУНКЦИЯ ДЛЯ ОТПРАВКИ ДОКУМЕНТОВ
  const handleDoc = async (
    type: string,
    files: FileAttachment[],
    shouldReload = true
  ) => {
    try {
      console.log({
        request_id: request?.id,
        user_role: user.role,
        user_id: user.id,
        document_type: type,
        action: "update",
        files,
      });
      console.log("HANDLE DOC");
      const response = await axios.post("/api/documents", {
        request_id: request?.id,
        user_role: user.role,
        user_id: user.id,
        document_type: type,
        action: "update",
        files,
      });

      if (shouldReload) fetchData();

      return response.data;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 403) {
          toast.error("У вас нет прав на загрузку документов.");
        } else {
          toast.error(
            `Ошибка сервера: ${error.response.status} — ${
              error.response.data?.message || "Неизвестная ошибка"
            }`
          );
        }
      } else {
        toast.error("Ошибка сети. Проверьте соединение.");
      }
      console.error("handleDoc error:", error);
    }
  };

  const handleUpload = async (type: string, files: FileList) => {
    const newFiles = await convertFiles(files); // { name, data }

    if (!newFiles.length) return;

    // Отправляем только новые файлы
    await handleDoc(type, newFiles);
  };

  const handleDelete = async (document_type: string, file_id: number) => {
    if (!request?.id) return;

    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_id,
        document_type,
        request_id: request.id,
        user_id: user.id,
      }),
    });

    fetchData();
  };

  // ACTION: Согласование (Approved/Rejected)
  const handleAction = async (action: string) => {
    const comment = prompt("Комментарий (необязательно):");
    if (comment === null) return;

    try {
      await axios.post("/api/approval", {
        request_id: request?.id,
        approver_role: user.role,
        approver_id: user.id,
        action_status: action,
        comment,
      });

      {
        action === "approved"
          ? toast.success("Успешное одобрение заявки")
          : toast.error("Успешное отклонение заявки");
      }
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Ошибка согласования:", error);
      if (error.response) {
        alert(
          `Ошибка: ${error.response.data?.message || error.response.statusText}`
        );
      } else {
        alert("Ошибка сети. Попробуйте позже.");
      }
    }
  };

  // ACTION: Изменение и Одобрение (Менеджер/Финансист)
  const handleModify = async () => {
    const comment = prompt("Комментарий к изменению:");
    if (comment === null) return;

    try {
      await axios.post(
        "/api/approval",
        {
          request_id: request?.id,
          approver_role: user.role,
          approver_id: user.id,
          comment,
          new_cost_estimate: editCost,
          new_start_date: editStart,
          new_end_date: editEnd,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Успешное изменение и одобрение заявки");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Ошибка при одобрении/изменении:", error);
      alert(
        error.response?.data?.message ||
          "Произошла ошибка при отправке данных на сервер"
      );
    }
  };

  // ACTION: Переотправка (Сотрудник, статус 'created')
  const handleResubmit = async () => {
    if (!confirm("Повторно отправить заявку?")) return;

    try {
      await axios.post("/api/approval", {
        request_id: request?.id,
        approver_role: user.role,
        approver_id: user.id,
        action_type: "resubmit",
        resubmit_destination: empEditDest,
        resubmit_purpose: empEditPurpose,
        resubmit_cost_estimate: empEditCost,
        resubmit_start_date: empEditStart,
        resubmit_end_date: empEditEnd,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Ошибка при переотправке заявки:", error);
      alert("Не удалось переотправить заявку. Попробуйте ещё раз.");
    }
  };

  // ACTION: Статус выполнения (Сотрудник)
  const handleFulfillment = async (status: FulfillmentStatus) => {
    if (!confirm(`Сменить статус выполнения на "${status}"?`)) {
      setFulfillmentStatus(request!.fulfillment_status);
      return;
    }

    await fetch("/api/fulfillment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: request?.id,
        user_id: user.id,
        fulfillment_status: status,
      }),
    });
    fetchData(); // Обновляем данные
  };

  // ACTION: Отправка/Переотправка отчета (Сотрудник)
  const handleReportSubmit = async () => {
    try {
      // 1️⃣ Проверка текста отчета
      if (!reportText?.trim()) {
        alert("Пожалуйста, заполните текст отчета.");
        return;
      }

      // 2️⃣ Подтверждение
      const isConfirmed = confirm("Отправить отчет на проверку?");
      if (!isConfirmed) return;

      // 3️⃣ Готовим файлы
      let finalReportFiles = request?.receiptFiles || [];
      if (selectedReportFiles?.length) {
        const newFiles = await convertFiles(selectedReportFiles);
        finalReportFiles = [...finalReportFiles, ...newFiles];
      }

      // 4️⃣ Загружаем файлы (не обновляем UI)
      await handleDoc("receipts", finalReportFiles, false);

      // 5️⃣ Отправляем запрос через Axios
      console.log("LINE 336");
      const response = await axios.post("/api/fulfillment", {
        request_id: request?.id,
        user_id: user.id,
        action: "add_report",
        report_text: reportText,
      });

      const updatedRequest = response.data;

      // 6️⃣ Обновляем UI
      setRequest(updatedRequest);
      setReportText("");
      setSelectedReportFiles([]);

      toast.success("Отчет успешно отправлен!");
      router.push("/dashboard");
      window.location.reload();
    } catch (error) {
      console.error("handleReportSubmit error:", error);
      alert(`Произошла ошибка при отправке отчета. ${error}`);
      fetchData();
    }
  };

  if (!request || !user)
    return <div className="p-8">Загрузка деталей заявки...</div>;

  const isCreator = user.id === request.employee_id;
  const isManager = user.role === "manager";
  const isTC = user.role === "hr";
  const isFinance = user.role === "finance";
  const canModify =
    (isManager && request.status === "awaiting_manager") ||
    (isFinance && request.status === "awaiting_finance");
  const canApprove =
    request.current_approver_role === user.role &&
    ![
      "completed",
      "rejected",
      "created",
      "awaiting_employee_action",
      "awaiting_report_approval",
    ].includes(request.status) &&
    !canModify;
  const isAwaitingReportApproval =
    request.status === "awaiting_report_approval";
  const canEditReport =
    isCreator &&
    request.fulfillment_status === "returned" &&
    !request.report_added;
  console.log(request);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sky-600 mb-4 inline-block text-sm font-semibold hover:underline"
        >
          ← Назад к списку
        </Link>

        <h1 className="text-3xl font-bold text-sky-800 mb-2">
          Заявка №{request.id}: {request.destination}
        </h1>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <p className="text-xl font-semibold text-orange-600">
            Текущий статус: {request.status.toUpperCase()}
          </p>
          <span className="text-sm text-gray-500">
            {FULFILLMENT_LABELS[request.fulfillment_status]}
          </span>
        </div>

        {request.is_modified && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-center">
            <p className="font-bold">
              Внимание! В заявку были внесены изменения.
            </p>
            <ul className="list-disc list-inside text-sm mt-2">
              {request.change_history.slice(-3).map((c, i) => (
                <li key={i}>
                  {c.field_name}: **{c.old_value}** → **{c.new_value}** (
                  {c.actor_role})
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-3">Документы</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <DocumentSection
            title="Паспортные данные"
            files={request.passportPhotos}
            type="passport"
            canEdit={isCreator}
            handleUpload={handleUpload}
            handleDelete={handleDelete}
          />
          <DocumentSection
            title="Билеты и маршрут"
            files={request.travelTickets}
            type="travel"
            canEdit={isTC}
            handleUpload={handleUpload}
            handleDelete={handleDelete}
          />
          <DocumentSection
            title="Бронирование отеля"
            files={request.hotelBookings}
            type="hotel"
            canEdit={isTC}
            handleUpload={handleUpload}
            handleDelete={handleDelete}
          />
          <DocumentSection
            title="Чеки и расходы (Отчет)"
            files={request.receiptFiles}
            type="receipts"
            canEdit={canEditReport}
            handleUpload={handleUpload}
            handleDelete={handleDelete}
          />
        </div>

        {/* БЛОК ДОРАБОТКИ (Сотрудник) */}
        {isCreator && request.status === "created" && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            <h3 className="font-bold text-orange-800 mb-3">
              🛠️ Доработка заявки
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                color="warning"
                label="Направление"
                placeholder="Направление"
                startContent={<TrainTrack />}
                value={empEditDest}
                onChange={(e) => setEmpEditDest(e.target.value)}
              />
              <Input
                // type="number"
                placeholder="Бюджет"
                startContent={<DollarSign />}
                label="Бюджет"
                color="warning"
                value={empEditCost}
                onChange={(e) => setEmpEditCost(Number(e.target.value))}
              />
            </div>
            <Button
              onPress={handleResubmit}
              // className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
              className="font-semibold"
              color="warning"
              variant="shadow"
              radius="sm"
            >
              Повторно отправить на согласование
            </Button>
          </div>
        )}

        {/* БЛОК ИЗМЕНЕНИЯ И ОДОБРЕНИЯ (Менеджер/Финансист) */}
        {canModify && (
          <div className="mb-6 p-4 bg-gray-50 border border-[#ffffffa6] rounded-lg shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">
              ⚙️ Корректировка и Согласование
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Input
                size="lg"
                radius="sm"
                type="number"
                label="Бюджет (₽)"
                placeholder="Бюджет (₽)"
                value={editCost}
                onChange={(e) => setEditCost(Number(e.target.value))}
              />
              {isManager && (
                <Input
                  size="lg"
                  radius="sm"
                  type="date"
                  label="Начало"
                  placeholder="Начало"
                  value={editStart ? editStart.toISOString().split("T")[0] : ""}
                  onChange={(e) => setEditStart(new Date(e.target.value))}
                />
              )}
              {isManager && (
                <Input
                  size="lg"
                  radius="sm"
                  // className="border p-2 rounded"
                  type="date"
                  label="Конец"
                  placeholder="Конец"
                  value={editEnd ? editEnd.toISOString().split("T")[0] : ""}
                  onChange={(e) => setEditEnd(new Date(e.target.value))}
                />
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onPress={handleModify}
                color="primary"
                size="lg"
                variant="shadow"
                className="bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold "
              >
                Изменить и Одобрить
              </Button>
              <Button
                onPress={() => handleAction("approved")}
                color="success"
                size="lg"
                variant="shadow"
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold "
              >
                Одобрить без изменений
              </Button>
              <Button
                onPress={() => handleAction("rejected")}
                color="danger"
                size="lg"
                variant="shadow"
                className=" text-white px-4 py-2 rounded-lg font-semibold "
              >
                Отклонить
              </Button>
            </div>
          </div>
        )}

        {/* БЛОК СТАНДАРТНОГО ОДОБРЕНИЯ */}
        {canApprove && (
          <div className="mb-6">
            <Button
              size="lg"
              radius="sm"
              variant="shadow"
              onPress={() => handleAction("approved")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold  mr-3"
            >
              Одобрить
            </Button>
            <Button
              size="lg"
              radius="sm"
              onPress={() => handleAction("rejected")}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Отклонить
            </Button>
          </div>
        )}

        {/* БЛОК УПРАВЛЕНИЯ ВЫПОЛНЕНИЕМ (Сотрудник) */}
        {isCreator && request.status === "awaiting_employee_action" && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
            <h3 className="font-bold text-purple-800 mb-3">
              ✈️ Управление выполнением
            </h3>
            <div className="flex items-center mb-4">
              <span className="mr-3 text-sm font-medium">Статус:</span>
              <select
                value={fulfillmentStatus}
                onChange={(e) =>
                  handleFulfillment(e.target.value as FulfillmentStatus)
                }
                className="border p-2 rounded"
              >
                <option value="waiting_dates">Ожидает дат/документов</option>
                <option value="in_progress">В поездке</option>
                <option value="returned">Вернулся</option>
              </select>
            </div>

            {(fulfillmentStatus === "returned" || !request.report_added) && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2">Отчет о выполнении</h4>
                <textarea
                  className="w-full border p-2  rounded mb-2 h-32"
                  placeholder="Детальный отчет о поездке..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                />
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Приложить новые чеки/файлы (добавятся к текущим):
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedReportFiles(e.target.files)}
                  className="text-sm w-full file:py-1 mb-3"
                />

                <button
                  onClick={handleReportSubmit}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Отправить Отчет на проверку
                </button>
              </div>
            )}
          </div>
        )}

        {/* БЛОК ПРОСМОТРА ОТЧЕТА */}
        {request.report_added && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <h3 className="font-bold text-blue-800 mb-3">
              📄 Отчет о выполнении
            </h3>
            <p className="whitespace-pre-wrap text-gray-700 mb-3 border-b border-gray-400 pb-3">
              {request.report_text || "Текстовый отчет не предоставлен."}
            </p>

            {/* Файлы отчета отображаются выше в DocumentSection */}

            {isAwaitingReportApproval && isFinance && (
              <div className="mt-4 pt-4 border-t flex space-x-3">
                <button
                  onClick={() => handleAction("approved")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Утвердить
                </button>
                <button
                  onClick={() => handleAction("rejected")}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  На доработку
                </button>
              </div>
            )}
          </div>
        )}

        {/* ИСТОРИЯ СОГЛАСОВАНИЙ */}
        <div className="mt-6 border-t pt-4">
          <h4 className="text-lg font-bold text-gray-800 mb-3">
            История Согласований ({request.approvals.length})
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {request.approvals.map((a, i) => (
              <div
                key={i}
                className={`text-sm p-3 rounded ${
                  a.action === "rejected"
                    ? "bg-red-50"
                    : a.action === "approved"
                    ? "bg-green-50"
                    : a.action === "modified"
                    ? "bg-yellow-50"
                    : "bg-gray-100"
                }`}
              >
                <span className="font-bold uppercase">{a.action}</span> (
                {a.approver_role}) {new Date(a.date).toLocaleDateString()}
                {a.comment && (
                  <p className="text-gray-600 italic mt-1">
                    Комментарий: "{a.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
