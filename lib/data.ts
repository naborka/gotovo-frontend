import type { EventCategory, GotovoEvent } from './types';

/**
 * Mock event data for Gotovo.
 * In production, this would come from an API/database.
 */

/**
 * Base date for mock data - using a fixed date to prevent hydration mismatches.
 * In production, dates would come from the database.
 */
const BASE_DATE = new Date('2026-04-29T10:00:00');

/** Helper to create dates relative to base date */
const mkDate = (offsetDays: number, h = 0, m = 0): Date => {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d;
};

export const EVENTS: GotovoEvent[] = [
  {
    uid: '1',
    sourceUrl: 'https://www.fruskagora.rs/events',
    title: 'Sunrise Via Ferrata',
    description:
      'A guided climb up the rocky ridge of Fruska Gora starting at dawn. All gear provided. Moderate fitness required — no prior climbing experience needed. Groups capped at 12.',
    startDate: mkDate(0),
    startTime: '06:30',
    cat: 'Adventure',
    loc: 'Fruska Gora National Park',
    city: 'Novi Sad',
    price: 'Free',
    tags: ['Via Ferrata', 'Nature', 'Guided', 'Morning'],
    createdAt: mkDate(-1, 14, 20),
    sourceCount: 3,
  },
  {
    uid: '2',
    sourceUrl: 'https://www.facebook.com/events/fabrika-novi-sad',
    title: 'Experimental Noise Night',
    description:
      'Three local projects performing uncompromising electronic and noise sets. Expect feedback loops, tape manipulation, and field recordings pressed into uncomfortable shapes. Bar open from 21:00.',
    startDate: mkDate(0),
    startTime: '22:00',
    cat: 'Music',
    loc: 'Fabrika, Liman',
    city: 'Novi Sad',
    price: '500 RSD',
    tags: ['Electronic', 'Live', 'Experimental', 'Late Night'],
    createdAt: mkDate(0, 8, 5),
    sourceCount: 2,
  },
  {
    uid: '3',
    sourceUrl: 'https://t.me/naturalwinesns',
    title: 'Natural Wine Pop-Up',
    description:
      "A curated selection of low-intervention wines from small Serbian and regional producers. The exact address is shared 24 hours before via the organiser's Telegram channel.",
    startDate: mkDate(1),
    startTime: '17:00',
    endTime: '21:00',
    cat: 'Food & Drink',
    loc: 'Dunavski Kej — confirm via Telegram',
    city: 'Novi Sad',
    price: '1200 RSD',
    tags: ['Wine', 'Pop-up', 'Tasting'],
    createdAt: mkDate(0, 10, 30),
    sourceCount: 1,
  },
  {
    uid: '4',
    sourceUrl: 'https://www.studioglina.rs/radionice',
    title: 'Kids Ceramics Masterclass',
    description:
      'A hands-on Saturday session for children aged 6–12. Each child leaves with a finished piece. All materials included. Parents are welcome to stay and watch.',
    startDate: mkDate(1),
    startTime: '10:00',
    endTime: '12:30',
    cat: 'Education',
    loc: 'Studio Glina, Stari Grad',
    city: 'Novi Sad',
    price: '800 RSD',
    tags: ['Kids', 'Craft', 'Workshop'],
    createdAt: mkDate(-2, 9, 0),
    sourceCount: 2,
  },
  {
    uid: '5',
    sourceUrl: 'https://www.eventbrite.com/e/foraging-walk',
    title: 'Foraging Walk — Vojvodina Plants',
    description:
      'A slow two-hour riverside walk with botanist Jelena Maric. Learn to identify edible and medicinal plants growing along the Sodros waterfront. Bring a bag and sturdy shoes.',
    startDate: mkDate(2),
    startTime: '09:00',
    endTime: '11:00',
    cat: 'Adventure',
    loc: 'Sodros, riverside entrance',
    city: 'Novi Sad',
    price: 'Free',
    tags: ['Nature', 'Foraging', 'Guided'],
    createdAt: mkDate(-1, 18, 45),
    sourceCount: 1,
  },
  {
    uid: '6',
    sourceUrl: 'https://www.instagram.com/rooftopbarx',
    title: 'Ambient Dusk Set',
    description:
      'An unannounced ambient performance on the rooftop terrace. One artist, two hours, no setlist. Entry is first-come, limited to 40 people. BYO patience.',
    startDate: mkDate(2),
    startTime: '19:30',
    endTime: '21:30',
    cat: 'Music',
    loc: 'Rooftop Bar X, Centar',
    city: 'Novi Sad',
    price: '300 RSD',
    tags: ['Ambient', 'Outdoors', 'Limited Spots'],
    createdAt: mkDate(0, 9, 55),
    sourceCount: 2,
  },
  {
    uid: '7',
    sourceUrl: 'https://www.petrovaradinjazz.rs',
    title: 'Petrovaradin Jazz Weekend',
    description:
      'Three evenings of jazz across the Petrovaradin Fortress courtyard. Lineup spans local big bands, visiting trios from Vienna and Bratislava, and a late-night jam session open to all musicians on Sunday.',
    startDate: mkDate(3),
    endDate: mkDate(5),
    startTime: '18:00',
    endTime: '23:30',
    cat: 'Music',
    loc: 'Petrovaradin Fortress',
    city: 'Novi Sad',
    price: '1500 RSD',
    tags: ['Jazz', 'Festival', 'Outdoor', 'Multi-day'],
    createdAt: mkDate(-3, 11, 0),
    sourceCount: 4,
  },
  {
    uid: '8',
    sourceUrl: 'https://www.instagram.com/streetfoodbgd',
    title: 'Street Food Festival',
    description:
      "Over 30 vendors across three days: grilled meats, vegan bowls, craft drinks, live cooking demos, and a kids' zone. Location TBA — follow the organiser's Instagram for updates.",
    startDate: mkDate(4),
    endDate: mkDate(6),
    cat: 'Food & Drink',
    city: 'Belgrade',
    tags: ['Street Food', 'Family', 'Outdoor', 'Multi-day'],
    createdAt: mkDate(-1, 16, 10),
    sourceCount: 2,
  },
  {
    uid: '9',
    sourceUrl: 'https://www.culturalcentrebeograd.rs/workshops',
    title: 'Photography Masterclass',
    description:
      'A full-day workshop covering composition, light reading, and post-processing in Lightroom. Suitable for DSLR and mirrorless users. Participants receive a reviewed portfolio at the end.',
    startDate: mkDate(5),
    startTime: '11:00',
    endTime: '17:00',
    cat: 'Education',
    loc: 'Cultural Centre Beograd',
    city: 'Belgrade',
    price: '2000 RSD',
    tags: ['Photography', 'Workshop'],
    createdAt: mkDate(0, 7, 22),
    sourceCount: 1,
  },
  {
    uid: '10',
    sourceUrl: 'https://www.facebook.com/kafebasta',
    title: 'Open Mic Night',
    description:
      'Sign up on the door from 19:00. Five minutes per act — poetry, music, stand-up, spoken word. No auditions, no judgment. House band available for accompaniment.',
    startDate: mkDate(2),
    startTime: '20:00',
    endTime: '23:00',
    cat: 'Music',
    loc: 'Kafe Basta, Centar',
    city: 'Novi Sad',
    price: 'Free',
    tags: ['Live', 'Open Mic', 'Comedy'],
    createdAt: mkDate(0, 11, 5),
    sourceCount: 1,
  },
  {
    uid: '11',
    sourceUrl: 'https://www.instagram.com/yogadunavskipark',
    title: 'Yoga in the Park',
    description:
      'A beginner-friendly outdoor yoga session led by certified instructor Ana Popovic. Bring your own mat. Runs rain or shine — in heavy rain moves to the nearby covered pavilion.',
    startDate: mkDate(1),
    startTime: '08:00',
    endTime: '09:15',
    cat: 'Wellness',
    loc: 'Dunavski Park',
    city: 'Novi Sad',
    price: 'Free',
    tags: ['Yoga', 'Outdoor', 'Morning'],
    createdAt: mkDate(-1, 7, 0),
    sourceCount: 1,
  },
  {
    uid: '12',
    sourceUrl: 'https://www.belgradedw.com',
    title: 'Belgrade Design Week',
    description:
      'Five days of exhibitions, talks, and workshops spanning graphic, product, and architectural design. The opening night features a curated group show from emerging Serbian designers.',
    startDate: mkDate(3),
    endDate: mkDate(7),
    startTime: '17:00',
    endTime: '22:00',
    cat: 'Art',
    loc: 'Dom Omladine',
    city: 'Belgrade',
    price: 'Free',
    tags: ['Design', 'Exhibition', 'Opening', 'Multi-day'],
    createdAt: mkDate(0, 12, 0),
    sourceCount: 3,
  },
];

/** All unique categories from events */
export const ALL_CATEGORIES: EventCategory[] = [
  ...new Set(EVENTS.map((e) => e.cat)),
].sort() as EventCategory[];

/** All unique cities from events */
export const ALL_CITIES: string[] = [
  ...new Set(EVENTS.map((e) => e.city).filter(Boolean)),
].sort() as string[];

/** All unique tags from events */
export const ALL_TAGS: string[] = [...new Set(EVENTS.flatMap((e) => e.tags))].sort();

/** Sentinel value for "no filter active" */
export const ALL_FILTER = 'all';
