"use client";

import { useSite } from "./ContentProvider";

/** floating chat button; the number is set in the CRM (Website content -> Homepage), and without one the button is not shown */
export default function WhatsApp() {
  const num = (useSite().settings.whatsapp ?? "").replace(/\D/g, "");
  if (!num) return null;
  return (
    <a
      href={`https://wa.me/${num}?text=${encodeURIComponent("Hi Al-Safar, I'd like some help planning a trip.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      data-cursor="Chat"
      className="fixed bottom-5 right-5 z-[60] flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,.5)] transition-transform hover:scale-110 md:bottom-7 md:right-7"
    >
      <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.900 11.900 0 0 0 4.600 4c1.700.7 2.400.8 3.200.7a2.700 2.700 0 0 0 1.800-1.300c.2-.4.2-.8.200-.9s-.2-.1-.4-.2z" />
      </svg>
    </a>
  );
}

/** shown after an enquiry is submitted: one tap opens WhatsApp with the enquiry pre-written; hidden when no number is set in the CRM */
export function SendOnWhatsApp({ text }: { text?: string }) {
  const num = (useSite().settings.whatsapp ?? "").replace(/\D/g, "");
  if (!num || !text) return null;
  return (
    <a
      href={`https://wa.me/${num}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      Send this on WhatsApp for a faster reply
    </a>
  );
}
