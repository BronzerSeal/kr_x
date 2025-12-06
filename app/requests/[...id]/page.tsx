"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FulfillmentStatus, RequestDetail } from "../../../types/requestsTypes";
import { useAuthStore } from "@/store/auth.store";
import { getRequestsByRequestID } from "@/actions/getRequests";
import { DocumentBlock } from "@/components/DocumentBlock";
import axios from "axios";
import { toast } from "react-toastify";
import { CalendarDate, useDisclosure } from "@heroui/react";
import { documentService } from "@/services/document.service";
import RevisionBlock from "@/components/revisionBlock";
import ChangeAndModifyBlock from "@/components/changeAndModifyBlock";
import StandartApprove from "@/components/standartApprove";
import ControlBlock from "@/components/controlBlock";
import { formatDate } from "@/utils/formatDate";
import { convertDateToCalendarDate } from "@/utils/convertDateToCalendarDate";
import { parseHeroDate } from "@/utils/parseHeroDate";
import MyModal from "@/components/MyModal";

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
  receiptFiles: [],
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
  const { session } = useAuthStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [action, setAction] = useState("");
  const [report, setReport] = useState(false);

  // Состояния для Отчета
  const [reportText, setReportText] = useState("");
  const [selectedReportFiles, setSelectedReportFiles] =
    useState<FileList | null>(null);
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<FulfillmentStatus>("waiting_dates");

  // Состояния для формы редактирования (Менеджер/Финансист)
  const [editCost, setEditCost] = useState(0);
  const [editStart, setEditStart] = useState<CalendarDate>();
  const [editEnd, setEditEnd] = useState<CalendarDate>();

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
      // console.log(res);
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
        setEditStart(convertDateToCalendarDate(found.start_date));
        setEditEnd(convertDateToCalendarDate(found.end_date));
        setEmpEditDest(found.destination);
        setEmpEditCost(found.cost_estimate);
        setEmpEditPurpose(found.purpose);
        setEmpEditStart(found.start_date);
        setEmpEditEnd(found.end_date);

        if (!session.user) return;
        // Mark seen: Отметка о просмотре для снятия колокольчика
        // if (
        //   found.is_modified &&
        //   found.last_modified_actor_id !== session.user.id &&
        //   !found.viewedBy.includes(session.user.id)
        // ) {
        //   const formData = new FormData();

        //   formData.append("action", "mark_seen");
        //   formData.append("request_id", String(found.id));
        //   formData.append("user_id", String(session.user.id));

        //   axios.post("/api/requests", formData);
        // }
      } else router.replace("/dashboard");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, router, session]);

  // ФУНКЦИЯ ДЛЯ ОТПРАВКИ ДОКУМЕНТОВ
  const handleDoc = async (
    type: string,
    files: FileList,
    shouldReload = true
  ) => {
    console.log("REPORT FILES:", files);
    if (!request?.id || !user) return;

    const formData = new FormData();
    formData.append("request_id", String(request.id));
    formData.append("user_role", user.role);
    formData.append("user_id", String(user.id));
    formData.append("document_type", type);
    formData.append("action", "update");

    // Добавляем файлы в formData
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      if (shouldReload) fetchData();

      return await response.json();
    } catch (error: any) {
      console.error("handleDoc error:", error);
      toast.error(error.message || "Ошибка сети. Проверьте соединение.");
    }
  };

  // handleUpload теперь просто передает FileList
  const handleUpload = async (type: string, files: FileList) => {
    if (!files || files.length === 0) return;
    await handleDoc(type, files);
  };

  const handleDelete = async (document_type: string, file_id: number) => {
    if (!request?.id) return;

    await documentService.handleDelete(
      document_type,
      file_id,
      request.id,
      user.id
    );

    fetchData();
  };

  // ACTION: Согласование (Approved/Rejected)
  const handleAction = async (action: string, comment: string = "") => {
    if (comment === null) return;

    try {
      console.log("ACTION: ", action);
      await axios.post("/api/approval", {
        request_id: request?.id,
        approver_role: user.role,
        approver_id: user.id,
        action_status: action,
        approver_email: user.email,
        report,
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
  const handleModify = async (comment: string) => {
    if (comment === null) return;

    try {
      await axios.post(
        "/api/approval",
        {
          request_id: request?.id,
          approver_role: user.role,
          approver_id: user.id,
          approver_email: user.email,
          comment,
          new_cost_estimate: editCost,
          new_start_date: editStart
            ? parseHeroDate(editStart)?.toISOString()
            : "",
          new_end_date: editEnd ? parseHeroDate(editEnd)?.toISOString() : "",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Успешное изменение и одобрение заявки");
      router.push("/dashboard");
    } catch (error: any) {
      // toast.error("Ошибка при одобрении/изменении:", error);
      toast.error("Измените хотя бы одно поле");
      // alert(
      //   error.response?.data?.message ||
      //     "Произошла ошибка при отправке данных на сервер"
      // );
    }
  };

  // ACTION: Переотправка (Сотрудник, статус 'created')
  const handleResubmit = async () => {
    // if (!confirm("Повторно отправить заявку?")) return;

    try {
      await axios.post("/api/approval", {
        request_id: request?.id,
        approver_role: user.role,
        approver_email: user.email,
        approver_id: user.id,
        action_type: "resubmit",
        resubmit_destination: empEditDest,
        resubmit_purpose: empEditPurpose,
        resubmit_cost_estimate: empEditCost,
        resubmit_start_date: empEditStart,
        resubmit_end_date: empEditEnd,
      });

      toast.success("успешная доработка");
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
      if (!reportText?.trim()) {
        toast.error("Пожалуйста, заполните текст отчета.");
        return;
      }

      // 4️⃣ Загружаем файлы (не обновляем UI)
      if (!selectedReportFiles || selectedReportFiles.length === 0) {
        toast.error("Пожалуйста, приложите чеки");
        return;
      }
      await handleDoc("receipts", selectedReportFiles, false);

      // 5️⃣ Отправляем запрос через Axios
      console.log("LINE 336");
      const response = await axios.post("/api/fulfillment", {
        request_id: request?.id,
        user_id: user.id,
        approver_email: user.email,
        action: "add_report",
        report_text: reportText,
      });

      const updatedRequest = response.data;

      // 6️⃣ Обновляем UI
      setRequest(updatedRequest);
      setReportText("");
      setReport(false);
      setSelectedReportFiles(null);

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
        <div className="flex justify-between items-center mb-6 border-b pb-4 flex-wrap">
          <p className="text-[17px] sm:text-xl font-semibold text-orange-600">
            Текущий статус:{" "}
            {request.status === "awaiting_hr"
              ? "AWAITING_T-C"
              : request.status.toUpperCase()}
          </p>
          <span className=" text-[15px] md:text-xl text-gray-500">
            {/* {FULFILLMENT_LABELS[request.fulfillment_status]} */}
            {`${formatDate(request.start_date)}-${formatDate(
              request.end_date
            )}`}
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

        <DocumentBlock
          request={request}
          handleUpload={handleUpload}
          handleDelete={handleDelete}
          isTC={isTC}
          isCreator={isCreator}
          canEditReport={canEditReport}
        />

        {/* БЛОК ДОРАБОТКИ (Сотрудник) */}
        {isCreator && request.status === "created" && (
          <RevisionBlock
            empEditCost={empEditCost}
            empEditDest={empEditDest}
            setEmpEditCost={setEmpEditCost}
            setEmpEditDest={setEmpEditDest}
            handleResubmit={handleResubmit}
          />
        )}

        {/* БЛОК ИЗМЕНЕНИЯ И ОДОБРЕНИЯ (Менеджер/Финансист) */}
        {canModify && (
          <ChangeAndModifyBlock
            editCost={editCost}
            setEditCost={setEditCost}
            isManager={isManager}
            editStart={editStart}
            setEditStart={setEditStart}
            editEnd={editEnd}
            setEditEnd={setEditEnd}
            handleModify={handleModify}
            handleAction={handleAction}
          />
        )}

        {/* БЛОК СТАНДАРТНОГО ОДОБРЕНИЯ */}
        {canApprove && <StandartApprove handleAction={handleAction} />}

        {/* БЛОК УПРАВЛЕНИЯ ВЫПОЛНЕНИЕМ (Сотрудник) */}
        {isCreator && request.status === "awaiting_employee_action" && (
          <ControlBlock
            fulfillmentStatus={fulfillmentStatus}
            handleFulfillment={handleFulfillment}
            requestReport={request.report_added}
            reportText={reportText}
            setReportText={setReportText}
            setSelectedReportFiles={setSelectedReportFiles}
            handleReportSubmit={handleReportSubmit}
          />
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
                  onClick={() => {
                    handleAction("approved");
                  }}
                  className="bg-green-600 text-white px-4 sm:py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Утвердить
                </button>
                <button
                  onClick={() => {
                    setAction("rejected");
                    setReport(true);
                    onOpen();
                  }}
                  // onClick={() => handleAction("rejected")}
                  className="bg-red-600 text-white px-4 py-1 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  На доработку
                </button>
                <MyModal
                  title={action === "approved" ? "уверены?" : "Комментарий"}
                  isOpen={isOpen}
                  onOpenChange={onOpenChange}
                  onPress={handleAction}
                  type={action}
                />
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
                {a.approver_email || a.approver_role}){" "}
                {new Date(a.date).toLocaleDateString()}
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
