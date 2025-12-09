import { useState, useEffect } from "react";
import axios from "axios";

export type Address = {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  postcode?: string;
};

export function useGeoLocation() {
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    const getLocation = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject("Геолокация не поддерживается");
        }
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

    const fetchLocation = async () => {
      try {
        const position = await getLocation();
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const response = await axios.get(
          "https://nominatim.openstreetmap.org/reverse",
          {
            params: { lat: latitude, lon: longitude, format: "json" },
          }
        );

        setAddress(response.data.address);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLocation();
  }, []);

  return address;
}
