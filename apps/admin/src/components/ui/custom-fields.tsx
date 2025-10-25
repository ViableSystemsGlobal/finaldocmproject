import React from 'react'
import { Input } from './input'
import { Textarea } from './textarea'
import { Checkbox } from './checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'
import type { CustomField } from '@/services/settings'

interface CustomFieldInputProps {
  field: CustomField
  value: any
  onChange: (value: any) => void
  disabled?: boolean
}

export function CustomFieldInput({ field, value, onChange, disabled = false }: CustomFieldInputProps) {
  const handleChange = (newValue: any) => {
    onChange(newValue)
  }

  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
        />
      )

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          rows={3}
          className="border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none"
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : '')}
          disabled={disabled}
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
        />
      )

    case 'date':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
        />
      )

    case 'toggle':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => handleChange(checked)}
            disabled={disabled}
          />
          <Label className="text-sm">{field.field_label}</Label>
        </div>
      )

    case 'dropdown':
      return (
        <Select 
          value={value || ''} 
          onValueChange={handleChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {field.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    default:
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
        />
      )
  }
}

interface CustomFieldDisplayProps {
  field: CustomField
  value: any
}

export function CustomFieldDisplay({ field, value }: CustomFieldDisplayProps) {
  if (!value && value !== false) {
    return <span className="text-slate-400 italic">Not provided</span>
  }

  const formatValue = () => {
    switch (field.field_type) {
      case 'toggle':
        return value === true || value === 'true' ? 'Yes' : 'No'
      case 'date':
        try {
          return new Date(value).toLocaleDateString()
        } catch {
          return value
        }
      case 'email':
        return (
          <a 
            href={`mailto:${value}`} 
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
        )
      case 'phone':
        return (
          <a 
            href={`tel:${value}`} 
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {value}
          </a>
        )
      default:
        return value
    }
  }

  return <span className="text-sm font-medium text-slate-800">{formatValue()}</span>
} 