"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showValue?: boolean
  label?: string
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue, defaultValue, label, onValueChange, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue || [400])

  const handleValueChange = (newValue: number[]) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className="flex items-center gap-4">
      {showValue && (
        <div className="min-w-[4rem] text-sm font-medium tabular-nums">
          {value[0]}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center h-5",
          className
        )}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:scale-105"
        />
      </SliderPrimitive.Root>
    </div>
  )
})

Slider.displayName = SliderPrimitive.Root.displayName
