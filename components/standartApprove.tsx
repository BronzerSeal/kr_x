import { Button } from "@heroui/button";
import { FC } from "react";

interface Props {
  handleAction: (action: string) => Promise<void>;
}

const StandartApprove: FC<Props> = ({ handleAction }) => {
  return (
    <div className="mb-6">
      <Button
        size="lg"
        radius="sm"
        variant="shadow"
        onPress={() => handleAction("approved")}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold  mr-3"
      >
        Одобрить
      </Button>
      <Button
        size="lg"
        radius="sm"
        onPress={() => handleAction("rejected")}
        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
      >
        Отклонить
      </Button>
    </div>
  );
};

export default StandartApprove;
