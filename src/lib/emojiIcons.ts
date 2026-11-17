import {
  Baby, Banknote, BookOpen, Briefcase, Bus, Car, Clapperboard, Coffee, Cookie, CreditCard, Droplets, Fuel, Gift, Globe, GraduationCap, HandCoins,
  HandHeart, HeartHandshake, HeartPulse, Home, Landmark, LifeBuoy, Lightbulb, Lock, Package, ParkingSquare, PiggyBank, Pizza, Plane, Pill, Receipt,
  Repeat, ShieldCheck, ShoppingBag, ShoppingCart, Shirt, Smartphone, Sparkles, Stethoscope, Tag, Train, TrendingUp, Tv, Users, UtensilsCrossed, Wallet, Wifi,
  Wrench, Coins, Cake, Church, Soup, Bike, Sprout, User, Music, Dumbbell, Dog, Beer, Hammer, Plug, Zap, Trophy, Star, Heart, Palette, Camera, Gamepad2, Scissors, Bed, Phone, Mail, Calendar, Clock, Key, Umbrella, Leaf, Sun, Moon, Flame, Mountain, Ship, Truck, Building2, Store, Utensils, IceCreamCone, Milk, Apple, Wine, type LucideIcon,
} from 'lucide-react'

/**
 * The shadcn/Lucide line icon for each emoji the app uses by default, so the whole app has one icon style.
 * An emoji someone picked themselves that is not listed here is still shown as that emoji.
 */
const MAP: Record<string, LucideIcon> = {
  '🛒': ShoppingCart, '🍽️': UtensilsCrossed, '🍽': UtensilsCrossed, '🍛': Soup, '☕': Coffee, '🥪': Cookie, '🛵': Bike, '🍔': Pizza, '🥞': Cookie, '🍰': Cake,
  '🏠': Home, '💡': Lightbulb, '🚰': Droplets, '🛠️': Wrench, '🛠': Wrench, '📱': Smartphone, '🌐': Wifi,
  '🚗': Car, '⛽': Fuel, '🚆': Train, '🚌': Bus, '🚕': Car, '🅿️': ParkingSquare, '🔧': Wrench,
  '💊': Pill, '🩺': Stethoscope, '🛡️': ShieldCheck, '🛡': ShieldCheck,
  '👪': Users, '👵': Users, '🧒': Baby, '🧹': Sparkles,
  '📚': BookOpen, '🎓': GraduationCap, '📖': BookOpen,
  '🛍': ShoppingBag, '🛍️': ShoppingBag, '👕': Shirt, '💻': Tv, '🎁': Gift,
  '🍿': Clapperboard, '🎬': Clapperboard, '📺': Tv, '✈️': Plane, '✈': Plane,
  '🏦': Landmark, '🤲': HandHeart, '🙏': HandHeart, '🕊️': HandHeart, '🕊': HandHeart, '🤝': HeartHandshake, '🌍': Globe,
  '💰': PiggyBank, '📈': TrendingUp, '🛟': LifeBuoy, '🧾': Receipt, '📦': Package, '💼': Briefcase,
  '💳': CreditCard, '🔒': Lock, '🔁': Repeat, '🏛️': Landmark, '🏛': Landmark, '🪙': Coins, '💵': Banknote, '💸': HandCoins, '❤️': HeartPulse, '⛪': Church, '🌱': Sprout, '👛': Wallet,
  '🏷️': Tag,
  '👩': User, '👨': User, '🙌': HandHeart, '👤': User, '🎵': Music, '🏋️': Dumbbell, '🐕': Dog, '🍺': Beer, '🔨': Hammer, '🔌': Plug, '⚡': Zap, '🏆': Trophy, '⭐': Star,
  '❤': Heart, '🎨': Palette, '📷': Camera, '🎮': Gamepad2, '✂️': Scissors, '🛏️': Bed, '📞': Phone, '✉️': Mail, '📅': Calendar, '⏰': Clock, '🔑': Key, '☂️': Umbrella,
  '🍃': Leaf, '☀️': Sun, '🌙': Moon, '🔥': Flame, '⛰️': Mountain, '🚢': Ship, '🚚': Truck, '🏢': Building2, '🏪': Store, '🍴': Utensils, '🍦': IceCreamCone, '🥛': Milk, '🍎': Apple, '🍷': Wine,
  '✨': Sparkles, '📲': Smartphone,
}

