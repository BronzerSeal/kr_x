import axios from "axios";

export async function getCountryByCity(city: string) {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: city,
        format: "json",
        addressdetails: 1,
        limit: 1, // берём первый результат
      },
    }
  );

  const result = response.data[0];
  if (!result) return null;

  return result.address.country;
}
