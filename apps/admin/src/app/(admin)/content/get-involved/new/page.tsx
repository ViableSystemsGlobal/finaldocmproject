'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  X,
  Loader2,
  Users,
  Heart,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Award,
  CheckCircle2,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  createGetInvolvedTemplate,
  generateSlug,
  getTemplateCategories,
  getGradientPresets,
  GetInvolvedTemplate
} from '@/services/getInvolved'
import { fetchGroups } from '@/services/groups'

export default function NewGetInvolvedTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const [newTag, setNewTag] = useState('')
  const [newRequirement, setNewRequirement] = useState('')
  const [newBenefit, setNewBenefit] = useState('')

  const categories = getTemplateCategories()
  const gradientPresets = getGradientPresets()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    excerpt: '',
    featured_image: '',
    icon_emoji: '🤝',
    gradient_colors: {
      from: 'blue-800',
      to: 'indigo-900'
    },
    ministry_group_id: '',
    category: 'ministry' as const,
    requirements: [] as string[],
    benefits: [] as string[],
    time_commitment: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    application_form_url: '',
    custom_cta_text: 'Learn More',
    custom_cta_url: '',
    priority_order: 0,
    status: 'draft' as const,
    seo_meta: {
      title: '',
      description: '',
      keywords: [] as string[]
    },
    tags: [] as string[]
  })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await fetchGroups()
      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Auto-generate SEO title from template title
    if (field === 'title' && value && !formData.seo_meta.title) {
      setFormData(prev => ({
        ...prev,
        seo_meta: {
          ...prev.seo_meta,
          title: value
        }
      }))
    }

    // Auto-generate SEO description from excerpt
    if (field === 'excerpt' && value && !formData.seo_meta.description) {
      setFormData(prev => ({
        ...prev,
        seo_meta: {
          ...prev.seo_meta,
          description: value
        }
      }))
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (requirementToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirementToRemove)
    }))
  }

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }))
      setNewBenefit('')
    }
  }

  const removeBenefit = (benefitToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(benefit => benefit !== benefitToRemove)
    }))
  }

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !formData.seo_meta.keywords.includes(keyword.trim())) {
      setFormData(prev => ({
        ...prev,
        seo_meta: {
          ...prev.seo_meta,
          keywords: [...prev.seo_meta.keywords, keyword.trim()]
        }
      }))
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      seo_meta: {
        ...prev.seo_meta,
        keywords: prev.seo_meta.keywords.filter(keyword => keyword !== keywordToRemove)
      }
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template title is required.',
        variant: 'destructive',
      })
      return false
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template description is required.',
        variant: 'destructive',
      })
      return false
    }

    if (!formData.excerpt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template excerpt is required.',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const templateData = {
        ...formData,
        status,
        published_at: status === 'published' ? new Date().toISOString() : undefined,
        ministry_group_id: formData.ministry_group_id || undefined
      }

      const { data, error } = await createGetInvolvedTemplate(templateData)
      if (error) throw error

      toast({
        title: 'Success',
        description: `Template ${status === 'published' ? 'created and published' : 'saved as draft'} successfully`,
      })

      router.push('/content/get-involved')
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: 'Error',
        description: 'Failed to create template. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyGradientPreset = (preset: any) => {
    setFormData(prev => ({
      ...prev,
      gradient_colors: {
        from: preset.from,
        to: preset.to
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" asChild>
              <Link href="/content/get-involved">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  New Get Involved Template
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Create a new opportunity for community engagement
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                variant="outline"
                className="border-slate-300 hover:bg-slate-50 px-6 py-3 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg px-6 py-3 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Template Information
                </CardTitle>
                <CardDescription>
                  Basic details about the Get Involved opportunity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Template Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter template title..."
                      className="bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon_emoji">Icon Emoji</Label>
                    <Input
                      id="icon_emoji"
                      value={formData.icon_emoji}
                      onChange={(e) => handleInputChange('icon_emoji', e.target.value)}
                      placeholder="🤝"
                      className="bg-white/50"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Short Description *</Label>
                  <Input
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Brief summary of the opportunity..."
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of the opportunity, requirements, and what's involved..."
                    rows={6}
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    value={formData.featured_image}
                    onChange={(e) => handleInputChange('featured_image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-white/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category and Ministry */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Category & Ministry
                </CardTitle>
                <CardDescription>
                  Categorize and link to existing ministries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="bg-white/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ministry_group_id">Link to Ministry/Group</Label>
                    <Select value={formData.ministry_group_id} onValueChange={(value) => handleInputChange('ministry_group_id', value)}>
                      <SelectTrigger className="bg-white/50">
                        <SelectValue placeholder="Select ministry/group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No ministry linked</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_commitment">Time Commitment</Label>
                  <Input
                    id="time_commitment"
                    value={formData.time_commitment}
                    onChange={(e) => handleInputChange('time_commitment', e.target.value)}
                    placeholder="e.g., 2 hours per week, Monthly meetings, One-time event"
                    className="bg-white/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requirements and Benefits */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Requirements & Benefits
                </CardTitle>
                <CardDescription>
                  What's needed and what participants gain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Requirements */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label>Requirements</Label>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement..."
                      className="bg-white/50"
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    />
                    <Button
                      type="button"
                      onClick={addRequirement}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((requirement, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {requirement}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeRequirement(requirement)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label>Benefits</Label>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add a benefit..."
                      className="bg-white/50"
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                    />
                    <Button
                      type="button"
                      onClick={addBenefit}
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {benefit}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeBenefit(benefit)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-500" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  How people can get in touch or apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                      placeholder="John Doe"
                      className="bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="contact@church.org"
                      className="bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="bg-white/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="application_form_url">Application Form URL</Label>
                    <Input
                      id="application_form_url"
                      value={formData.application_form_url}
                      onChange={(e) => handleInputChange('application_form_url', e.target.value)}
                      placeholder="https://forms.church.org/volunteer"
                      className="bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_cta_url">Custom Action URL</Label>
                    <Input
                      id="custom_cta_url"
                      value={formData.custom_cta_url}
                      onChange={(e) => handleInputChange('custom_cta_url', e.target.value)}
                      placeholder="https://church.org/get-involved"
                      className="bg-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_cta_text">Call to Action Text</Label>
                  <Input
                    id="custom_cta_text"
                    value={formData.custom_cta_text}
                    onChange={(e) => handleInputChange('custom_cta_text', e.target.value)}
                    placeholder="Learn More"
                    className="bg-white/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Visual Design */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  Visual Design
                </CardTitle>
                <CardDescription>
                  Customize the appearance of your template.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Gradient Colors</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {gradientPresets.map((preset, index) => (
                      <div
                        key={index}
                        className={`relative p-3 rounded-lg cursor-pointer transition-all hover:scale-105 bg-gradient-to-r from-${preset.from} to-${preset.to} ${
                          formData.gradient_colors.from === preset.from && formData.gradient_colors.to === preset.to
                            ? 'ring-2 ring-white ring-offset-2'
                            : ''
                        }`}
                        onClick={() => applyGradientPreset(preset)}
                      >
                        <div className="text-white text-xs font-medium">{preset.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority_order">Priority Order</Label>
                  <Input
                    id="priority_order"
                    type="number"
                    value={formData.priority_order}
                    onChange={(e) => handleInputChange('priority_order', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-white/50"
                  />
                  <p className="text-xs text-slate-500">Lower numbers appear first</p>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add tags to help organize and filter templates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    className="bg-white/50"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize for search engines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_meta.title}
                    onChange={(e) => handleInputChange('seo_meta.title', e.target.value)}
                    placeholder="SEO optimized title..."
                    className="bg-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_meta.description}
                    onChange={(e) => handleInputChange('seo_meta.description', e.target.value)}
                    placeholder="SEO meta description..."
                    rows={3}
                    className="bg-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SEO Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword..."
                      className="bg-white/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addKeyword((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                  </div>
                  {formData.seo_meta.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.seo_meta.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {keyword}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeKeyword(keyword)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 