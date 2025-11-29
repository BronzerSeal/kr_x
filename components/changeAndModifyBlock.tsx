import { Button, CalendarDate, Input } from "@heroui/react";
import { Dispatch, FC, SetStateAction } from "react";

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
  console.log({
    editCost,
    setEditCost,
    isManager,
    editStart,
    setEditStart,
    editEnd,
    setEditEnd,
    handleModify,
    handleAction,
  });
  return (
    <div className="mb-6 p-4 bg-gray-50 border border-[#ffffffa6] rounded-lg shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3">
        ⚙️ Корректировка и Согласование
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Input
          size="lg"
          radius="sm"
          type="number"
          label="Бюджет (₽)"
          placeholder="Бюджет (₽)"
          value={editCost}
          onChange={(e) => setEditCost(Number(e.target.value))}
        />
        {isManager && (
          <Input
            size="lg"
            radius="sm"
            type="date"
            label="Начало"
            placeholder="Начало"
            value={editStart ? editStart.toISOString().split("T")[0] : ""}
            onChange={(e) => setEditStart(new Date(e.target.value))}
          />
        )}
        {isManager && (
          <Input
            size="lg"
            radius="sm"
            type="date"
            label="Конец"
            placeholder="Конец"
            value={editEnd ? editEnd.toISOString().split("T")[0] : ""}
            onChange={(e) => setEditEnd(new Date(e.target.value))}
          />
        )}
      </div>
      <div className="flex space-x-3">
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
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold "
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
