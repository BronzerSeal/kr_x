"use client";
import {
  Button,
  CalendarDate,
  DatePicker,
  Input,
  useDisclosure,
} from "@heroui/react";
import { Dispatch, FC, SetStateAction, useState } from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import MyModal from "./MyModal";

interface IProps {
  editCost: number;
  setEditCost: Dispatch<SetStateAction<number>>;
  isManager: boolean;
  editStart: CalendarDate | undefined;
  setEditStart: Dispatch<SetStateAction<CalendarDate | undefined>>;
  editEnd: CalendarDate | undefined;
  setEditEnd: Dispatch<SetStateAction<CalendarDate | undefined>>;
  handleModify: () => void;
  handleAction: (action: string) => Promise<void>;
}

const ChangeAndModifyBlock: FC<IProps> = ({
  editCost,
  setEditCost,
  isManager,
  editStart,
  setEditStart,
  editEnd,
  setEditEnd,
  handleModify,
  handleAction,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [action, setAction] = useState<"modify" | "rejected" | "">("");

  const isModifyDisabled = (() => {
    const now = today(getLocalTimeZone());

    if (editCost >= 200000) return true;

    if (!isManager) return false; // если не менеджер — не трогаем кнопку

    if (!editStart || !editEnd) return true; // даты не выбраны

    // \Начало не может быть раньше сегодняшнего дня
    if (editStart.compare(now) < 0) return true;

    if (editEnd.compare(editStart) < 0) return true; // конец раньше начала

    const maxEnd = editStart.add({ months: 1 });
    if (editEnd.compare(maxEnd) > 0) return true; // больше месяца

    return false;
  })();

  return (
    <div className="mb-6 p-4 bg-gray-50 border border-[#ffffffa6] rounded-lg shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3">
        ⚙️ Корректировка и Согласование
      </h3>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Input
          size="lg"
          radius="sm"
          type="number"
          label="Бюджет (₽)"
          placeholder="Бюджет (₽)"
          max={200000}
          value={editCost}
          onChange={(e) => setEditCost(Number(e.target.value))}
        />
        {isManager && (
          <DatePicker
            size="lg"
            radius="sm"
            label="Начало"
            value={editStart}
            onChange={setEditStart}
            minValue={today(getLocalTimeZone())}
          />
        )}
        {isManager && (
          <DatePicker
            size="lg"
            radius="sm"
            label="Конец"
            value={editEnd}
            onChange={setEditEnd}
            minValue={editStart || today(getLocalTimeZone())}
            maxValue={editStart ? editStart.add({ months: 1 }) : undefined}
          />
        )}
      </div>
      <div className="flex space-x-3 flex-wrap gap-2 sm:gap-0">
        <Button
          // onPress={handleModify}
          isDisabled={isModifyDisabled}
          onPress={() => {
            setAction("modify");
            onOpen();
          }}
          color="primary"
          size="lg"
          variant="shadow"
          className="bg-sky-600 text-white px-4 py-2 mt-1 rounded-lg font-semibold "
        >
          Изменить и Одобрить
        </Button>
        <Button
          onPress={() => handleAction("approved")}
          color="success"
          size="lg"
          variant="shadow"
          className="bg-green-600 text-white px-4 py-2 rounded-lg mt-1  font-semibold "
        >
          Одобрить без изменений
        </Button>
        <Button
          onPress={() => {
            setAction("rejected");
            onOpen();
          }}
          // handleAction("rejected")}
          color="danger"
          size="lg"
          variant="shadow"
          className=" text-white px-4 py-2 rounded-lg font-semibold mt-1"
        >
          Отклонить
        </Button>
        <MyModal
          title={"Комментарий к изменению:"}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onPress={action === "modify" ? handleModify : handleAction}
          type={action}
        />
      </div>
    </div>
  );
};

export default ChangeAndModifyBlock;
