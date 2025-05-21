import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg"
}

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  
  // Process the src when it changes
  useEffect(() => {
    console.log('Avatar useEffect triggered with src:', src);
    
    if (!src) {
      console.log('Avatar: No source provided');
      setImgSrc(null);
      return;
    }
    
    console.log('Avatar: Received source:', src);
    
    // If it's a Data URL (base64), use it directly
    if (typeof src === 'string' && src.startsWith('data:')) {
      console.log('Avatar: Using data URL');
      setImgSrc(src);
      return;
    }
    
    // If it's a URL, use it directly
    if (typeof src === 'string' && src.startsWith('http')) {
      console.log('Avatar: Using HTTP URL');
      setImgSrc(src);
      return;
    }
    
    // Otherwise, assume it's a relative path and use it
    console.log('Avatar: Using relative path or unknown format');
    setImgSrc(src);
  }, [src])
  
  // Generate initials from the alt text
  const getInitials = () => {
    if (!alt) return ""
    
    const words = alt.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    } else if (words.length > 1) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
    }
    
    return ""
  }
  
  // Calculate size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg"
  }
  
  // Determine content to display
  const showImage = imgSrc && !imageError
  const initials = fallback || getInitials()
  
  // Handle image load error
  const handleImageError = () => {
    console.error('Avatar: Failed to load image:', imgSrc)
    setImageError(true)
  }
  
  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={imgSrc}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-600 font-medium">
          {initials}
        </div>
      )}
    </div>
  )
} 