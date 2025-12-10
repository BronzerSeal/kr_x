"use server";
import prisma from "@/utils/prisma";

export async function approveDestination(requestId: number) {
  const response = await prisma.request.update({
    where: { id: requestId },
    data: {
      destinationAprroved: true,
    },
  });
  return response;
}
