import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border border-transparent font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        accent: 'bg-accent text-onfill hover:bg-accent/90',
        secondary: 'bg-surface text-foreground border-border hover:bg-surface/70',
        outline: 'border-border bg-card text-foreground hover:bg-surface',
        ghost: 'bg-transparent text-muted-foreground hover:bg-surface',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        link: 'text-accent-ink underline-offset-4 hover:underline',
      },
      size: {
        /** The big full-width action button used across the app. */
        // Full width on its own; shares the row evenly when another button sits beside it.
        default: 'w-full shrink min-w-0 h-14 rounded-full text-[17px]',
        xl: 'w-full shrink min-w-0 h-14 rounded-full text-[17px]',
        lg: 'h-12 rounded-full px-6 text-[16px]',
        md: 'h-11 rounded-full px-5 text-[15px]',
        sm: 'h-9 rounded-full px-4 text-[14px]',
        xs: 'h-7 rounded-full px-3 text-[12px]',
        icon: 'size-11 rounded-full',
        'icon-sm': 'size-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({ className, variant = 'default', size = 'default', ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button, buttonVariants }
