import { Button, CalendarDate, DatePicker, Input } from "@heroui/react";
import { Dispatch, FC, SetStateAction } from "react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { convertDateToCalendarDate } from "@/utils/convertDateToCalendarDate";

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
  console.log(editStart);
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
          onPress={handleModify}
          color="primary"
          size="lg"
          variant="shadow"
          className="bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold "
        >
          Изменить и Одобрить
        </Button>
        <Button
          onPress={() => handleAction("approved")}
          color="success"
          size="lg"
          variant="shadow"
          className="bg-green-600 text-white px-4 py-2 rounded-lg   font-semibold "
        >
          Одобрить без изменений
        </Button>
        <Button
          onPress={() => handleAction("rejected")}
          color="danger"
          size="lg"
          variant="shadow"
          className=" text-white px-4 py-2 rounded-lg font-semibold "
        >
          Отклонить
        </Button>
      </div>
    </div>
  );
};

export default ChangeAndModifyBlock;
