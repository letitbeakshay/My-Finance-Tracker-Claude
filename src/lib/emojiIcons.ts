import {
  Baby, Banknote, BookOpen, Briefcase, Bus, Car, Clapperboard, Coffee, Cookie, CreditCard, Droplets, Fuel, Gift, Globe, GraduationCap, HandCoins,
  HandHeart, HeartHandshake, HeartPulse, Home, Landmark, LifeBuoy, Lightbulb, Lock, Package, ParkingSquare, PiggyBank, Pizza, Plane, Pill, Receipt,
  Repeat, ShieldCheck, ShoppingBag, ShoppingCart, Shirt, Smartphone, Sparkles, Stethoscope, Tag, Train, TrendingUp, Tv, Users, UtensilsCrossed, Wallet, Wifi,
  Wrench, Coins, Cake, Church, Soup, Bike, Sprout, type LucideIcon,
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
}

export function iconForEmoji(emoji?: string): LucideIcon | undefined {
  return emoji ? MAP[emoji.trim()] : undefined
}
