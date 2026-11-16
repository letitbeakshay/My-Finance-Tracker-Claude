import { iconForEmoji } from '../../lib/emojiIcons'

/** An icon from the app's line-icon set, or the emoji itself when it is one someone picked that we have no icon for. */
export function EmojiIcon({ emoji, size = 18, className }: { emoji?: string; size?: number; className?: string }) {
  const Icon = iconForEmoji(emoji)
  if (Icon) return <Icon size={size} className={className} aria-hidden />
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
      {emoji}
    </span>
  )
}
