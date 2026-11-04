// Types and constants safe to import from client components (no Node APIs).
export const STAGES = ["new", "contacted", "quoted", "booked", "lost"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", booked: "Booked", lost: "Lost" };

export type Activity = { at: string; text: string; staffName?: string | null };
export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  phone: string;
  source: "Website enquiry" | "Added by team";
  packageSlug: string | null;
  packageTitle: string | null;
  departure: string;
  travellers: number;
  /** quoted / expected value in USD */
  value: number;
  notes: string;
  stage: Stage;
  activity: Activity[];
};

export type LeadInput = Pick<Lead, "name" | "email" | "phone" | "source" | "packageSlug" | "departure" | "travellers" | "notes"> & { value?: number };
