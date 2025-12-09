// "employee" | "manager" | "finance" | "archive"

const translateRoles = (
  type: "employee" | "manager" | "finance" | "archive"
) => {
  if (type === "employee") {
    return "работника";
  } else if (type === "manager") {
    return "менеджера";
  } else if (type === "finance") {
    return "финансиста";
  }
};

export default translateRoles;
