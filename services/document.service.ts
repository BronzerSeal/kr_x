import httpService from "./http.service";

const ServiceEndpoint = "documents";

export const documentService = {
  handleDelete: async (
    document_type: string,
    file_id: number,
    requestId?: number,
    userId?: number
  ) => {
    // Если requestId отсутствует — выходим (как и было задумано)
    if (!requestId) return;

    try {
      await httpService.delete(ServiceEndpoint, {
        data: {
          file_id,
          document_type,
          request_id: requestId,
          user_id: userId,
        },
      });
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  },
};
