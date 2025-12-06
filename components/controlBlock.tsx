"use client";
import { FulfillmentStatus } from "@/types/requestsTypes";
import { Dispatch, FC, SetStateAction } from "react";
import MyModal from "./MyModal";
import { useDisclosure } from "@heroui/react";

interface IProps {
  fulfillmentStatus: string;
  handleFulfillment: (status: FulfillmentStatus) => Promise<void>;
  requestReport: boolean;
  reportText: string;
  setReportText: Dispatch<SetStateAction<string>>;
  setSelectedReportFiles: Dispatch<SetStateAction<FileList | null>>;
  handleReportSubmit: () => void;
}

const ControlBlock: FC<IProps> = ({
  fulfillmentStatus,
  handleFulfillment,
  requestReport,
  reportText,
  setReportText,
  setSelectedReportFiles,
  handleReportSubmit,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
      <h3 className="font-bold text-purple-800 mb-3">
        ✈️ Управление выполнением
      </h3>
      <div className="flex items-center mb-4">
        <span className="mr-3 text-sm font-medium">Статус:</span>
        <select
          value={fulfillmentStatus}
          onChange={(e) =>
            handleFulfillment(e.target.value as FulfillmentStatus)
          }
          className="border p-2 rounded w-full sm:w"
        >
          <option value="waiting_dates">Ожидает дат/документов</option>
          <option value="in_progress">В поездке</option>
          <option value="returned">Вернулся</option>
        </select>
      </div>

      {(fulfillmentStatus === "returned" || !requestReport) && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold mb-2">Отчет о выполнении</h4>
          <textarea
            className="w-full border p-2  rounded mb-2 h-32"
            placeholder="Детальный отчет о поездке..."
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Приложить новые чеки/файлы (добавятся к текущим):
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              setSelectedReportFiles(e.target.files);
            }}
            className="text-sm w-full file:py-1 mb-3"
          />

          <button
            onClick={onOpen}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Отправить Отчет на проверку
          </button>
        </div>
      )}
      <MyModal
        title={"Отправить отчет на проверку?"}
        isOpen={isOpen}
        subtitle="проверьте всё еще раз"
        onOpenChange={onOpenChange}
        onPress={handleReportSubmit}
        type={"resubmit"}
      />
    </div>
  );
};

export default ControlBlock;
