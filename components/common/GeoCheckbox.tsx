"use client";
import { useState, FC } from "react";
import { Checkbox } from "@heroui/react";
import { Address } from "@/hooks/useGeoLocation";
import { toast } from "react-toastify";

interface IProps {
  myAdress: Address | null;
  cityCountry: Address | null;
}

const GeoCheckbox: FC<IProps> = ({ myAdress, cityCountry }) => {
  if (!myAdress || !cityCountry) {
    return <div>Загрузка геолокации...</div>;
  }
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (myAdress && cityCountry && myAdress.country === cityCountry) {
      setChecked(true); // совпадает — ставим галочку
    } else {
      setChecked(false); // не совпадает — снимаем галочку
      toast.error("Страна не совпадает!"); // по желанию уведомление
    }
  };

  return (
    <Checkbox
      size="md"
      color="secondary"
      isSelected={checked}
      onChange={handleCheck}
      isDisabled={checked}
    >
      Подтвердить свою позицию
    </Checkbox>
  );
};

export default GeoCheckbox;
