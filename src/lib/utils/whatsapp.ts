export function buildWhatsAppUrl(number: string, message: string): string {
  const cleaned = (number || "").replace(/[^\d]/g, "");
  const withCountryCode = cleaned.length === 10 ? `91${cleaned}` : cleaned;
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${withCountryCode}?${params.toString()}`;
}

export function courseWhatsAppMessage(courseTitle: string): string {
  return `Hi, I am interested in the ${courseTitle} course.`;
}
