"use client";
import { Button } from "@heroui/button";
import { FC, useState } from "react";
import MyModal from "./MyModal";
import { useDisclosure } from "@heroui/react";

interface Props {
  handleAction: (action: string, comment?: string) => Promise<void>;
}

const StandartApprove: FC<Props> = ({ handleAction }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null
  );
  return (
    <div className="mb-6">
      <Button
        size="lg"
        radius="sm"
        variant="shadow"
        onPress={() => {
          handleAction("approved");
        }}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold  mr-3"
      >
        Одобрить
      </Button>
      <Button
        size="lg"
        radius="sm"
        onPress={() => {
          setActionType("rejected");
          onOpen();
          // handleAction("rejected")
        }}
        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
      >
        Отклонить
      </Button>
      <MyModal
        title={"Комментарий(необязательно):"}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onPress={handleAction}
        type={actionType}
      />
    </div>
  );
};

export default StandartApprove;