/** Icons someone can choose for a category (stored as `i:name`). */
export const PICKABLE_ICONS: Record<string, LucideIcon> = {
  tag: Tag, cart: ShoppingCart, bag: ShoppingBag, food: UtensilsCrossed, coffee: Coffee, pizza: Pizza, cake: Cake, home: Home, bulb: Lightbulb, water: Droplets,
  wifi: Wifi, phone: Smartphone, car: Car, bike: Bike, fuel: Fuel, train: Train, bus: Bus, plane: Plane, ship: Ship, health: Pill, doctor: Stethoscope, heart: Heart,
  family: Users, baby: Baby, user: User, book: BookOpen, school: GraduationCap, shirt: Shirt, laptop: Tv, gift: Gift, movie: Clapperboard, music: Music, game: Gamepad2,
  gym: Dumbbell, pet: Dog, tools: Wrench, bank: Landmark, card: CreditCard, cash: Banknote, coins: Coins, piggy: PiggyBank, chart: TrendingUp, shield: ShieldCheck,
  receipt: Receipt, work: Briefcase, box: Package, give: HandHeart, globe: Globe, church: Church, star: Star, leaf: Leaf, camera: Camera, scissors: Scissors, key: Key,
}

/** Words in a category's name that tell us which icon suits it, when no icon was set. */
const NAME_HINTS: [RegExp, LucideIcon][] = [
  [/grocer|supermarket|vegetable|milk|provision/i, ShoppingCart], [/coffee|tea|cafe/i, Coffee], [/restaurant|meal|dinner|lunch|eating|food|snack|breakfast|delivery/i, UtensilsCrossed],
  [/rent|home|house|maintenance/i, Home], [/electric|power|bill|utilit/i, Lightbulb], [/water|gas/i, Droplets], [/internet|broadband|wifi/i, Wifi], [/mobile|recharge|phone/i, Smartphone],
  [/fuel|petrol|diesel/i, Fuel], [/transport|cab|auto|taxi|vehicle|car/i, Car], [/metro|train|bus/i, Train], [/doctor|medic|health|pharma|hospital/i, Pill], [/insurance/i, ShieldCheck],
  [/parent|amma|accha|family|house ?hold|children|kid/i, Users], [/school|fee|education|course|book/i, GraduationCap], [/cloth|shirt|dress/i, Shirt], [/shop|gift/i, ShoppingBag],
  [/movie|entertain|subscription|holiday|travel|trip/i, Clapperboard], [/emi|loan/i, Landmark], [/tithe|offering|charity|giving|mission|help|serve/i, HandHeart],
  [/saving|invest|sip|fund/i, PiggyBank], [/reimburs|record|receipt/i, Receipt], [/salary|work|business/i, Briefcase],
]

export function iconForName(name?: string): LucideIcon | undefined {
  if (!name) return undefined
  return NAME_HINTS.find(([re]) => re.test(name))?.[1]
}

/**
 * The icon for a category (or account, plan…): a chosen `i:name` icon, the built-in one, one matching the old emoji,
 * one that suits its name, or a plain tag. An emoji is never shown.
 */
export function resolveIcon(icon?: string, name?: string): LucideIcon {
  if (icon?.startsWith('i:')) return PICKABLE_ICONS[icon.slice(2)] ?? Tag
  return iconForEmoji(icon) ?? iconForName(name) ?? Tag
}

export function iconForEmoji(emoji?: string): LucideIcon | undefined {
  return emoji ? MAP[emoji.trim()] : undefined
}
