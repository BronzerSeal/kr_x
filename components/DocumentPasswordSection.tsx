import { FileAttachment } from "@/types/requestsTypes";
import { useSession } from "next-auth/react";

export const DocumentPasswordSection = ({
  title,
  files,
  canEdit,
  type,
  handleUpload,
  handleDelete,
}: any) => {
  // console.log(current_approver_role);
  const session = useSession();
  console.log(session);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(type, e.target.files);
      e.target.value = "";
    }
  };

  if (!session) return <p>загрузка</p>;
  const hasAcess =
    session.data?.user?.role === "employee" ||
    session.data?.user?.role === "hr";
  return (
    <div className="mb-4 p-4 border rounded border-gray-400 bg-gray-50">
      <h4 className="font-bold text-sm mb-2">
        {title} ({files?.length || 0})
      </h4>

      {canEdit && (
        <div className="mb-3 border-dashed border-2 border-gray-300 p-2 text-center hover:bg-gray-100 cursor-pointer relative">
          <span className="text-xs text-gray-600">
            Нажмите или перетащите файл для загрузки
          </span>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        {hasAcess ? (
          files?.map((f: FileAttachment, i: number) => (
            <div
              key={i}
              className="flex justify-between text-xs bg-white p-1 border rounded border-gray-400"
            >
              <a
                href={f.file_data}
                download={f.file_name}
                className="text-blue-600 truncate max-w-[80%]"
              >
                📄 {f.file_name.replace(/^\d+-/, "")}
              </a>

              {canEdit && (
                <button
                  onClick={() => handleDelete(type, f.id)}
                  className="text-red-500 ml-2 hover:text-red-700 hover:cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        ) : (
          <p>Нет доступа</p>
        )}
      </div>
    </div>
  );
};
