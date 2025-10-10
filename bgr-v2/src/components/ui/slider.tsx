"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  marks?: Array<{ value: number; label: string }>
  showValue?: boolean
  valueLabelFormat?: (value: number) => string
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, marks, showValue = false, valueLabelFormat, ...props }, ref) => {
  const [values, setValues] = React.useState<number[]>(
    Array.isArray(props.value) ? props.value : [props.value || 0]
  )

  React.useEffect(() => {
    if (props.value !== undefined) {
      setValues(Array.isArray(props.value) ? props.value : [props.value])
    }
  }, [props.value])

  const formatValue = (value: number) => {
    if (valueLabelFormat) return valueLabelFormat(value)
    return value.toString()
  }

  return (
    <div className="relative">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        onValueChange={(value) => {
          setValues(value)
          props.onValueChange?.(value)
        }}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <SliderPrimitive.Range className="absolute h-full bg-blue-500 dark:bg-blue-400" />
        </SliderPrimitive.Track>
        
        {/* Marks */}
        {marks && marks.map((mark) => (
          <div
            key={mark.value}
            className="absolute top-0 h-2 w-0.5 bg-slate-300 dark:bg-slate-600"
            style={{
              left: `${((mark.value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100}%`,
            }}
          />
        ))}
        
        {/* Thumbs */}
        {values.map((value, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              showValue && "relative"
            )}
          >
            {showValue && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                {formatValue(value)}
              </div>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
      
      {/* Mark Labels */}
      {marks && (
        <div className="relative mt-4">
          {marks.map((mark) => (
            <div
              key={mark.value}
              className="absolute text-xs text-muted-foreground"
              style={{
                left: `${((mark.value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {mark.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }



