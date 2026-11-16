// Site-wide announcements, notifications, news, events and promo codes.
// Edit this file to change what visitors see — every component reads from here.
import { img } from "./img";

export type Alert = { id: string; text: string; href?: string; cta?: string; tone: "deal" | "info" | "new" };

export const ALERTS: Alert[] = [
  { id: "early27", tone: "deal", text: "Early-bird: 10% off every 2027 departure with code EARLY27", href: "/#deals", cta: "See deals" },
  { id: "kashmir-winter", tone: "new", text: "New: Kashmir snow departures from 12 Dec", href: "/packages/kashmir-valleys-and-lakes", cta: "View tour" },
  { id: "concierge", tone: "info", text: "Already travelling? Our 24/7 concierge is on WhatsApp", href: "/#contact", cta: "Contact" },
];

/** the four request forms in the "Book it yourself" slider, in order; the navbar links to them too */
export const BOOK_TABS = [
  { id: "flights", label: "Flights", on: "dummyEnabled" },
  { id: "hotels", label: "Hotels", on: "hotelEnabled" },
  { id: "buses", label: "Buses", on: "busEnabled" },
  { id: "trains", label: "Trains", on: "railEnabled" },
] as const;

/** the Dummy ticket and Rail forms in the "Book it yourself" slider; edited in the CRM (Website content -> Booking forms) */
export type BookingForms = {
  /** photo behind the whole "Book it yourself" section; empty = plain background */
  bgImage: string;
  dummyEnabled: boolean;
  hotelEnabled: boolean;
  busEnabled: boolean;
  hotelStars: string[];
  dummyEyebrow: string;
  dummyHeadline: string;
  dummyPromise: string;
  dummyTag: string;
  dummyBlurb: string;
  dummyClasses: string[];
  railEnabled: boolean;
  railNotice: string;
  /** "Country | iso2" per line: the quick picks under "Train Ticket (Global)" */
  railCountries: string[];
  /** "Country | iso2" per line: the "Country to Visit" list under Rail Passes */
  railPassCountries: string[];
  nationalities: string[];
};

export const BOOKING_FORMS: BookingForms = {
  bgImage: "",
  dummyEnabled: true,
  hotelEnabled: true,
  busEnabled: true,
  hotelStars: ["Any", "3 star", "4 star", "5 star"],
  dummyEyebrow: "Get Your Flight",
  dummyHeadline: "Reservation / Dummy Ticket",
  dummyPromise: "in just 30 Minutes",
  dummyTag: "Fast & Secure Booking",
  dummyBlurb: "Professional flight reservations for visa documentation.\nAccepted for visa applications, onward/return travel proof, visa extensions & passport renewal.",
  dummyClasses: ["Economy", "Business"],
  railEnabled: true,
  railNotice: "Select your country of residence as nationality; booking with the wrong residency or nationality may lead to supplement charges to be paid directly to the rail operator by the guest.",
  railCountries: ["Saudi Arabia | sa", "Japan | jp", "Malaysia | my", "South Korea | kr", "Canada | ca", "United States | us", "Qatar | qa"],
  railPassCountries: ["Switzerland | ch", "France | fr", "Italy | it", "Germany | de", "Spain | es", "Austria | at", "Netherlands | nl", "Eurail Global Pass | eu"],
  nationalities: ["Indian", "Emirati", "Pakistani", "Bangladeshi", "Filipino", "Sri Lankan", "Nepali", "British", "American", "Other"],
};

export type Promo = { code: string; title: string; detail: string; off: string; endsAt: string; href: string };

export const PROMOS: Promo[] = [
  { code: "EARLY27", title: "Early-bird 2027", detail: "Any package departing in 2027", off: "10% off", endsAt: "2026-12-15T23:59:00+04:00", href: "/packages?month=2027-01" },
  { code: "ISLANDS200", title: "Island escapes", detail: "Maldives, Bali, Thailand & Andaman", off: "$200 off", endsAt: "2026-11-30T23:59:00+04:00", href: "/packages?cat=Beach" },
  { code: "GROUP5", title: "Travel as five", detail: "Groups of five or more travellers", off: "5% off", endsAt: "2027-01-31T23:59:00+04:00", href: "/packages" },
];

