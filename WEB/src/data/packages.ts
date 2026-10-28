export type Category = "Beach" | "Mountains" | "City" | "Adventure" | "Culture";

export type Package = {
  slug: string;
  title: string;
  place: string;
  country: string;
  category: Category;
  days: number;
  price: number;
  rating: number;
  image: string;
  gallery: string[];
  tagline: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  itinerary: { title: string; desc: string }[];
  coords: [lat: number, lon: number];
  /** stops in order; nights add up to days - 1 */
  route: Stop[];
  stars: 3 | 4 | 5;
  mealPlan: MealPlan;
  flights: boolean;
  freeCancellation?: boolean;
  exclusions?: string[];
  tourStyle: TourStyle;
  groupSize: string;
  bestTime: string;
  /** ISO dates of scheduled departures */
  departures: string[];
  /** previous per-person price when the package is on offer */
  was?: number;
};

export type TourStyle = "Customized Holiday" | "Group Trip" | "Guided Tour" | "Private Tour" | "Self-Drive";

export type Stop = { place: string; nights: number; stay: string; coords: [lat: number, lon: number] };

export type MealPlan = "Breakfast" | "Half board" | "Full board" | "All meals";

import { img } from "./img";
import { extraPackages } from "./more-packages";

// every package ships with these on top of its own inclusions
export const STANDARD_INCLUSIONS = ["Airport transfers on arrival and departure", "Hotel taxes and service charges", "24/7 on-trip concierge on WhatsApp"];

export const DEFAULT_EXCLUSIONS = [
  "Visa fees unless stated",
  "Meals not listed in the meal plan",
  "Entry tickets not mentioned in the itinerary",
  "Personal expenses such as laundry, tips and drinks",
  "Anything not listed under inclusions",
];

export const IMPORTANT_NOTES = [
  "Prices are per person sharing a double room and may change with flight and hotel availability.",
  "Hotels named as a category are confirmed at booking; we always send names before you pay.",
  "Itinerary order can shift for weather, local holidays or ferry and flight timings.",
  "Carry a passport valid for at least six months from your return date.",
];

export const TERMS = [
  ["Booking & payment", "A 25% deposit confirms your booking. The balance is due 30 days before departure."],
  ["Cancellations", "Free cancellation up to 45 days before travel where marked. After that, 25% to 100% of the package price applies depending on how close to departure you cancel."],
  ["Changes", "Date or name changes are free once, more than 30 days before departure, subject to airline and hotel rules."],
  ["Insurance", "Travel insurance is strongly recommended and is included where listed under inclusions."],
] as const;

