// Everything on the public site that the CRM can edit. Client-safe (no Node APIs).
// The values in src/data/* are only the defaults; once the team saves a section, alsafr.content wins.
import { featured as defaultFeatured, packages as defaultPackages, type Package } from "@/data/packages";
import { ALERTS, BOOKING_FORMS, EVENTS, HOT_DEAL_ENDS, NEWS, NOTIFICATIONS, PROMOS, TRAVEL_LINKS, type Alert, type BookingForms, type Event, type News, type Note, type Promo, type TravelLink } from "@/data/updates";
import { img } from "@/data/img";

export type Settings = { heroImage: string; hotDealEnds: string; featured: string[] };

export type Content = {
  packages: Package[];
  alerts: Alert[];
  promos: Promo[];
  notifications: Note[];
  news: News[];
  events: Event[];
  travelLinks: TravelLink[];
  forms: BookingForms;
  settings: Settings;
};

export const DEFAULT_CONTENT: Content = {
  packages: defaultPackages,
  alerts: ALERTS,
  promos: PROMOS,
  notifications: NOTIFICATIONS,
  news: NEWS,
  events: EVENTS,
  travelLinks: TRAVEL_LINKS,
  forms: BOOKING_FORMS,
  settings: { heroImage: img("1514958566123-9ec36678c8c6", 2400), hotDealEnds: HOT_DEAL_ENDS, featured: defaultFeatured.map((p) => p.slug) },
};

/** content plus the lists the site derives from it */
export function derive(c: Content) {
  const { packages } = c;
  return {
    ...c,
    categories: ["All", ...new Set(packages.map((p) => p.category))] as string[],
    deals: packages.filter((p) => p.was),
    featured: c.settings.featured.map((s) => packages.find((p) => p.slug === s)).filter((p): p is Package => !!p),
    /** first package per country, for the globe */
    byCountry: packages.filter((p, i) => packages.findIndex((q) => q.country === p.country) === i),
    departureMonths: [...new Set(packages.flatMap((p) => p.departures.map((d) => d.slice(0, 7))))].sort(),
    countries: [...new Set(packages.map((p) => p.country))],
  };
}

export type Site = ReturnType<typeof derive>;