/** the headline offer used by the countdown and the one-time deal toast */
export const HOT_DEAL_ENDS = "2026-11-30T23:59:00+04:00";

export type Note = { id: string; title: string; body: string; when: string; href: string; kind: "price" | "departure" | "event" | "news" };

export const NOTIFICATIONS: Note[] = [
  { id: "n1", kind: "price", title: "Price drop: Overwater Escape", body: "Now $2,890 per person — save $400 on Maldives villas.", when: "2026-11-03T10:00:00+04:00", href: "/packages/maldives-overwater-escape" },
  { id: "n2", kind: "departure", title: "Boarding soon: Kathmandu & Pokhara", body: "Departing 6 Nov — last seats can still be requested.", when: "2026-11-02T09:00:00+04:00", href: "/packages/nepal-kathmandu-pokhara" },
  { id: "n3", kind: "event", title: "Northern lights season is open", body: "Aurora Hunt departures run until February.", when: "2026-10-30T18:00:00+04:00", href: "/packages/iceland-aurora-hunt" },
  { id: "n4", kind: "news", title: "19 new packages added", body: "Kerala, Sri Lanka, Vietnam, New Zealand and more.", when: "2026-10-28T12:00:00+04:00", href: "/packages" },
];

export type News = { title: string; tag: string; date: string; body: string; image: string; href: string };

export const NEWS: News[] = [
  {
    title: "Nineteen new journeys join the collection",
    tag: "Company",
    date: "2026-10-28",
    body: "From Kerala's backwaters to New Zealand's South Island, the catalogue now spans 18 countries.",
    image: img("1602216056096-3b40cc0c9944", 900),
    href: "/packages",
  },
  {
    title: "Kashmir winter departures open for December",
    tag: "New dates",
    date: "2026-11-01",
    body: "Snow in Gulmarg, a houseboat night on Dal Lake and heated rooms throughout.",
    image: img("1595815771614-ade9d652a65d", 900),
    href: "/packages/kashmir-valleys-and-lakes",
  },
  {
    title: "Live route maps on every package page",
    tag: "Product",
    date: "2026-10-28",
    body: "See every road, flight and ferry of your trip — then press Map tour and fly it.",
    image: img("1488646953014-85cb44e25828", 900),
    href: "/packages/kerala-backwaters-hills",
  },
];

export type Event = { title: string; place: string; start: string; end?: string; body: string; image: string; href: string };

export const EVENTS: Event[] = [
  {
    title: "Pushkar Camel Fair",
    place: "Rajasthan, India",
    start: "2026-11-20",
    end: "2026-11-27",
    body: "Camel traders, folk music and a desert full of colour — pair it with Forts & Dunes.",
    image: img("1654245363109-b873bb61b2fa", 900),
    href: "/packages/rajasthan-forts-and-dunes",
  },
  {
    title: "Dubai Shopping Festival",
    place: "Dubai, UAE",
    start: "2026-12-11",
    end: "2027-01-24",
    body: "Fireworks over the creek, nightly drone shows and city-wide sales.",
    image: img("1512453979798-5ea266f8880c", 900),
    href: "/packages/dubai-city-break",
  },
  {
    title: "Northern lights peak season",
    place: "South Coast, Iceland",
    start: "2026-12-01",
    end: "2027-02-28",
    body: "Long dark nights give the best odds of an aurora over the glass-roof lodge.",
    image: img("1531366936337-7c912a4589a7", 900),
    href: "/packages/iceland-aurora-hunt",
  },
  {
    title: "Cherry blossom season",
    place: "Kyoto & Tokyo, Japan",
    start: "2027-03-25",
    end: "2027-04-10",
    body: "Sakura along the Philosopher's Path — our spring departures are timed for it.",
    image: img("1493976040374-85c8e12f0c0e", 900),
    href: "/packages/kyoto-seasons",
  },
];