export const packages: Package[] = [
  {
    slug: "maldives-overwater-escape",
    title: "Overwater Escape",
    place: "Malé Atoll",
    country: "Maldives",
    category: "Beach",
    days: 6,
    price: 2890,
    rating: 4.9,
    image: img("1514282401047-d79a71a590e8"),
    gallery: [img("1544551763-46a013bb70d5", 1000), img("1507525428034-b723cf961d3e", 1000)],
    tagline: "Glass-floor villas over a turquoise lagoon.",
    description:
      "Five nights in a private overwater villa with sunrise decks, reef snorkelling straight off your ladder and a sandbank dinner under the stars.",
    highlights: ["Private overwater villa", "Sandbank candlelit dinner", "Manta ray snorkel safari", "Seaplane transfer"],
    inclusions: ["5 nights overwater villa", "Half-board meals", "Seaplane transfers", "Snorkel gear & 2 excursions"],
    itinerary: [
      { title: "Arrive by seaplane", desc: "Land in Malé, board the seaplane and glide over atolls to your villa. Welcome coconut and sunset cruise." },
      { title: "House reef", desc: "Guided snorkel of the house reef with turtles and reef sharks. Afternoon spa ritual." },
      { title: "Manta safari", desc: "Speedboat trip to the manta cleaning station, then a picnic on a deserted island." },
      { title: "Slow day", desc: "Free day for the lagoon. In the evening, a private dinner on a sandbank lit by torches." },
      { title: "Dolphin cruise", desc: "Morning at leisure, golden-hour dhoni cruise with spinner dolphins." },
      { title: "Depart", desc: "Breakfast in-villa and seaplane back to Malé for your flight home." },
    ],
    coords: [4.17, 73.5],
    route: [{ place: "Malé Atoll", nights: 5, stay: "Overwater villa", coords: [4.17, 73.5] }],
    stars: 5,
    mealPlan: "Half board",
    flights: true,
    tourStyle: "Customized Holiday",
    groupSize: "Couples & families",
    bestTime: "Nov – Apr",
    departures: ["2026-11-14", "2026-12-05", "2027-01-09", "2027-02-13"],
    was: 3290,
  },
  {
    slug: "bali-temples-and-rice",
    title: "Temples & Rice Terraces",
    place: "Ubud",
    country: "Indonesia",
    category: "Culture",
    days: 7,
    price: 1490,
    rating: 4.8,
    image: img("1537996194471-e657df975ab4"),
    gallery: [img("1520250497591-112f2f40a3f4", 1000), img("1469474968028-56623f02e42e", 1000)],
    tagline: "Jungle villas, water temples and volcano sunrises.",
    description:
      "A week between Ubud's jungle and Bali's southern cliffs: temple blessings, a Mount Batur sunrise trek, rice terrace walks and a cooking class with a local family.",
    highlights: ["Mount Batur sunrise trek", "Tirta Empul water blessing", "Tegallalang rice terraces", "Uluwatu kecak fire dance"],
    inclusions: ["6 nights pool villas", "Daily breakfast + 3 dinners", "Private driver-guide", "All temple entries"],
    itinerary: [
      { title: "Welcome to Ubud", desc: "Private transfer to your jungle pool villa. Evening Balinese massage." },
      { title: "Rice & temples", desc: "Walk the Tegallalang terraces, then a purification ritual at Tirta Empul." },
      { title: "Volcano sunrise", desc: "2am start for the Mount Batur trek, breakfast cooked on volcanic steam." },
      { title: "Cooking class", desc: "Market visit and cooking class in a family compound. Afternoon free." },
      { title: "To the cliffs", desc: "Drive south to Uluwatu. Sunset kecak dance on the clifftop temple." },
      { title: "Beach day", desc: "Free day at Padang Padang or a surf lesson." },
      { title: "Depart", desc: "Transfer to Denpasar airport." },
    ],
    coords: [-8.5, 115.26],
    route: [{ place: "Ubud", nights: 4, stay: "Jungle pool villa", coords: [-8.51, 115.26] }, { place: "Uluwatu", nights: 2, stay: "Cliff-top villa", coords: [-8.83, 115.09] }],
    stars: 5,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Guided Tour",
    groupSize: "Max 12 guests",
    bestTime: "Apr – Oct",
    departures: ["2026-11-21", "2027-01-16", "2027-03-06"],
  },
  {
    slug: "santorini-caldera-days",
    title: "Caldera Days",
    place: "Oia",
    country: "Greece",
    category: "Beach",
    days: 5,
    price: 1990,
    rating: 4.9,
    image: img("1570077188670-e3a8d69ac5ff"),
    gallery: [img("1533105079780-92b9be482077", 1000), img("1507525428034-b723cf961d3e", 1000)],
    tagline: "Whitewashed cave suites above the Aegean.",
    description:
      "Cave suites carved into the caldera, a catamaran cruise to the hot springs and wine tasting among volcanic vineyards.",
    highlights: ["Caldera-view cave suite", "Sunset catamaran cruise", "Volcanic wine tasting", "Oia sunset spot reserved"],
    inclusions: ["4 nights cave suite", "Daily breakfast", "Catamaran with BBQ lunch", "Winery tour"],
    itinerary: [
      { title: "Arrive in Oia", desc: "Transfer to your cave suite. Sunset aperitif on the terrace." },
      { title: "Catamaran", desc: "Sail to the volcano, swim in the hot springs and Red Beach. BBQ on board." },
      { title: "Wine country", desc: "Tour three family wineries and taste Assyrtiko grown in volcanic ash." },
      { title: "Fira to Oia hike", desc: "Morning caldera rim hike, afternoon free, reserved sunset table in Oia." },
      { title: "Depart", desc: "Breakfast and transfer to the airport." },
    ],
    coords: [36.46, 25.38],
    route: [{ place: "Oia", nights: 4, stay: "Caldera cave suite", coords: [36.46, 25.38] }],
    stars: 5,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Customized Holiday",
    groupSize: "Couples",
    bestTime: "May – Oct",
    departures: ["2027-04-24", "2027-05-15", "2027-06-05"],
  },
  {
    slug: "iceland-aurora-hunt",
    title: "Aurora Hunt",
    place: "Reykjavík & South Coast",
    country: "Iceland",
    category: "Adventure",
    days: 6,
    price: 2390,
    rating: 4.8,
    image: img("1531366936337-7c912a4589a7"),
    gallery: [img("1476514525535-07fb3b4ae5f1", 1000), img("1501785888041-af3ef285b470", 1000)],
    tagline: "Glacier caves, black sand and the northern lights.",
    description:
      "Chase the aurora in a glass-roofed lodge, walk inside a blue ice cave, and soak in a geothermal lagoon between waterfalls and black sand beaches.",
    highlights: ["Glass-roof aurora lodge", "Blue ice cave tour", "Golden Circle", "Geothermal lagoon"],
    inclusions: ["5 nights hotels & lodge", "Breakfast + 2 dinners", "4x4 super-jeep tours", "Lagoon entry"],
    itinerary: [
      { title: "Reykjavík", desc: "Arrive, check in downtown. Evening food walk through the old harbour." },
      { title: "Golden Circle", desc: "Þingvellir rift valley, Geysir and Gullfoss by super-jeep." },
      { title: "South Coast", desc: "Seljalandsfoss, Skógafoss and Reynisfjara black beach. Night in the aurora lodge." },
      { title: "Ice cave", desc: "Glacier hike into a natural blue ice cave. Aurora wake-up call at night." },
      { title: "Lagoon", desc: "Return west via the geothermal lagoon for a long soak." },
      { title: "Depart", desc: "Transfer to Keflavík." },
    ],
    coords: [64.14, -21.94],
    route: [{ place: "Reykjavík", nights: 2, stay: "Harbour boutique hotel", coords: [64.14, -21.94] }, { place: "South Coast", nights: 3, stay: "Glass-roof aurora lodge", coords: [63.53, -19.51] }],
    stars: 4,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Guided Tour",
    groupSize: "Max 10 guests",
    bestTime: "Oct – Mar",
    departures: ["2026-11-28", "2026-12-19", "2027-01-23", "2027-02-20"],
    was: 2690,
  },
  {
    slug: "kyoto-seasons",
    title: "Kyoto Seasons",
    place: "Kyoto & Tokyo",
    country: "Japan",
    category: "Culture",
    days: 8,
    price: 3190,
    rating: 4.9,
    image: img("1493976040374-85c8e12f0c0e"),
    gallery: [img("1545569341-9eb8b30979d9", 1000), img("1540959733332-eab4deabeeaf", 1000)],
    tagline: "Ryokans, tea ceremonies and neon nights.",
    description:
      "From Tokyo's neon to Kyoto's lantern-lit lanes: a night in a traditional ryokan, a private tea ceremony, bamboo groves at dawn and the bullet train in between.",
    highlights: ["Ryokan with kaiseki dinner", "Private tea ceremony", "Arashiyama bamboo at dawn", "Shinkansen bullet train"],
    inclusions: ["7 nights hotels + ryokan", "Daily breakfast + kaiseki", "7-day JR rail pass", "Guided city tours"],
    itinerary: [
      { title: "Tokyo", desc: "Arrive and check in at Shinjuku. Evening at Omoide Yokocho." },
      { title: "Old & new Tokyo", desc: "Asakusa temple, Shibuya crossing and teamLab digital art." },
      { title: "Bullet train", desc: "Shinkansen to Kyoto, Fushimi Inari's thousand gates in the afternoon." },
      { title: "Gion", desc: "Private tea ceremony, then an evening walk through the geisha district." },
      { title: "Arashiyama", desc: "Bamboo grove at dawn, monkey park and river boat." },
      { title: "Ryokan night", desc: "Move to a hot-spring ryokan. Kaiseki dinner in your room." },
      { title: "Nara", desc: "Day trip to Nara's giant Buddha and friendly deer." },
      { title: "Depart", desc: "Train to Kansai airport." },
    ],
    coords: [35.01, 135.77],
    route: [{ place: "Tokyo", nights: 2, stay: "Shinjuku design hotel", coords: [35.69, 139.7] }, { place: "Kyoto", nights: 3, stay: "Gion boutique hotel", coords: [35.0, 135.78] }, { place: "Kyoto hills", nights: 2, stay: "Hot-spring ryokan", coords: [35.02, 135.68] }],
    stars: 5,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Guided Tour",
    groupSize: "Max 14 guests",
    bestTime: "Mar – May, Oct – Nov",
    departures: ["2026-11-07", "2027-03-27", "2027-04-10"],
  },
  {
    slug: "dubai-desert-skyline",
    title: "Desert & Skyline",
    place: "Dubai",
    country: "UAE",
    category: "City",
    days: 5,
    price: 1290,
    rating: 4.7,
    image: img("1512453979798-5ea266f8880c"),
    gallery: [img("1500530855697-b586d89ba3ee", 1000), img("1571896349842-33c89424de2d", 1000)],
    tagline: "Dune bashing by day, the Burj by night.",
    description:
      "Five days of superlatives: the world's tallest tower, a desert camp under the stars, a dhow dinner cruise and the gold and spice souks.",
    highlights: ["Burj Khalifa at sunset", "Desert safari & camp dinner", "Dhow marina cruise", "Old Dubai souks"],
    inclusions: ["4 nights 5★ hotel", "Daily breakfast + 2 dinners", "Desert safari", "Burj Khalifa tickets"],
    itinerary: [
      { title: "Arrive", desc: "Transfer to your hotel on Palm Jumeirah. Evening on the boardwalk." },
      { title: "Old Dubai", desc: "Abra across the creek, gold and spice souks, Al Fahidi quarter." },
      { title: "Desert", desc: "Dune bashing, camel ride, falconry and a Bedouin camp dinner." },
      { title: "Skyline", desc: "Burj Khalifa sunset slot, fountain show, dhow dinner cruise." },
      { title: "Depart", desc: "Leisure morning and airport transfer." },
    ],
    coords: [25.2, 55.27],
    route: [{ place: "Palm Jumeirah", nights: 4, stay: "5★ beach resort", coords: [25.11, 55.14] }],
    stars: 5,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Private Tour",
    groupSize: "Any size",
    bestTime: "Nov – Mar",
    departures: ["2026-11-12", "2026-12-03", "2027-01-14", "2027-02-11"],
  },
  {
    slug: "paris-in-bloom",
    title: "Paris in Bloom",
    place: "Paris",
    country: "France",
    category: "City",
    days: 5,
    price: 1690,
    rating: 4.8,
    image: img("1502602898657-3e91760cbb34"),
    gallery: [img("1549144511-f099e773c147", 1000), img("1414235077428-338989a2e8c0", 1000)],
    tagline: "Seine cruises, croissants and the Louvre after hours.",
    description:
      "A boutique stay in Saint-Germain, skip-the-line Louvre and Eiffel access, a Seine dinner cruise and a day among the gardens of Versailles.",
    highlights: ["Eiffel Tower summit", "Louvre skip-the-line", "Seine dinner cruise", "Versailles gardens"],
    inclusions: ["4 nights boutique hotel", "Daily breakfast", "Museum pass", "Versailles day trip"],
    itinerary: [
      { title: "Bonjour", desc: "Check in at Saint-Germain. Evening Seine dinner cruise." },
      { title: "Icons", desc: "Eiffel summit, Trocadéro and an afternoon pastry workshop." },
      { title: "Louvre & Marais", desc: "Guided Louvre highlights, then wander the Marais." },
      { title: "Versailles", desc: "Palace and gardens by bike, fountain show in season." },
      { title: "Au revoir", desc: "Montmartre morning and transfer to CDG." },
    ],
    coords: [48.86, 2.35],
    route: [{ place: "Paris", nights: 4, stay: "Saint-Germain boutique hotel", coords: [48.85, 2.33] }],
    stars: 4,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Customized Holiday",
    groupSize: "Couples & friends",
    bestTime: "Apr – Jun, Sep",
    departures: ["2027-04-08", "2027-05-06", "2027-09-16"],
  },
  {
    slug: "swiss-alps-summits",
    title: "Alpine Summits",
    place: "Zermatt & Interlaken",
    country: "Switzerland",
    category: "Mountains",
    days: 7,
    price: 3490,
    rating: 4.9,
    image: img("1506905925346-21bda4d32df4"),
    gallery: [img("1501785888041-af3ef285b470", 1000), img("1476514525535-07fb3b4ae5f1", 1000)],
    tagline: "Panorama trains and Matterhorn mornings.",
    description:
      "Ride the Glacier Express between Zermatt and the Bernese Oberland, wake up to the Matterhorn and stand on the Top of Europe at Jungfraujoch.",
    highlights: ["Glacier Express panorama train", "Matterhorn view chalet", "Jungfraujoch", "Lake Brienz cruise"],
    inclusions: ["6 nights chalet hotels", "Half-board", "Swiss Travel Pass", "Jungfraujoch tickets"],
    itinerary: [
      { title: "Zurich to Zermatt", desc: "Scenic rail to car-free Zermatt. Fondue dinner." },
      { title: "Gornergrat", desc: "Cog railway to 3,089 m for Matterhorn and glacier views." },
      { title: "Glacier Express", desc: "Eight hours of panorama windows to Andermatt, onward to Interlaken." },
      { title: "Top of Europe", desc: "Jungfraujoch ice palace and Sphinx observatory." },
      { title: "Lakes", desc: "Turquoise Lake Brienz cruise and Giessbach falls." },
      { title: "Paragliding", desc: "Optional tandem flight over Interlaken, afternoon free." },
      { title: "Depart", desc: "Train back to Zurich airport." },
    ],
    coords: [46.02, 7.75],
    route: [{ place: "Zermatt", nights: 2, stay: "Matterhorn-view chalet", coords: [46.02, 7.75] }, { place: "Interlaken", nights: 4, stay: "Lakeside grand hotel", coords: [46.69, 7.86] }],
    stars: 4,
    mealPlan: "Half board",
    flights: true,
    tourStyle: "Guided Tour",
    groupSize: "Max 12 guests",
    bestTime: "Jun – Sep",
    departures: ["2027-06-12", "2027-07-10", "2027-08-14"],
  },
  {
    slug: "kenya-great-migration",
    title: "Great Migration",
    place: "Maasai Mara",
    country: "Kenya",
    category: "Adventure",
    days: 6,
    price: 3890,
    rating: 5.0,
    image: img("1516426122078-c23e76319801"),
    gallery: [img("1469474968028-56623f02e42e", 1000), img("1501785888041-af3ef285b470", 1000)],
    tagline: "Tented camps, big five and a balloon at dawn.",
    description:
      "Luxury tented camps on the Mara, twice-daily game drives with Maasai guides and a hot-air balloon over the herds at sunrise.",
    highlights: ["Hot-air balloon safari", "Big five game drives", "Maasai village visit", "Bush breakfast"],
    inclusions: ["5 nights luxury tented camp", "All meals & drinks", "Bush flights", "Park fees"],
    itinerary: [
      { title: "Nairobi", desc: "Arrive and stay at a giraffe manor-style lodge." },
      { title: "Fly to the Mara", desc: "Bush flight to the airstrip, afternoon game drive." },
      { title: "Balloon", desc: "Sunrise balloon over the plains, champagne bush breakfast." },
      { title: "River crossing", desc: "Full day by the Mara river for wildebeest crossings (in season)." },
      { title: "Maasai day", desc: "Village visit and a walking safari with Maasai warriors." },
      { title: "Depart", desc: "Final drive and flight back to Nairobi." },
    ],
    coords: [-1.5, 35.14],
    route: [{ place: "Nairobi", nights: 1, stay: "Garden lodge", coords: [-1.29, 36.82] }, { place: "Maasai Mara", nights: 4, stay: "Luxury tented camp", coords: [-1.5, 35.14] }],
    stars: 5,
    mealPlan: "All meals",
    flights: true,
    tourStyle: "Private Tour",
    groupSize: "2 – 6 guests",
    bestTime: "Jul – Oct",
    departures: ["2027-07-17", "2027-08-07", "2027-09-04"],
  },
  {
    slug: "india-golden-triangle",
    title: "Golden Triangle",
    place: "Delhi · Agra · Jaipur",
    country: "India",
    category: "Culture",
    days: 7,
    price: 1190,
    rating: 4.7,
    image: img("1524492412937-b28074a5d7da"),
    gallery: [img("1582719478250-c89cae4dc85b", 1000), img("1414235077428-338989a2e8c0", 1000)],
    tagline: "The Taj at sunrise, palaces in pink.",
    description:
      "Old Delhi's bazaars, the Taj Mahal at first light and Jaipur's palaces, with heritage haveli stays and a private guide throughout.",
    highlights: ["Taj Mahal sunrise", "Amber Fort", "Old Delhi rickshaw tour", "Heritage haveli stay"],
    inclusions: ["6 nights heritage hotels", "Daily breakfast + 3 dinners", "Private AC car & guide", "Monument entries"],
    itinerary: [
      { title: "Delhi", desc: "Arrive and check in. Evening at India Gate." },
      { title: "Old & New Delhi", desc: "Rickshaw through Chandni Chowk, Jama Masjid, Humayun's Tomb." },
      { title: "To Agra", desc: "Drive to Agra, Agra Fort and Mehtab Bagh at sunset." },
      { title: "Taj sunrise", desc: "Taj Mahal at dawn, then on to Jaipur via Fatehpur Sikri." },
      { title: "Pink City", desc: "Amber Fort, City Palace and Hawa Mahal." },
      { title: "Crafts", desc: "Block-printing workshop and a farewell Rajasthani dinner." },
      { title: "Depart", desc: "Drive back to Delhi airport." },
    ],
    coords: [27.17, 78.04],
    route: [{ place: "Delhi", nights: 2, stay: "Heritage hotel", coords: [28.61, 77.21] }, { place: "Agra", nights: 1, stay: "Taj-view hotel", coords: [27.17, 78.04] }, { place: "Jaipur", nights: 3, stay: "Restored haveli", coords: [26.91, 75.79] }],
    stars: 4,
    mealPlan: "Breakfast",
    flights: true,
    tourStyle: "Private Tour",
    groupSize: "Any size",
    bestTime: "Oct – Mar",
    departures: ["2026-11-19", "2026-12-10", "2027-01-21", "2027-02-18"],
    was: 1490,
  },
];

