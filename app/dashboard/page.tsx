"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getAllRequests, getRequests } from "@/actions/getRequests";
import { RequestCard } from "@/components/RequestCard";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/react";
import translateName from "@/utils/translateName";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("my_requests");
  const [requests, setRequests] = useState<any>([]);

  const { setAuthState } = useAuthStore();
  const { data: session, status } = useSession();
  const router = useRouter();

  const fetchData = async () => {
    if (!session?.user?.id) return;

    if (session.user.role === "security") {
      const resp = await getAllRequests();
      setRequests(resp);
    } else {
      const resp = await getRequests(session?.user?.id, session.user?.role);
      setRequests(resp);
    }
  };

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session.user);

    if (session?.user?.role === "security") setActiveTab("all_active_by_role");
    else if (session?.user?.role !== "employee")
      setActiveTab("awaiting_approval");

    fetchData();
  }, [router, session]);

  const getFilteredRequests = (tab: string) => {
    if (!user) return [];

    return requests.filter((req) => {
      const isCreator = req.employee_id === user.id;
      const isParticipated = req.approvals?.some(
        (a) => a.approver_role === user.role
      );

      const isSecurity = user.role === "security";

      // 📌 Если SECURITY — особые правила:
      if (isSecurity) {
        if (tab === "my_requests") {
          return false; // У безопасника нет "моих заявок"
        }

        if (tab === "awaiting_approval") {
          return req.status !== "completed" && req.status !== "rejected";
        }

        if (tab === "all_active_by_role") {
          return req.status !== "completed" && req.status !== "rejected";
        }

        if (tab === "archive") {
          return req.status === "completed" || req.status === "rejected";
        }

        return true;
      }

      // ==============================
      // ✨ ЛОГИКА ДЛЯ ДРУГИХ РОЛЕЙ
      // ==============================

      if (tab === "my_requests") {
        return (
          isCreator && req.status !== "completed" && req.status !== "rejected"
        );
      }

      if (tab === "awaiting_approval") {
        return (
          req.current_approver_role === user.role && req.status !== "completed"
        );
      }

      if (tab === "all_active_by_role") {
        return (
          (isParticipated || isCreator) &&
          req.status !== "completed" &&
          req.status !== "rejected"
        );
      }

      if (tab === "archive") {
        return (
          (isCreator || isParticipated) &&
          (req.status === "completed" || req.status === "rejected")
        );
      }

      return false;
    });
  };

  // В зависимости от роли, устанавливаем вкладки
  const isApproverRole = user && user.role !== "employee";
  if (isApproverRole && activeTab === "my_requests")
    setActiveTab("all_active_by_role");

  const displayRequests = getFilteredRequests(activeTab);
  // console.log(displayRequests);

  if (!user || status === "loading")
    return <div className="p-8">Загрузка...</div>;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-4 border-gray-300">
          <h1 className="text-2xl font-bold text-sky-700">
            Рабочий стол ({translateName(user.role)})
          </h1>
          <div className="flex items-center gap-8 sm:gap-4 mt-2 sm:mt-0">
            <span className="text-sm text-gray-600">Привет, {user.email}!</span>
            <Button
              onPress={async () => {
                // Очистка локального состояния
                setUser(null);
                setRequests([]);
                setActiveTab("my_requests");
                setAuthState("unauthenticated", null);

                // Выход из next-auth
                await signOut({ redirect: true, callbackUrl: "/login" });
              }}
              className="h-[37px]"
              color="danger"
              variant="shadow"
            >
              Выход
            </Button>
          </div>
        </header>

        <div className="flex gap-4 mb-6 border-b border-gray-300">
          {user.role === "employee" && (
            <button
              onClick={() => setActiveTab("my_requests")}
              className={`pb-2 ${
                activeTab === "my_requests"
                  ? "border-b-2 border-sky-500 font-semibold"
                  : "text-gray-600"
              }`}
            >
              Мои заявки
            </button>
          )}
          {isApproverRole && (
            <>
              {session?.user?.role !== "security" && (
                <button
                  onClick={() => setActiveTab("awaiting_approval")}
                  className={`pb-2 ${
                    activeTab === "awaiting_approval"
                      ? "border-b-2 border-sky-500 font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  Ожидают меня (
                  {getFilteredRequests("awaiting_approval").length})
                </button>
              )}
              <button
                onClick={() => setActiveTab("all_active_by_role")}
                className={`pb-2 ${
                  activeTab === "all_active_by_role"
                    ? "border-b-2 border-sky-500 font-semibold"
                    : "text-gray-600"
                }`}
              >
                Все активные
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab("archive")}
            className={`pb-2 ${
              activeTab === "archive"
                ? "border-b-2 border-sky-500 font-semibold"
                : "text-gray-600"
            }`}
          >
            Архив
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayRequests.map((req) => {
            return <RequestCard key={req.id} request={req} userId={user.id} />;
          })}
          {displayRequests.length === 0 && (
            <div className="col-span-full p-10 text-center text-gray-500 bg-white rounded-lg border">
              Нет заявок в этой категории.
              {user.role === "employee" && activeTab === "my_requests" && (
                <p className="mt-2">Нажмите '+' для создания новой заявки.</p>
              )}
            </div>
          )}
        </div>
        {user.role === "employee" && (
          <Link href="/requests/new">
            <Chip
              as="div"
              color="primary"
              variant="shadow"
              className="
          fixed bottom-8 right-8
          shadow-lg
          cursor-pointer
          text-xl
          p-6
          rounded-full
        "
            >
              +
            </Chip>
          </Link>
        )}
      </div>
    </div>
  );
}
