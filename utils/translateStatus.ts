const translateStatus = (
  type:
    | "awaiting_manager"
    | "awaiting_hr"
    | "awaiting_finance"
    | "rejected"
    | "created"
    | "awaiting_employee_action"
    | "awaiting_report_approval"
    | "completed"
) => {
  if (type === "awaiting_hr") {
    return "ожидание т-к";
  } else if (type === "awaiting_manager") {
    return "ожидание менеджерa";
  } else if (type === "awaiting_finance") {
    return "ожидание финансистa";
  } else if (type === "rejected") {
    return "заявка отклонена";
  } else if (type === "created") {
    return "заявка создана";
  } else if (type === "awaiting_employee_action") {
    return "ожидание работника";
  } else if (type === "awaiting_report_approval") {
    return "рассмотрение рапорта";
  } else if (type === "completed") {
    return "завершена";
  }
};

export default translateStatus;
