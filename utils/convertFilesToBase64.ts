import { FileAttachment } from "@/types/requestsTypes";

export const convertFilesToBase64 = (
  files: FileList | null
): Promise<FileAttachment[]> => {
  return new Promise((resolve) => {
    if (!files || files.length === 0) return resolve([]);
    const filePromises = Array.from(files).map((file) => {
      return new Promise<FileAttachment>((res) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () =>
          res({ name: file.name, data: reader.result as string });
        reader.onerror = () =>
          res({ name: file.name, data: "Error reading file" });
      });
    });
    Promise.all(filePromises).then(resolve);
  });
};
