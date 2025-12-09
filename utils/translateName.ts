const translateName = (
  type: "employee" | "manager" | "hr" | "finance" | "security"
) => {
  if (type === "employee") {
    return "работник";
  } else if (type === "manager") {
    return "менеджер";
  } else if (type === "hr") {
    return "тревел-координатор";
  } else if (type === "finance") {
    return "финансист";
  } else if (type === "security") {
    return "безопасник";
  }
};

export default translateName;