packages.push(...extraPackages);

export const categories = ["All", ...new Set(packages.map((p) => p.category))] as const;

export const getPackage = (slug: string) => packages.find((p) => p.slug === slug);

export const tourStyles: TourStyle[] = ["Customized Holiday", "Group Trip", "Guided Tour", "Private Tour", "Self-Drive"];

export const nightsOf = (p: Package) => p.route.reduce((n, s) => n + s.nights, 0);

export const durationLabel = (p: Package) => {
  const n = nightsOf(p);
  return n === 0 ? "Day trip" : `${n} ${n === 1 ? "Night" : "Nights"} / ${n + 1} Days`;
};

/** "1N Kandy · 2N Ella" */
export const routeLabel = (p: Package) =>
  p.route.filter((s) => s.nights > 0).map((s) => `${s.nights}N ${s.place}`).join(" · ") || p.route[0].place;

/** places shown on cards: "Kandy, Ella +2 more" */
export const placesLabel = (p: Package) => {
  const names = [...new Set(p.route.map((s) => s.place))];
  return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2} more` : names.join(", ");
};

export const activitiesOf = (p: Package) => Math.max(1, p.itinerary.length - 2);

export const offPercent = (p: Package) => (p.was ? Math.round(((p.was - p.price) / p.was) * 100) : 0);

/** which stop the traveller sleeps at on day i (0-based); the last day is departure */
export const stopForDay = (p: Package, i: number) => {
  let acc = 0;
  for (const s of p.route) {
    acc += s.nights;
    if (i < acc) return s;
  }
  return p.route[p.route.length - 1];
};

export const exclusionsOf = (p: Package) => [...(p.flights ? [] : ["International and domestic flights"]), ...(p.exclusions ?? DEFAULT_EXCLUSIONS)];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-14" → "14 Nov 2026" (manual so server and client render the same text) */
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** "2026-11" → "Nov 2026" */
export const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** every month that has at least one departure, sorted */
export const departureMonths = [...new Set(packages.flatMap((p) => p.departures.map((d) => d.slice(0, 7))))].sort();

export const deals = packages.filter((p) => p.was);

// hand-picked mix for the home-page rail
export const featured = [
  "kerala-backwaters-hills",
  "maldives-overwater-escape",
  "thailand-islands-trio",
  "kyoto-seasons",
  "bali-and-gili-islands",
  "dubai-and-abu-dhabi",
  "sri-lanka-hill-country-coast",
  "iceland-aurora-hunt",
  "amalfi-to-paris-grand-tour",
  "kenya-great-migration",
].map((slug) => packages.find((p) => p.slug === slug)!);

/** first package per country, for the globe */
export const byCountry = packages.filter((p, i) => packages.findIndex((q) => q.country === p.country) === i);
