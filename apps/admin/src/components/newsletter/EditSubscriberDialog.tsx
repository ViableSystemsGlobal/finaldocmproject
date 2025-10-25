"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Subscriber {
  id: string
  email: string
  first_name?: string
  last_name?: string
  status: 'active' | 'unsubscribed' | 'bounced'
  segments?: string[]
}

interface EditSubscriberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriber: Subscriber | null
  onSubscriberUpdated: () => void
}

const availableSegments = [
  'Members',
  'Visitors', 
  'General',
  'Youth',
  'Ministry Leaders',
  'Volunteers'
]

export function EditSubscriberDialog({ 
  open, 
  onOpenChange, 
  subscriber, 
  onSubscriberUpdated 
}: EditSubscriberDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    status: 'active' as 'active' | 'unsubscribed' | 'bounced',
    segments: [] as string[]
  })

  useEffect(() => {
    if (subscriber) {
      setFormData({
        email: subscriber.email || '',
        first_name: subscriber.first_name || '',
        last_name: subscriber.last_name || '',
        status: subscriber.status,
        segments: subscriber.segments || []
      })
    }
  }, [subscriber])

  const handleSubmit = async () => {
    if (!subscriber) return

    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/newsletter/subscribers/${subscriber.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Subscriber updated successfully"
        })
        onSubscriberUpdated()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update subscriber",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating subscriber:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSegmentChange = (segment: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      segments: checked 
        ? [...prev.segments, segment]
        : prev.segments.filter(s => s !== segment)
    }))
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subscriber</DialogTitle>
          <DialogDescription>
            Update subscriber information and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="subscriber@example.com"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="John"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Doe"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'active' | 'unsubscribed' | 'bounced') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Segments</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableSegments.map((segment) => (
                <div key={segment} className="flex items-center space-x-2">
                  <Checkbox
                    id={`segment-${segment}`}
                    checked={formData.segments.includes(segment)}
                    onCheckedChange={(checked) => handleSegmentChange(segment, checked as boolean)}
                    disabled={loading}
                  />
                  <Label 
                    htmlFor={`segment-${segment}`} 
                    className="text-sm font-normal"
                  >
                    {segment}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Subscriber'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 