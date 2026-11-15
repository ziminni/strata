import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui class helper: merge conditional classes and resolve Tailwind conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
