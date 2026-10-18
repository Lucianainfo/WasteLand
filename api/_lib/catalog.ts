import { pick, randomInt, seededRandom } from './random.js'

export type Category = 'bakery' | 'cafe' | 'restaurant' | 'patisserie' | 'grocery'
export type Diet = 'vegan' | 'vegetarian' | 'meat'

export interface City {
  id: string
  name: string
  country: string
  lat: number
  lon: number
  /** IANA time zone — every venue closes on local time, so the same moment is "last call" in one city and breakfast in another. */
  tz: string
  currency: string
  /** Rough local-currency value of 1 EUR, used to turn the catalogue's base prices into local prices. */
  rate: number
  /** Other spellings people type: local names, Romanian and Russian names, common abbreviations. */
  aliases: string[]
}

export interface Item {
  category: Category
  diet: Diet
  glutenFree: boolean
  /** Full (pre-discount) price of one portion, in EUR. */
  baseEur: number
  /** Weight of one portion, used for the "kg of food rescued" and CO2e figures. */
  kg: number
}

export interface Venue {
  id: string
  name: string
  category: Category
  lat: number
  lon: number
  /** Local closing times for this venue's surplus slots, in minutes after midnight (e.g. 1170 = 19:30). */
  closeMinutes: number[]
}

export const CITIES: City[] = [
  { id: 'bucharest', name: 'Bucharest', country: 'RO', lat: 44.43, lon: 26.1, tz: 'Europe/Bucharest', currency: 'RON', rate: 5, aliases: ['bucuresti', 'bucurești', 'бухарест'] },
  { id: 'chisinau', name: 'Chisinau', country: 'MD', lat: 47.01, lon: 28.86, tz: 'Europe/Chisinau', currency: 'MDL', rate: 19, aliases: ['chișinău', 'chisinău', 'кишинев', 'кишинёв'] },
  { id: 'london', name: 'London', country: 'GB', lat: 51.51, lon: -0.13, tz: 'Europe/London', currency: 'GBP', rate: 0.85, aliases: ['londra', 'лондон'] },
  { id: 'paris', name: 'Paris', country: 'FR', lat: 48.86, lon: 2.35, tz: 'Europe/Paris', currency: 'EUR', rate: 1, aliases: ['париж'] },
  { id: 'berlin', name: 'Berlin', country: 'DE', lat: 52.52, lon: 13.4, tz: 'Europe/Berlin', currency: 'EUR', rate: 1, aliases: ['берлин'] },
  { id: 'rome', name: 'Rome', country: 'IT', lat: 41.9, lon: 12.5, tz: 'Europe/Rome', currency: 'EUR', rate: 1, aliases: ['roma', 'рим'] },
  { id: 'madrid', name: 'Madrid', country: 'ES', lat: 40.42, lon: -3.7, tz: 'Europe/Madrid', currency: 'EUR', rate: 1, aliases: ['мадрид'] },
  { id: 'vienna', name: 'Vienna', country: 'AT', lat: 48.21, lon: 16.37, tz: 'Europe/Vienna', currency: 'EUR', rate: 1, aliases: ['viena', 'wien', 'вена'] },
  { id: 'amsterdam', name: 'Amsterdam', country: 'NL', lat: 52.37, lon: 4.9, tz: 'Europe/Amsterdam', currency: 'EUR', rate: 1, aliases: ['амстердам'] },
  { id: 'copenhagen', name: 'Copenhagen', country: 'DK', lat: 55.68, lon: 12.57, tz: 'Europe/Copenhagen', currency: 'DKK', rate: 7.5, aliases: ['copenhaga', 'københavn', 'kobenhavn', 'копенгаген'] },
  { id: 'warsaw', name: 'Warsaw', country: 'PL', lat: 52.23, lon: 21.01, tz: 'Europe/Warsaw', currency: 'PLN', rate: 4.3, aliases: ['varsovia', 'varșovia', 'warszawa', 'варшава'] },
  { id: 'istanbul', name: 'Istanbul', country: 'TR', lat: 41.01, lon: 28.98, tz: 'Europe/Istanbul', currency: 'TRY', rate: 45, aliases: ['i̇stanbul', 'стамбул'] },
  { id: 'new-york', name: 'New York', country: 'US', lat: 40.71, lon: -74.01, tz: 'America/New_York', currency: 'USD', rate: 1.08, aliases: ['new york city', 'nyc', 'нью-йорк', 'нью йорк'] },
  { id: 'los-angeles', name: 'Los Angeles', country: 'US', lat: 34.05, lon: -118.24, tz: 'America/Los_Angeles', currency: 'USD', rate: 1.08, aliases: ['la', 'лос-анджелес', 'лос анджелес'] },
  { id: 'toronto', name: 'Toronto', country: 'CA', lat: 43.65, lon: -79.38, tz: 'America/Toronto', currency: 'CAD', rate: 1.5, aliases: ['торонто'] },
  { id: 'mexico-city', name: 'Mexico City', country: 'MX', lat: 19.43, lon: -99.13, tz: 'America/Mexico_City', currency: 'MXN', rate: 20, aliases: ['ciudad de mexico', 'ciudad de méxico', 'cdmx', 'мехико'] },
  { id: 'sao-paulo', name: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63, tz: 'America/Sao_Paulo', currency: 'BRL', rate: 6, aliases: ['sao paulo', 'сан-паулу', 'сан паулу'] },
  { id: 'cairo', name: 'Cairo', country: 'EG', lat: 30.04, lon: 31.24, tz: 'Africa/Cairo', currency: 'EGP', rate: 55, aliases: ['kairo', 'каир'] },
  { id: 'lagos', name: 'Lagos', country: 'NG', lat: 6.52, lon: 3.38, tz: 'Africa/Lagos', currency: 'NGN', rate: 1700, aliases: ['лагос'] },
  { id: 'nairobi', name: 'Nairobi', country: 'KE', lat: -1.29, lon: 36.82, tz: 'Africa/Nairobi', currency: 'KES', rate: 140, aliases: ['найроби'] },
  { id: 'cape-town', name: 'Cape Town', country: 'ZA', lat: -33.92, lon: 18.42, tz: 'Africa/Johannesburg', currency: 'ZAR', rate: 20, aliases: ['capetown', 'кейптаун'] },
  { id: 'dubai', name: 'Dubai', country: 'AE', lat: 25.2, lon: 55.27, tz: 'Asia/Dubai', currency: 'AED', rate: 4, aliases: ['дубай'] },
  { id: 'mumbai', name: 'Mumbai', country: 'IN', lat: 19.08, lon: 72.88, tz: 'Asia/Kolkata', currency: 'INR', rate: 90, aliases: ['bombay', 'мумбаи'] },
  { id: 'bangkok', name: 'Bangkok', country: 'TH', lat: 13.76, lon: 100.5, tz: 'Asia/Bangkok', currency: 'THB', rate: 38, aliases: ['бангкок'] },
  { id: 'singapore', name: 'Singapore', country: 'SG', lat: 1.35, lon: 103.82, tz: 'Asia/Singapore', currency: 'SGD', rate: 1.45, aliases: ['singapur', 'сингапур'] },
  { id: 'tokyo', name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69, tz: 'Asia/Tokyo', currency: 'JPY', rate: 165, aliases: ['tokio', 'токио'] },
  { id: 'seoul', name: 'Seoul', country: 'KR', lat: 37.57, lon: 126.98, tz: 'Asia/Seoul', currency: 'KRW', rate: 1500, aliases: ['seul', 'сеул'] },
  { id: 'sydney', name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21, tz: 'Australia/Sydney', currency: 'AUD', rate: 1.65, aliases: ['sidney', 'сидней'] },
]

