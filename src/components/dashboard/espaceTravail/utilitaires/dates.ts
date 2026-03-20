export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function formatTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatInputDate(value?: Date | string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}
