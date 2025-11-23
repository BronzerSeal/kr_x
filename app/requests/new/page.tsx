"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button, DatePicker, Input, Textarea } from "@heroui/react";

interface FileAttachment {
  name: string;
  data: string;
}

const convertFilesToBase64 = (
  files: FileList | null
): Promise<FileAttachment[]> => {
  return new Promise((resolve) => {
    if (!files || files.length === 0) return resolve([]);
    const filePromises = Array.from(files).map((file) => {
      return new Promise<FileAttachment>((res) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () =>
          res({ name: file.name, data: reader.result as string });
        reader.onerror = () =>
          res({ name: file.name, data: "Error reading file" });
      });
    });
    Promise.all(filePromises).then(resolve);
  });
};

// Функция для преобразования объекта gregory в Date
const parseHeroDate = (d: any): Date | null => {
  if (!d) return null;
  const { year, month, day } = d; // month начинается с 1
  return new Date(year, month - 1, day);
};

export default function NewRequestPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState<Date | null>();
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [costEstimate, setCostEstimate] = useState<number>(0);
  const [passportFiles, setPassportFiles] = useState<FileList | null>(null);

  const { data: session } = useSession();
  const user = session?.user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Войдите в систему");

    let passportPayload: FileAttachment[] = [];
    if (passportFiles) {
      passportPayload = await convertFilesToBase64(passportFiles);
    }

    try {
      console.log({
        start_date: startDate ? parseHeroDate(startDate)?.toISOString() : null,
        end_date: endDate ? parseHeroDate(endDate)?.toISOString() : null,
      });
      const res = await axios.post("/api/requests", {
        employee_id: user.id,
        destination,
        purpose,
        start_date: startDate ? parseHeroDate(startDate)?.toISOString() : null,
        end_date: endDate ? parseHeroDate(endDate)?.toISOString() : null,
        cost_estimate: costEstimate,
        passport_photos: passportPayload,
      });
      console.log(res);

      if (res.status === 200 || res.status === 201) {
        toast.success("Заявка создана и отправлена менеджеру!");
        router.push("/dashboard");
      } else {
        toast.error(`Ошибка создания: ${res.statusText}`);
      }
    } catch (error: any) {
      if (error.response) {
        // Сервер вернул ответ с ошибкой
        alert(
          `Ошибка создания: ${
            error.response.data?.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        alert("Ошибка сети: сервер не отвечает.");
      } else {
        // Другая ошибка
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow p-8 max-w-2xl mx-auto rounded-lg">
        <Link href="/dashboard" className="text-sky-600 mb-4 inline-block">
          ← Назад
        </Link>
        <h1 className="text-2xl font-bold mb-6 text-sky-800">
          Новая заявка на командировку
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Направление
          </label>
          <Input
            placeholder="Город, Страна"
            value={destination}
            size="lg"
            radius="sm"
            onChange={(e) => setDestination(e.target.value)}
            required
          />

          <label className="block text-sm font-medium text-gray-700">
            Цель командировки
          </label>
          <Textarea
            size="lg"
            radius="sm"
            placeholder="Подробное описание"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Дата начала
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Выберите дату"
                size="lg"
                radius="sm"
                // className="w-full border p-3 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Дата окончания
              </label>
              <DatePicker
                type="date"
                size="lg"
                radius="sm"
                value={endDate}
                onChange={setEndDate}
                required
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Ориентировочный бюджет (₽)
          </label>
          <Input
            type="number"
            size="lg"
            radius="sm"
            placeholder="Бюджет"
            value={costEstimate || ""}
            onChange={(e) => setCostEstimate(Number(e.target.value))}
            required
            min="1"
          />

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <label className="block text-sm font-bold text-yellow-800 mb-2">
              Паспортные данные (сканы/фото)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setPassportFiles(e.target.files)}
              className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"
            />
          </div>

          <Button type="submit" className="w-full" color="primary" size="lg">
            Отправить на согласование
          </Button>
        </form>
      </div>
    </div>
  );
}
