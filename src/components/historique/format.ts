const formatDate = new Intl.DateTimeFormat("fr", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const dateCourte = (t: number): string => formatDate.format(t);

export const nombre = (x: number | null, decimales = 1): string =>
  x === null
    ? "–"
    : x.toLocaleString("fr", { maximumFractionDigits: decimales });
