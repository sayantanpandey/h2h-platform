"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    className?: string
  }
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    {...(props as any)}
    className={cn(
      "relative flex size-8 shrink-0 overflow-hidden rounded-full",
      className
    )}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    className?: string
  }
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    {...(props as any)}
    className={cn("aspect-square size-full object-cover", className)}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    className?: string
  }
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    {...(props as any)}
    className={cn(
      "bg-muted flex size-full items-center justify-center rounded-full",
      className
    )}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
