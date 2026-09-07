/** Builds a wa.me deep link with a prefilled message. Never sends automatically. */
export function buildWhatsAppLink(message: string, phone?: string): string {
  const encoded = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
