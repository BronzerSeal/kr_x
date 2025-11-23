"use server";

import prisma from "@/utils/prisma";

// export async function getRequests(employeeId: string) {
//   console.log("employeeId:", employeeId);
//   const response = await prisma.request.findMany({
//     where: { employee_id: employeeId },
//     include: {
//       approvals: true,
//       changeLogs: true,
//       viewedBy: true,
//       passportPhotos: true,
//       travelTickets: true,
//       hotelBookings: true,
//       receiptFiles: true,
//     },
//   });
//   console.log("response", response);
//   return response;
// }
export async function getRequests(userId: string, userRole: string) {
  const response = await prisma.request.findMany({
    where: {
      OR: [
        { employee_id: userId }, // мои заявки
        { current_approver_role: userRole }, // ожидают меня
      ],
    },
    include: {
      approvals: true,
      changeLogs: true,
      viewedBy: true,
      passportPhotos: true,
      travelTickets: true,
      hotelBookings: true,
      receiptFiles: true,
    },
  });
  return response;
}
export async function getRequestsByRequestID(requestId: number) {
  console.log("employeeId:", requestId);
  const response = await prisma.request.findMany({
    where: { id: requestId },
    include: {
      approvals: true,
      changeLogs: true,
      viewedBy: true,
      passportPhotos: true,
      travelTickets: true,
      hotelBookings: true,
      receiptFiles: true,
    },
  });
  console.log("response", response);
  return response;
}
