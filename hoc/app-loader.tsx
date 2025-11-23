"use client";

import { useAuthStore } from "@/store/auth.store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface IProps {
  children: React.ReactNode;
}

const AppLoader = ({ children }: IProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setAuthState } = useAuthStore();
  const isAuth = status === "authenticated";

  useEffect(() => {
    setAuthState(status, session);
  }, [status, session, setAuthState]);

  useEffect(() => {
    if (status === "loading") return;
    // Перенаправляем на страницу входа при загрузке корневого адреса
    if (!isAuth) {
      router.replace("/login");
    }
  }, [router, isAuth]);
  return <>{children}</>;
};

export default AppLoader;
