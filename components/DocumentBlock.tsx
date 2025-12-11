import { RequestDetail } from "@/types/requestsTypes";
import { DocumentSection } from "./DocumentSection";
import { FC } from "react";
import { DocumentPasswordSection } from "./DocumentPasswordSection";

interface IProps {
  request: RequestDetail;
  handleUpload: (type: string, files: FileList) => Promise<void>;
  handleDelete: (document_type: string, file_id: number) => Promise<void>;
  isTC: boolean;
  isCreator: boolean;
  canEditReport: boolean;
}

export const DocumentBlock: FC<IProps> = ({
  request,
  handleUpload,
  handleDelete,
  isTC,
  isCreator,
  canEditReport,
}) => {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-3">Документы</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <DocumentPasswordSection
          title="Паспортные данные"
          files={request.passportPhotos}
          type="passport"
          canEdit={isCreator}
          handleUpload={handleUpload}
          handleDelete={handleDelete}
        />
        <DocumentSection
          title="Билеты и маршрут"
          files={request.travelTickets}
          type="travel"
          canEdit={isTC}
          handleUpload={handleUpload}
          handleDelete={handleDelete}
        />
        <DocumentSection
          title="Бронирование отеля"
          files={request.hotelBookings}
          type="hotel"
          canEdit={isTC}
          handleUpload={handleUpload}
          handleDelete={handleDelete}
        />
        <DocumentSection
          title="Чеки и расходы (Отчет)"
          files={request.receiptFiles}
          type="receipts"
          canEdit={canEditReport}
          handleUpload={handleUpload}
          handleDelete={handleDelete}
        />
      </div>
    </>
  );
};

export default DocumentBlock;
