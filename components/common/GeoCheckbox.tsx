"use client";
import { useState, FC } from "react";
import { Checkbox } from "@heroui/react";
import { Address } from "@/hooks/useGeoLocation";
import { toast } from "react-toastify";
import { approveDestination } from "@/actions/approveDestination";

interface IProps {
  myAdress: Address | null;
  cityCountry: Address | null;
  request_id: number;
  isApproved: boolean;
}

const GeoCheckbox: FC<IProps> = ({
  myAdress,
  cityCountry,
  request_id,
  isApproved,
}) => {
  if (!myAdress || !cityCountry) {
    return <div>Загрузка геолокации...</div>;
  }
  const [checked, setChecked] = useState(false);

  const handleApprove = async () => {
    const res = await approveDestination(request_id);
    return res;
  };

  const handleCheck = () => {
    if (myAdress && cityCountry && myAdress.country === cityCountry) {
      setChecked(true); // совпадает — ставим галочку
      handleApprove();
    } else {
      setChecked(false); // не совпадает — снимаем галочку
      toast.error("Страна не совпадает!"); // по желанию уведомление
    }
  };

  return (
    <Checkbox
      size="md"
      color="secondary"
      isSelected={isApproved || checked}
      onChange={handleCheck}
      isDisabled={isApproved || checked}
    >
      Подтвердить свою позицию
    </Checkbox>
  );
};

export default GeoCheckbox;
