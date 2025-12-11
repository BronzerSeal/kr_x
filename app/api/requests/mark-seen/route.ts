import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const request_id = formData.get("request_id");
  const user_id = formData.get("user_id");

  if (!request_id || !user_id) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  // Добавление "просмотрено"
  await prisma.viewedBy.upsert({
    where: {
      request_id_user_id: {
        request_id: Number(request_id),
        user_id: String(user_id),
      },
    },
    create: {
      request_id: Number(request_id),
      user_id: String(user_id),
    },
    update: {},
  });

  // Сброс флага
  await prisma.request.update({
    where: { id: Number(request_id) },
    data: { is_modified: false },
  });

  return NextResponse.json({ ok: true });
}
