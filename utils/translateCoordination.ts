const translateCoordination = (
  type: "rejected" | "approved" | "modified" | "resubmitted"
) => {
  if (type === "rejected") {
    return "отклонено";
  } else if (type === "approved") {
    return "принято";
  } else if (type === "modified") {
    return "изменено";
  } else if (type === "resubmitted") {
    return "отправлено";
  }
};

export default translateCoordination;
