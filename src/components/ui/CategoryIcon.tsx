import { builtInCategoryIcon } from '../../lib/dataIcons'
import type { Category } from '../../types'

/** Line icon for built-in categories; the user's chosen emoji for ones they created. */
export function CategoryIcon({
  category,
  size = 18,
  className,
}: {
  category: Pick<Category, 'id' | 'icon'>
  size?: number
  className?: string
}) {
  const Icon = builtInCategoryIcon(category.id)
  if (Icon) return <Icon size={size} className={className} />
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {category.icon}
    </span>
  )
}