export const ITEMS = {
  sourdoughLoaf: { category: 'bakery', diet: 'vegan', glutenFree: false, baseEur: 4.5, kg: 0.8 },
  croissantBox: { category: 'bakery', diet: 'vegetarian', glutenFree: false, baseEur: 6, kg: 0.4 },
  baguettes: { category: 'bakery', diet: 'vegan', glutenFree: false, baseEur: 3.5, kg: 0.5 },
  cinnamonRolls: { category: 'bakery', diet: 'vegetarian', glutenFree: false, baseEur: 7, kg: 0.5 },
  glutenFreeLoaf: { category: 'bakery', diet: 'vegan', glutenFree: true, baseEur: 6.5, kg: 0.6 },
  sandwichBox: { category: 'cafe', diet: 'meat', glutenFree: false, baseEur: 9, kg: 0.5 },
  veggieWraps: { category: 'cafe', diet: 'vegetarian', glutenFree: false, baseEur: 8, kg: 0.45 },
  quiche: { category: 'cafe', diet: 'vegetarian', glutenFree: false, baseEur: 8.5, kg: 0.5 },
  fruitBowls: { category: 'cafe', diet: 'vegan', glutenFree: true, baseEur: 6.5, kg: 0.5 },
  muffins: { category: 'cafe', diet: 'vegetarian', glutenFree: false, baseEur: 6, kg: 0.35 },
  pastaTray: { category: 'restaurant', diet: 'vegetarian', glutenFree: false, baseEur: 14, kg: 1 },
  curryBowl: { category: 'restaurant', diet: 'vegan', glutenFree: true, baseEur: 13, kg: 0.9 },
  roastChicken: { category: 'restaurant', diet: 'meat', glutenFree: true, baseEur: 16, kg: 1.1 },
  sushiSet: { category: 'restaurant', diet: 'meat', glutenFree: false, baseEur: 18, kg: 0.6 },
  risotto: { category: 'restaurant', diet: 'vegetarian', glutenFree: true, baseEur: 15, kg: 0.9 },
  mezze: { category: 'restaurant', diet: 'vegan', glutenFree: false, baseEur: 12, kg: 0.8 },
  macarons: { category: 'patisserie', diet: 'vegetarian', glutenFree: true, baseEur: 12, kg: 0.25 },
  eclairs: { category: 'patisserie', diet: 'vegetarian', glutenFree: false, baseEur: 10, kg: 0.35 },
  fruitTart: { category: 'patisserie', diet: 'vegetarian', glutenFree: false, baseEur: 16, kg: 0.7 },
  cheesecake: { category: 'patisserie', diet: 'vegetarian', glutenFree: false, baseEur: 14, kg: 0.6 },
  veggieBox: { category: 'grocery', diet: 'vegan', glutenFree: true, baseEur: 10, kg: 2.5 },
  fruitCrate: { category: 'grocery', diet: 'vegan', glutenFree: true, baseEur: 9, kg: 2.5 },
  dairyBundle: { category: 'grocery', diet: 'vegetarian', glutenFree: true, baseEur: 8, kg: 1.5 },
  deliBundle: { category: 'grocery', diet: 'meat', glutenFree: true, baseEur: 11, kg: 1 },
} as const satisfies Record<string, Item>

