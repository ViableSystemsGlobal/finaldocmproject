'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, File, X, FileText, Image, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  accept?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSizeMB?: number
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  accept = "*/*",
  placeholder = "Select or drag and drop a file",
  className = "",
  disabled = false,
  maxSizeMB = 10
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type.startsWith('video/')) return Video
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): boolean => {
    const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return false
    }
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      onFileSelect(file)
    } else {
      onFileSelect(null)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    
    if (file && validateFile(file)) {
      onFileSelect(file)
    }
  }, [disabled, onFileSelect, maxSizeMB])

  const handleRemoveFile = () => {
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200",
          isDragOver 
            ? "border-blue-500 bg-blue-50 scale-[1.02]" 
            : "border-slate-300 bg-slate-50/50",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-slate-400 hover:bg-slate-100/50 cursor-pointer"
        )}
        onClick={!disabled ? handleSelectClick : undefined}
      >
        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              {selectedFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                  className="h-16 w-16 object-cover rounded-lg border"
                />
              ) : (
                <div className="h-16 w-16 bg-slate-200 rounded-lg flex items-center justify-center">
                  {(() => {
                    const Icon = getFileIcon(selectedFile)
                    return <Icon className="h-8 w-8 text-slate-600" />
                  })()}
                </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="text-slate-600 hover:text-slate-800"
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className={cn(
              "mx-auto h-12 w-12 transition-colors",
              isDragOver ? "text-blue-500" : "text-slate-400"
            )} />
            <div>
              <p className="text-sm text-slate-600 font-medium">
                {placeholder}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Max file size: {maxSizeMB}MB
              </p>
            </div>
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              disabled={disabled}
              className="border-2 border-slate-200 hover:bg-slate-50"
            >
              Select File
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 