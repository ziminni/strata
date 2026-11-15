// shadcn/ui Calendar (react-day-picker v9), ported to JSX and mapped to the app's colour tokens:
//   primary → leaf, accent → leaf-soft, muted-foreground → muted, background → surface.
import { useEffect, useRef } from 'react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'
import { cn } from '../../lib/utils'

const ghostButton =
  'inline-flex items-center justify-center rounded-xl text-[15px] font-semibold transition-colors outline-none hover:bg-surface2 focus-visible:ring-2 focus-visible:ring-leaf/50 disabled:pointer-events-none disabled:opacity-50'

function Chevron({ className, orientation, ...props }) {
  const d = orientation === 'left' ? 'm15 6-6 6 6 6' : orientation === 'right' ? 'm9 6 6 6-6 6' : 'm6 9 6 6 6-6'
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={cn('size-5', className)} aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }) {
  const defaultClassNames = getDefaultClassNames()
  const ref = useRef(null)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        ghostButton,
        'flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-semibold tabular-nums',
        'data-[selected-single=true]:bg-leaf data-[selected-single=true]:text-white',
        'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-leaf-soft data-[range-middle=true]:text-leaf-ink',
        'data-[range-start=true]:rounded-xl data-[range-start=true]:rounded-r-xl data-[range-start=true]:bg-leaf data-[range-start=true]:text-white',
        'data-[range-end=true]:rounded-xl data-[range-end=true]:rounded-l-xl data-[range-end=true]:bg-leaf data-[range-end=true]:text-white',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  )
}

/** shadcn Calendar. Pass any react-day-picker props (mode="range", selected, onSelect, disabled, max …). */
export function Calendar({ className, classNames, showOutsideDays = true, components, ...props }) {
  const defaultClassNames = getDefaultClassNames()
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('group/calendar bg-surface p-1 [--cell-size:--spacing(10)]', className)}
      classNames={{
        root: cn('w-full', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-3', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(ghostButton, 'size-(--cell-size) p-0 text-ink select-none aria-disabled:opacity-40', defaultClassNames.button_previous),
        button_next: cn(ghostButton, 'size-(--cell-size) p-0 text-ink select-none aria-disabled:opacity-40', defaultClassNames.button_next),
        month_caption: cn('flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)', defaultClassNames.month_caption),
        caption_label: cn('font-display text-[17px] font-extrabold select-none', defaultClassNames.caption_label),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn('flex-1 rounded-md text-[12px] font-bold text-muted select-none', defaultClassNames.weekday),
        week: cn('mt-1.5 flex w-full', defaultClassNames.week),
        day: cn(
          'group/day relative aspect-square h-full w-full p-0 text-center select-none [&:first-child[data-selected=true]_button]:rounded-l-xl [&:last-child[data-selected=true]_button]:rounded-r-xl',
          defaultClassNames.day,
        ),
        range_start: cn('rounded-l-xl bg-leaf-soft', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-xl bg-leaf-soft', defaultClassNames.range_end),
        today: cn('rounded-xl ring-1 ring-leaf/60 ring-inset data-[selected=true]:rounded-none', defaultClassNames.today),
        outside: cn('text-muted opacity-60 aria-selected:text-muted', defaultClassNames.outside),
        disabled: cn('text-muted opacity-35', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...p }) => <div data-slot="calendar" ref={rootRef} className={cn(className)} {...p} />,
        Chevron,
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

export default Calendar