export type ItemKey = keyof typeof ITEMS

const ITEM_KEYS = Object.keys(ITEMS) as ItemKey[]

export function itemsFor(category: Category): ItemKey[] {
  return ITEM_KEYS.filter((key) => ITEMS[key].category === category)
}

/** Every city has the same mix of venues, so cities can be compared fairly. */
const LAYOUT: Category[] = ['bakery', 'bakery', 'cafe', 'cafe', 'restaurant', 'restaurant', 'patisserie', 'grocery']

const NAME_TEMPLATES: Record<Category, string[]> = {
  bakery: ['Boulangerie {w}', '{w} Bakehouse', 'Forno {w}'],
  cafe: ['Café {w}', '{w} Coffee Room', 'The {w} Café'],
  restaurant: ['Maison {w}', 'Trattoria {w}', 'Bistro {w}'],
  patisserie: ['Pâtisserie {w}', '{w} Confiserie'],
  grocery: ['{w} Market', 'Épicerie {w}'],
}

const NAME_WORDS = [
  'Aurel', 'Lumière', 'Verde', 'Olivia', 'Saffron', 'Marigold', 'Juniper', 'Amber', 'Sorrel', 'Linden',
  'Clementine', 'Hazel', 'Rosemary', 'Bramble', 'Cedar', 'Laurel', 'Wren', 'Basil', 'Orchard', 'Willow',
  'Quince', 'Velvet', 'Copper', 'Gilded', 'Fig', 'Sage', 'Ember', 'Plum', 'Thyme', 'Ivory',
]

/**
 * Evening slots: a venue lists its surplus during the last hours before each closing time.
 * Cafés also have a lunch slot, because their sandwiches and salads expire mid-afternoon.
 */
const CLOSE_TIMES: Record<Category, number[][]> = {
  bakery: [[18 * 60], [18.5 * 60], [19 * 60], [19.5 * 60], [20 * 60]],
  cafe: [[14.5 * 60, 19 * 60], [15 * 60, 20 * 60], [15.5 * 60, 21 * 60]],
  restaurant: [[22 * 60], [22.5 * 60], [23 * 60], [23.5 * 60]],
  patisserie: [[19 * 60], [19.5 * 60], [20 * 60]],
  grocery: [[20.5 * 60], [21 * 60], [21.5 * 60], [22 * 60]],
}

/** The partner venues of a city. They are generated from the city id, so they never change between requests. */
export function venuesFor(city: City): Venue[] {
  const rand = seededRandom(`venues|${city.id}`)
  const words = [...NAME_WORDS]
  return LAYOUT.map((category, index) => {
    const word = words.splice(randomInt(rand, 0, words.length - 1), 1)[0]
    return {
      id: `${city.id}.${index}`,
      name: pick(rand, NAME_TEMPLATES[category]).replace('{w}', word),
      category,
      lat: Number((city.lat + (rand() - 0.5) * 0.05).toFixed(4)),
      lon: Number((city.lon + (rand() - 0.5) * 0.07).toFixed(4)),
      closeMinutes: pick(rand, CLOSE_TIMES[category]),
    }
  })
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[\s_-]+/g, ' ')
    .trim()
}

/** Finds a partner city by id, English name or alias — accent-, case- and dash-insensitive, and ignoring a trailing ", country". */
export function findCity(query: string | null | undefined): City | null {
  if (!query) return null
  const wanted = normalize(query.split(',')[0])
  if (!wanted) return null
  return (
    CITIES.find((city) => [city.id, city.name, ...city.aliases].some((name) => normalize(name) === wanted)) ?? null
  )
}
