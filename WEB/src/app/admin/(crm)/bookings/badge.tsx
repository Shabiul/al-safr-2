import type { Booking } from "@/lib/ops";

const TONE: Record<Booking["status"], string> = {
  pending: "bg-sand/15 text-sand",
  confirmed: "bg-glow/15 text-glow",
  completed: "bg-[#1fa77a]/15 text-[#1fa77a]",
  cancelled: "bg-ice/10 text-ice/50",
};

export const BookingBadge = ({ status }: { status: Booking["status"] }) => <span className={`label inline-block rounded-full px-2.5 py-1 text-[9px] ${TONE[status]}`}>{status}</span>;
