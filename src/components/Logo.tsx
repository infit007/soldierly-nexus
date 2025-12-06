import { Shield } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
  linkTo?: string
}

export function Logo({ className, showIcon = true, size = "md", linkTo }: LogoProps) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl"
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const logoContent = (
    <div className={cn("flex items-center gap-2 font-bold", className)}>
      {showIcon && (
        <div className={cn(
          "p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/80",
          "shadow-sm"
        )}>
          <Shield className={cn(iconSizes[size], "text-primary-foreground")} />
        </div>
      )}
      <span className={cn(
        "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
        sizeClasses[size],
        "tracking-tight"
      )}>
        Soldierly Nexus
      </span>
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}


