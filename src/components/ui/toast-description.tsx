import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> &
    VariantProps<typeof toastDescriptionVariants>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(toastDescriptionVariants(), className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const toastDescriptionVariants = cva("text-sm opacity-90")

export { ToastDescription, toastDescriptionVariants }
