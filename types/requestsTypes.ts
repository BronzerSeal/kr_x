import { UserRole } from "@/utils/auth";

// ==========================================
// ТИПЫ ДАННЫХ (ИСПОЛЬЗУЮТСЯ ВЕЗДЕ)
// ==========================================

export type RequestStatus =
  | "awaiting_manager"
  | "awaiting_hr"
  | "awaiting_finance"
  | "rejected"
  | "created"
  | "awaiting_employee_action"
  | "awaiting_report_approval"
  | "completed";

export type FulfillmentStatus = "waiting_dates" | "in_progress" | "returned";

export interface FileAttachment {
  id: number;
  file_name: string;
  file_data: string;
  request_id: string;
}

export interface Approval {
  approver_role: UserRole | "employee";
  approver_email: string;
  action: "approved" | "rejected" | "modified" | "resubmitted";
  comment?: string;
  date: string;
}

export interface ChangeLog {
  date: string;
  actor_role: UserRole | "employee";
  field_name: string;
  old_value: string;
  new_value: string;
}

export interface RequestData {
  id: number;
  employee_id: number;
  destination: string;
  purpose: string;
  start_date: string;
  end_date: string;
  cost_estimate: number;
  status: RequestStatus;
  current_approver_role: UserRole | "archive" | "employee";
  approvals: Approval[];
  created_by_role: UserRole;

  fulfillment_status: FulfillmentStatus;
  report_added: boolean;
  report_text: string;
  receiptFiles: FileAttachment[];

  passportPhotos?: FileAttachment[];
  travelTickets?: FileAttachment[];
  hotelBookings?: FileAttachment[];

  is_modified: boolean;
  change_history: ChangeLog[];
  last_modified_actor_id?: number;
  viewed_by_ids: number[];
}

export interface RequestDetail extends RequestData {
  employee_name: string;
}
