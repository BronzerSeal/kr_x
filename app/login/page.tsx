"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithCredentials } from "@/actions/sign-in";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@heroui/button";
import { Input } from "@heroui/react";
import { toast } from "react-toastify";
// import { useSession } from "next-auth/react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();
  const { status, isAuth, session } = useAuthStore();

  // Проверяем, вошел ли пользователь, сразу перенаправляем на Dashboard
  useEffect(() => {
    if (isAuth) {
      router.replace("/dashboard");
    }
  }, [isAuth, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await signInWithCredentials(
        formData.email,
        formData.password
      );

      if (res.sucess) {
        router.replace("/dashboard");
      }
      window.location.reload();
    } catch (error) {
      console.log(error);
      toast.error("Неверный логин или пароль");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-sky-700 mb-6">
          SkyWay Travel Portal
        </h1>

        <p className="text-center text-sm text-gray-500 mb-4">
          Демо-логины: anna, ivan, olga, petr (введите часть почты)
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            label="Email"
            variant="bordered"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <Input
            type="password"
            label="password"
            variant="bordered"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <Button
            type="submit"
            color="primary"
            radius="sm"
            className="w-full  text-white p-3  font-semibold"
          >
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
