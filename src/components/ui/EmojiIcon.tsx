import { resolveIcon } from '../../lib/emojiIcons'

/** A line icon for a stored icon value (an old emoji or a chosen `i:name`), optionally guided by the item's name. Never an emoji. */
export function EmojiIcon({ emoji, name, size = 18, className }: { emoji?: string; name?: string; size?: number; className?: string }) {
  const Icon = resolveIcon(emoji, name)
  return <Icon size={size} className={className} aria-hidden />
}
