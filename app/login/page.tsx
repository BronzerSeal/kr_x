"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithCredentials } from "@/actions/sign-in";
import { useAuthStore } from "@/store/auth.store";
import { useSession } from "next-auth/react";
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
    }
  };
  console.log("session: ", session);
  console.log("status: ", status);
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
          <input
            type="email"
            className="w-full p-3 border border-gray-300 rounded focus:ring-sky-500 focus:border-sky-500"
            placeholder="Email (напр. anna@skyway.com)"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <input
            type="password"
            className="w-full p-3 border border-gray-300 rounded focus:ring-sky-500 focus:border-sky-500"
            placeholder="Password (напр. 123456)"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <button
            type="submit"
            className="w-full bg-sky-600 text-white p-3 rounded-lg font-semibold hover:bg-sky-700 transition duration-200"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
