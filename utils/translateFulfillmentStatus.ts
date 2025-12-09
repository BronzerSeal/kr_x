const translateFulfillmentStatus = (
  type: "waiting_dates" | "in_progress" | "returned"
) => {
  if (type === "waiting_dates") {
    return "ожидание документов";
  } else if (type === "in_progress") {
    return "в поездке";
  } else if (type === "returned") {
    return "вернулся";
  }
};

export default translateFulfillmentStatus;
