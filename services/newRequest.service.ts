import { parseHeroDate } from "@/utils/parseHeroDate";
import httpService from "./http.service";
import { DateValue } from "@heroui/react";

const ServiceEndpoint = "requests";

interface newReqProps {
  userId: string;
  destination: string;
  purpose: string;
  startDate: DateValue;
  endDate: DateValue;
  costEstimate: number;
  passportPayload: object;
}

export const newRequestService = {
  createRequest: async ({
    userId,
    destination,
    purpose,
    startDate,
    endDate,
    costEstimate,
    passportPayload,
  }: newReqProps) => {
    const res = await httpService.post(ServiceEndpoint, {
      employee_id: userId,
      destination,
      purpose,
      start_date: startDate ? parseHeroDate(startDate)?.toISOString() : null,
      end_date: endDate ? parseHeroDate(endDate)?.toISOString() : null,
      cost_estimate: costEstimate,
      passport_photos: passportPayload,
    });
    return res;
  },
};
