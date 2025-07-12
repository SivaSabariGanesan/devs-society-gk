import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-gray-700 bg-black/30 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-gray-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400 focus-visible:bg-black/50 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-600 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        style={{ borderRadius: '0.5rem' }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input } 