'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Trash2, 
  Eye,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  GripVertical,
  Edit,
  Link as LinkIcon,
  Settings,
  Image as ImageIcon,
  Type,
  Layout,
  Clock,
  Users,
  Calendar,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  fetchFooterSettings,
  saveFooterSettings,
  getDefaultFooterSettings,
  type FooterSettings,
  type FooterLink,
  type SocialLink
} from '@/services/footer'

// Social media platforms
const socialPlatforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
]

// Form schemas
const linkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  url: z.string().min(1, 'URL is required'),
  external: z.boolean().default(false),
  enabled: z.boolean().default(true)
})

const socialSchema = z.object({
  platform: z.string(),
  url: z.string().url('Must be a valid URL'),
  enabled: z.boolean().default(true)
})

export default function FooterManagementPage() {
  const router = useRouter()
  const [footerData, setFooterData] = useState<FooterSettings>(getDefaultFooterSettings())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null)
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showSocialDialog, setShowSocialDialog] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Load footer data on mount
  useEffect(() => {
    async function loadFooterData() {
      setLoading(true)
      try {
        const { data, error } = await fetchFooterSettings()
        
        if (error) {
          console.error('Failed to load footer settings:', error)
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load footer settings. Using defaults.'
          })
          setFooterData(getDefaultFooterSettings())
        } else if (data) {
          setFooterData(data)
        } else {
          // No data found, use defaults
          setFooterData(getDefaultFooterSettings())
        }
      } catch (error) {
        console.error('Failed to load footer settings:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load footer settings. Using defaults.'
        })
        setFooterData(getDefaultFooterSettings())
      } finally {
        setLoading(false)
      }
    }

    loadFooterData()
  }, [])

  // Social media platforms
  const socialPlatforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook },
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter },
    { id: 'youtube', name: 'YouTube', icon: Youtube },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  ]

  // Link form
  const linkForm = useForm({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      label: '',
      url: '',
      external: false,
      enabled: true
    }
  })

  // Social form
  const socialForm = useForm({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      platform: '',
      url: '',
      enabled: true
    }
  })

  // Save footer settings
  const handleSave = async () => {
    setSaving(true)
    try {
      const { success, error } = await saveFooterSettings(footerData)
      
      if (!success) {
        throw new Error(error || 'Failed to save footer settings')
      }
      
      toast({
        title: 'Footer saved',
        description: 'Footer settings have been updated successfully.'
      })
    } catch (error) {
      console.error('Failed to save footer:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save footer settings. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  // Add/Edit link
  const handleSaveLink = (data: z.infer<typeof linkSchema>, sectionId: string) => {
    const section = footerData.sections.find(s => s.id === sectionId)
    if (!section || section.type !== 'links') return

    if (editingLink) {
      // Update existing link
      const updatedLinks = section.content.links.map((link: FooterLink) =>
        link.id === editingLink.id ? { ...link, ...data } : link
      )
      updateSectionContent(sectionId, { links: updatedLinks })
    } else {
      // Add new link
      const newLink = {
        id: Date.now().toString(),
        ...data
      }
      const updatedLinks = [...section.content.links, newLink]
      updateSectionContent(sectionId, { links: updatedLinks })
    }

    setEditingLink(null)
    setShowLinkDialog(false)
    linkForm.reset()
  }

  // Add/Edit social link
  const handleSaveSocial = (data: z.infer<typeof socialSchema>) => {
    const section = footerData.sections.find(s => s.type === 'social')
    if (!section) return

    if (editingSocial) {
      // Update existing social link
      const updatedLinks = section.content.links.map((link: SocialLink) =>
        link.platform === editingSocial.platform ? { ...link, ...data } : link
      )
      updateSectionContent(section.id, { links: updatedLinks })
    } else {
      // Add new social link
      const existingLink = section.content.links.find((link: SocialLink) => link.platform === data.platform)
      if (existingLink) {
        // Update existing platform
        const updatedLinks = section.content.links.map((link: SocialLink) =>
          link.platform === data.platform ? { ...link, ...data } : link
        )
        updateSectionContent(section.id, { links: updatedLinks })
      } else {
        // Add new platform
        const updatedLinks = [...section.content.links, data]
        updateSectionContent(section.id, { links: updatedLinks })
      }
    }

    setEditingSocial(null)
    setShowSocialDialog(false)
    socialForm.reset()
  }

  // Update section content
  const updateSectionContent = (sectionId: string, content: any) => {
    setFooterData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, ...content } }
          : section
      )
    }))
  }

  // Update section enabled status
  const toggleSectionEnabled = (sectionId: string) => {
    setFooterData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section
      )
    }))
  }

  // Delete link
  const deleteLink = (linkId: string, sectionId: string) => {
    const section = footerData.sections.find(s => s.id === sectionId)
    if (!section || section.type !== 'links') return

    const updatedLinks = section.content.links.filter((link: FooterLink) => link.id !== linkId)
    updateSectionContent(sectionId, { links: updatedLinks })
  }

  // Get social platform icon
  const getSocialIcon = (platform: string) => {
    const socialPlatform = socialPlatforms.find(p => p.id === platform)
    return socialPlatform ? socialPlatform.icon : Globe
  }

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, GIF, etc.)'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB'
      })
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-footer-logo', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update footer data with new logo URL
      setFooterData(prev => ({
        ...prev,
        logoUrl: result.url
      }))

      toast({
        title: 'Logo uploaded',
        description: 'Footer logo has been uploaded successfully.'
      })

    } catch (error) {
      console.error('Logo upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo'
      })
    } finally {
      setUploadingLogo(false)
      // Reset the input
      event.target.value = ''
    }
  }

  // Remove logo
  const handleRemoveLogo = () => {
    setFooterData(prev => ({
      ...prev,
      logoUrl: undefined
    }))
    toast({
      title: 'Logo removed',
      description: 'Footer logo has been removed.'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/settings">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-500 to-slate-600 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-gray-500 to-slate-600 p-3 rounded-2xl">
                  <Layout className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Footer Management
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Configure your website footer content and layout
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
              className="bg-white/80 hover:bg-white"
              disabled={loading}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {loading ? (
          // Loading state
          <Card className="bg-white/80 backdrop-blur-lg border border-white/20">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading footer settings...</p>
              </div>
            </CardContent>
          </Card>
        ) : previewMode ? (
          // Footer Preview
          <Card className="bg-white/80 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle>Footer Preview</CardTitle>
              <CardDescription>
                This is how your footer will appear on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="rounded-lg p-8"
                style={{ 
                  backgroundColor: footerData.backgroundColor,
                  color: footerData.textColor 
                }}
              >
                {/* Logo Section */}
                {footerData.logoUrl && footerData.showChurchLogo && (
                  <div className="flex justify-center mb-8">
                    <img 
                      src={footerData.logoUrl} 
                      alt="Church Logo" 
                      className="h-16 w-auto opacity-90"
                    />
                  </div>
                )}
                
                <div className="grid md:grid-cols-4 gap-8">
                  {footerData.sections
                    .filter(section => section.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map(section => (
                      <div key={section.id}>
                        <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                        
                        {section.type === 'contact' && (
                          <div className="space-y-2 text-sm opacity-90">
                            {section.content.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div className="whitespace-pre-line">{section.content.address}</div>
                              </div>
                            )}
                            {section.content.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{section.content.phone}</span>
                              </div>
                            )}
                            {section.content.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{section.content.email}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {section.type === 'links' && (
                          <div className="space-y-2">
                            {section.content.links
                              .filter((link: FooterLink) => link.enabled)
                              .map((link: FooterLink) => (
                                <div key={link.id}>
                                  <a 
                                    href={link.url}
                                    className="text-sm opacity-90 hover:opacity-100 transition-opacity flex items-center gap-1"
                                  >
                                    {link.label}
                                    {link.external && <ExternalLink className="h-3 w-3" />}
                                  </a>
                                </div>
                              ))}
                          </div>
                        )}

                        {section.type === 'social' && (
                          <div className="flex gap-3">
                            {section.content.links
                              .filter((link: SocialLink) => link.enabled)
                              .map((link: SocialLink) => {
                                const Icon = getSocialIcon(link.platform)
                                return (
                                  <a 
                                    key={link.platform}
                                    href={link.url}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                  >
                                    <Icon className="h-5 w-5" />
                                  </a>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {footerData.showCopyright && (
                  <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm opacity-75">
                    {footerData.copyrightText}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Edit Mode
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Footer Configuration</h2>
                  <p className="text-slate-300">Customize your website footer sections and content</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100/50 p-1 rounded-xl">
                  <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
                  <TabsTrigger value="contact" className="rounded-lg">Contact Info</TabsTrigger>
                  <TabsTrigger value="links" className="rounded-lg">Navigation Links</TabsTrigger>
                  <TabsTrigger value="social" className="rounded-lg">Social Media</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                  <div className="space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Footer Appearance</CardTitle>
                        <CardDescription>
                          Configure the overall appearance and layout of your footer
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Enable Footer</label>
                            <p className="text-sm text-muted-foreground">Show footer on your website</p>
                          </div>
                          <Switch
                            checked={footerData.enabled}
                            onCheckedChange={(checked) => 
                              setFooterData(prev => ({ ...prev, enabled: checked }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Background Color</label>
                            <Input
                              type="color"
                              value={footerData.backgroundColor}
                              onChange={(e) => 
                                setFooterData(prev => ({ ...prev, backgroundColor: e.target.value }))
                              }
                              className="h-12"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Text Color</label>
                            <Input
                              type="color"
                              value={footerData.textColor}
                              onChange={(e) => 
                                setFooterData(prev => ({ ...prev, textColor: e.target.value }))
                              }
                              className="h-12"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Copyright Text</label>
                          <Input
                            value={footerData.copyrightText}
                            onChange={(e) => 
                              setFooterData(prev => ({ ...prev, copyrightText: e.target.value }))
                            }
                            placeholder="© 2024 Your Church Name. All rights reserved."
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Show Copyright</label>
                            <p className="text-sm text-muted-foreground">Display copyright text in footer</p>
                          </div>
                          <Switch
                            checked={footerData.showCopyright}
                            onCheckedChange={(checked) => 
                              setFooterData(prev => ({ ...prev, showCopyright: checked }))
                            }
                          />
                        </div>

                        <Separator />

                        {/* Logo Upload Section */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Footer Logo</label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload a logo to display in your footer
                          </p>
                          
                          {footerData.logoUrl ? (
                            <div className="space-y-4">
                              <div className="relative inline-block">
                                <img 
                                  src={footerData.logoUrl} 
                                  alt="Footer Logo" 
                                  className="h-16 w-auto rounded-lg border border-gray-200 bg-white p-2"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById('footer-logo-upload')?.click()}
                                  disabled={uploadingLogo}
                                >
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Change Logo
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRemoveLogo}
                                  disabled={uploadingLogo}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-sm text-gray-600 mb-4">
                                No logo uploaded. Click to select an image.
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('footer-logo-upload')?.click()}
                                disabled={uploadingLogo}
                              >
                                {uploadingLogo ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Upload Logo
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          
                          <input
                            id="footer-logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Recommended: PNG or JPG, max 5MB. For best results, use a transparent background.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Contact Information */}
                <TabsContent value="contact">
                  {(() => {
                    const contactSection = footerData.sections.find(s => s.type === 'contact')
                    if (!contactSection) return null

                    return (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>
                              Church address, phone, email, and website
                            </CardDescription>
                          </div>
                          <Switch
                            checked={contactSection.enabled}
                            onCheckedChange={() => toggleSectionEnabled(contactSection.id)}
                          />
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Section Title</label>
                            <Input
                              value={contactSection.title}
                              onChange={(e) => 
                                setFooterData(prev => ({
                                  ...prev,
                                  sections: prev.sections.map(section =>
                                    section.id === contactSection.id
                                      ? { ...section, title: e.target.value }
                                      : section
                                  )
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Address</label>
                            <Textarea
                              value={contactSection.content.address}
                              onChange={(e) => updateSectionContent(contactSection.id, { address: e.target.value })}
                              placeholder="123 Church Street&#10;City, State 12345"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Phone</label>
                              <Input
                                value={contactSection.content.phone}
                                onChange={(e) => updateSectionContent(contactSection.id, { phone: e.target.value })}
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Email</label>
                              <Input
                                type="email"
                                value={contactSection.content.email}
                                onChange={(e) => updateSectionContent(contactSection.id, { email: e.target.value })}
                                placeholder="info@yourchurch.org"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Website</label>
                            <Input
                              type="url"
                              value={contactSection.content.website}
                              onChange={(e) => updateSectionContent(contactSection.id, { website: e.target.value })}
                              placeholder="https://yourchurch.org"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}
                </TabsContent>

                {/* Navigation Links */}
                <TabsContent value="links">
                  <div className="space-y-6">
                    {footerData.sections
                      .filter(section => section.type === 'links')
                      .map(section => (
                        <Card key={section.id}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                              <CardTitle>{section.title}</CardTitle>
                              <CardDescription>
                                Manage navigation links for this section
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={section.enabled}
                                onCheckedChange={() => toggleSectionEnabled(section.id)}
                              />
                              <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setEditingLink(null)
                                      linkForm.reset()
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Link
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      {editingLink ? 'Edit Link' : 'Add New Link'}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Add a navigation link to the {section.title} section
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Form {...linkForm}>
                                    <form 
                                      onSubmit={linkForm.handleSubmit((data) => handleSaveLink(data, section.id))}
                                      className="space-y-4"
                                    >
                                      <FormField
                                        control={linkForm.control}
                                        name="label"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Link Label</FormLabel>
                                            <FormControl>
                                              <Input {...field} placeholder="About Us" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={linkForm.control}
                                        name="url"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>URL</FormLabel>
                                            <FormControl>
                                              <Input {...field} placeholder="/about or https://external.com" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={linkForm.control}
                                        name="external"
                                        render={({ field }) => (
                                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                              <FormLabel className="text-base">External Link</FormLabel>
                                              <FormDescription>
                                                Open link in new tab/window
                                              </FormDescription>
                                            </div>
                                            <FormControl>
                                              <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      <DialogFooter>
                                        <Button type="submit">
                                          {editingLink ? 'Update Link' : 'Add Link'}
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Section Title</label>
                              <Input
                                value={section.title}
                                onChange={(e) => 
                                  setFooterData(prev => ({
                                    ...prev,
                                    sections: prev.sections.map(s =>
                                      s.id === section.id
                                        ? { ...s, title: e.target.value }
                                        : s
                                    )
                                  }))
                                }
                                className="mb-4"
                              />
                            </div>

                            <div className="space-y-2">
                              {section.content.links.map((link: FooterLink) => (
                                <div 
                                  key={link.id}
                                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={link.enabled}
                                      onCheckedChange={(checked) => {
                                        const updatedLinks = section.content.links.map((l: FooterLink) =>
                                          l.id === link.id ? { ...l, enabled: checked } : l
                                        )
                                        updateSectionContent(section.id, { links: updatedLinks })
                                      }}
                                    />
                                    <div>
                                      <div className="font-medium">{link.label}</div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        {link.url}
                                        {link.external && <ExternalLink className="h-3 w-3" />}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingLink(link)
                                        linkForm.reset(link)
                                        setShowLinkDialog(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteLink(link.id, section.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {section.content.links.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  No links added yet. Click "Add Link" to get started.
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                {/* Social Media */}
                <TabsContent value="social">
                  {(() => {
                    const socialSection = footerData.sections.find(s => s.type === 'social')
                    if (!socialSection) return null

                    return (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>
                              Connect your social media profiles
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={socialSection.enabled}
                              onCheckedChange={() => toggleSectionEnabled(socialSection.id)}
                            />
                            <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingSocial(null)
                                    socialForm.reset()
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Platform
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Social Media Platform</DialogTitle>
                                  <DialogDescription>
                                    Add or update a social media profile link
                                  </DialogDescription>
                                </DialogHeader>
                                <Form {...socialForm}>
                                  <form 
                                    onSubmit={socialForm.handleSubmit(handleSaveSocial)}
                                    className="space-y-4"
                                  >
                                    <FormField
                                      control={socialForm.control}
                                      name="platform"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Platform</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select platform" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {socialPlatforms.map(platform => (
                                                <SelectItem key={platform.id} value={platform.id}>
                                                  <div className="flex items-center gap-2">
                                                    <platform.icon className="h-4 w-4" />
                                                    {platform.name}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={socialForm.control}
                                      name="url"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Profile URL</FormLabel>
                                          <FormControl>
                                            <Input {...field} placeholder="https://facebook.com/yourchurch" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <DialogFooter>
                                      <Button type="submit">Add Platform</Button>
                                    </DialogFooter>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Section Title</label>
                            <Input
                              value={socialSection.title}
                              onChange={(e) => 
                                setFooterData(prev => ({
                                  ...prev,
                                  sections: prev.sections.map(s =>
                                    s.id === socialSection.id
                                      ? { ...s, title: e.target.value }
                                      : s
                                  )
                                }))
                              }
                              className="mb-4"
                            />
                          </div>

                          <div className="grid gap-3">
                            {socialPlatforms.map(platform => {
                              const link = socialSection.content.links.find((l: SocialLink) => l.platform === platform.id)
                              const Icon = platform.icon

                              return (
                                <div 
                                  key={platform.id}
                                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">{platform.name}</div>
                                      {link ? (
                                        <div className="text-sm text-muted-foreground">{link.url}</div>
                                      ) : (
                                        <div className="text-sm text-muted-foreground">Not configured</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {link && (
                                      <Switch
                                        checked={link.enabled}
                                        onCheckedChange={(checked) => {
                                          const updatedLinks = socialSection.content.links.map((l: SocialLink) =>
                                            l.platform === platform.id ? { ...l, enabled: checked } : l
                                          )
                                          updateSectionContent(socialSection.id, { links: updatedLinks })
                                        }}
                                      />
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingSocial(link || { platform: platform.id, url: '', enabled: true })
                                        socialForm.reset(link || { platform: platform.id, url: '', enabled: true })
                                        setShowSocialDialog(true)
                                      }}
                                    >
                                      {link ? 'Edit' : 'Add'}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 