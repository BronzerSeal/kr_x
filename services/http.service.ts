import axios from "axios";
import { serviceConfig } from "@/config/service.config";
import { toast } from "react-toastify";

const httpService = axios.create({
  baseURL: serviceConfig.baseUrl, // применяется только к backend запросам
});

httpService.interceptors.response.use(
  (res) => res,
  (error) => {
    const expectedErrors =
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500;

    if (!expectedErrors) {
      toast.error("Something was wrong. Try it later");
    }
    return Promise.reject(error);
  }
);

export default httpService;
