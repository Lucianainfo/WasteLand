import type { Category } from '../types/food'

/** Photos are hot-linked from Unsplash (free to use under the Unsplash License), resized by Unsplash's image CDN. */
export function unsplash(id: string, width: number, height?: number): string {
  const size = height ? `&h=${height}&fit=crop` : ''
  return `https://images.unsplash.com/photo-${id}?auto=format&q=70&w=${width}${size}`
}

export const HERO_IMAGES = {
  home: '1551530241-1ccbaa7a9a84',
  problem: '1768733994507-ad69aee9638c',
  solution: '1663530761401-15eefb544889',
  compare: '1747178519928-0639a0218bba',
  profile: '1530610476181-d83430b64dcd',
} as const

export const STORY_IMAGES = {
  bread: '1509440159596-0249088772ff',
  chef: '1577219491135-ce391730fb2c',
  pastries: '1769434128980-d0c1c5fe0ada',
  market: '1488459716781-31db52582fe9',
  plate: '1514326640560-7d063ef2aed5',
  window: '1643944460517-58de76929473',
} as const

const CATEGORY_IMAGES: Record<Category, [string, string]> = {
  bakery: ['1509440159596-0249088772ff', '1623334044303-241021148842'],
  cafe: ['1790156591751-5c3c96e0140f', '1765894711215-ba5b1bd6d1f7'],
  restaurant: ['1514326640560-7d063ef2aed5', '1663530761401-15eefb544889'],
  patisserie: ['1769434128980-d0c1c5fe0ada', '1746133948297-c052150a6544'],
  grocery: ['1488459716781-31db52582fe9', '1566385101042-1a0aa0c1268c'],
}

/** A photo for an offer card; venues of the same kind in a city alternate between two photos. */
export function categoryImage(category: Category, venueId: string): string {
  let sum = 0
  for (const ch of venueId) sum += ch.charCodeAt(0)
  return CATEGORY_IMAGES[category][sum % 2]
}
