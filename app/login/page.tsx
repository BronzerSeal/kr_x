"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithCredentials } from "@/actions/sign-in";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@heroui/button";
import { Chip, Input } from "@heroui/react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { useGeoLocation } from "@/hooks/useGeoLocation";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const { isAuth } = useAuthStore();

  //-----------------------------------------
  // const adress = useGeoLocation();
  // console.log(adress);

  //-----------------------------------------

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="flex justify-center gap-4">
          <h1 className="text-3xl font-bold text-center text-sky-700 mb-6">
            SkyWay Travel Portal
          </h1>
          <Tooltip
            content="Ваш логин, как правило, совпадает с корпоративным адресом электронной почты. При возникновении проблем обратитесь к руководителю."
            placement="top"
            showArrow
            className="w-[250px]"
            isOpen={open}
            onOpenChange={(open) => setOpen(open)}
            isDismissable={true}
          >
            <Chip
              size="lg"
              className="mt-[3px]"
              color="primary"
              onClick={() => setOpen(!open)}
            >
              i
            </Chip>
          </Tooltip>
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          Демо-логины: anna, ivan, olga, petr, stepan (+ gmail.com)
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
            type={isVisible ? "text" : "password"}
            label="password"
            variant="bordered"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            endContent={
              <button
                aria-label="toggle password visibility"
                className="focus:outline-solid outline-transparent"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? <Eye color="gray" /> : <EyeOff color="gray" />}
              </button>
            }
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
