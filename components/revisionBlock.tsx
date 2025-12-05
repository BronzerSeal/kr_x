import { Button } from "@heroui/button";
import { Input } from "@heroui/react";
import { DollarSign, TrainTrack } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface IProps {
  empEditDest: string;
  setEmpEditDest: Dispatch<SetStateAction<string>>;
  empEditCost: number;
  setEmpEditCost: Dispatch<SetStateAction<number>>;
  handleResubmit: () => void;
}

const RevisionBlock = ({
  empEditDest,
  setEmpEditDest,
  empEditCost,
  setEmpEditCost,
  handleResubmit,
}: IProps) => {
  return (
    <>
      <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
        <h3 className="font-bold text-orange-800 mb-3">🛠️ Доработка заявки</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input
            color="warning"
            label="Направление"
            placeholder="Направление"
            startContent={<TrainTrack />}
            value={empEditDest}
            onChange={(e) => setEmpEditDest(e.target.value)}
          />
          <Input
            placeholder="Бюджет"
            startContent={<DollarSign />}
            label="Бюджет"
            color="warning"
            value={empEditCost}
            onChange={(e) => setEmpEditCost(Number(e.target.value))}
          />
        </div>
        <Button
          onPress={handleResubmit}
          className="font-semibold w-full text-[12px] sm:text-[14px]"
          color="warning"
          variant="shadow"
          radius="sm"
        >
          Повторно отправить на согласование
        </Button>
      </div>
    </>
  );
};

export default RevisionBlock;
