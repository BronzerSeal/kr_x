import { FileAttachment } from "@/types/requestsTypes";

export const convertFiles = (files: FileList): Promise<FileAttachment[]> => {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<FileAttachment>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () =>
            resolve({ name: file.name, data: reader.result as string });
          reader.onerror = () =>
            resolve({ name: file.name, data: "Error reading file" });
        })
    )
  );
};
