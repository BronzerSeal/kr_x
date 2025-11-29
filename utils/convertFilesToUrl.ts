"use server";
import fs from "fs/promises";
import path from "path";

export const convertFilesToUrl = async (
  files: FileList
): Promise<{ file_name: string; file_data: string }[]> => {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const result: { file_name: string; file_data: string }[] = [];

  for (const file of Array.from(files)) {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Здесь возвращаем file_data как путь к файлу, а не Base64
    result.push({ file_name: fileName, file_data: `/uploads/${fileName}` });
  }

  return result;
};
