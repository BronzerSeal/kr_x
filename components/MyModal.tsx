"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { useState } from "react";

export default function MyModal({
  title,
  subtitle = "",
  isOpen,
  onOpenChange,
  onPress,
  type,
}) {
  const [comment, setComment] = useState("");
  //c
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>

            <ModalBody>
              {type !== "resubmit" && (
                <>
                  <Input
                    variant="faded"
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Введите комментарий..."
                  />
                  {/* <p>{subtitle}</p> */}
                </>
              )}
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Закрыть
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  if (type === "modify" || type === "resubmit") {
                    onPress(comment);
                  } else if (type === "approved") {
                    onPress("approved", comment);
                  } else if (type === "rejected") {
                    onPress("rejected", comment);
                  }

                  onClose();
                }}
              >
                Отправить
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
