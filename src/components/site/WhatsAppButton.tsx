import React from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

interface Props {
  number: string;
  message?: string;
}

export function WhatsAppButton({ number, message }: Props) {
  if (!number) return null;

  const href = buildWhatsAppUrl(
    number,
    message || "Hi, I would like to know more about your courses and batches."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-emerald-700"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp us</span>
    </a>
  );
}
