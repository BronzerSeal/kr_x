export const parseHeroDate = (d: any): Date | null => {
  if (!d) return null;
  const { year, month, day } = d;
  return new Date(year, month - 1, day);
};
