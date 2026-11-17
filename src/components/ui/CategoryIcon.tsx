import { builtInCategoryIcon } from '../../lib/dataIcons'
import { EmojiIcon } from './EmojiIcon'
import type { Category } from '../../types'

/** Line icon for built-in categories; the user's chosen emoji for ones they created. */
export function CategoryIcon({
  category,
  size = 18,
  className,
}: {
  category: Pick<Category, 'id' | 'icon'> & { name?: string }
  size?: number
  className?: string
}) {
  const Icon = builtInCategoryIcon(category.id)
  if (Icon) return <Icon size={size} className={className} />
  return <EmojiIcon emoji={category.icon} name={category.name} size={size} className={className} />
}
