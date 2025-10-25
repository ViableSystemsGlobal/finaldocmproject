'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Page, 
  PageSection, 
  SectionType, 
  savePageWithSections, 
  publishPage, 
  unpublishPage 
} from '@/services/content'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  Globe, 
  EyeOff 
} from 'lucide-react'
import { MediaPicker } from '@/components/content/MediaPicker'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface PageEditorProps {
  pageData?: Page
  sectionsData?: PageSection[]
}

export function PageEditor({ pageData, sectionsData }: PageEditorProps) {
  const router = useRouter()
  const isEditing = !!pageData
  
  // Page state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [published, setPublished] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoImage, setSeoImage] = useState('')
  
  // Sections state
  const [sections, setSections] = useState<(Omit<PageSection, 'id' | 'created_at' | 'page_id'> & { tempId: string })[]>([])
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (pageData) {
      setTitle(pageData.title)
      setSlug(pageData.slug)
      setPublished(!!pageData.published_at)
      setSeoTitle(pageData.seo_meta?.title || '')
      setSeoDescription(pageData.seo_meta?.description || '')
      setSeoImage(pageData.seo_meta?.image_url || '')
    }
    
    if (sectionsData && sectionsData.length > 0) {
      const formattedSections = sectionsData.map(section => ({
        type: section.type,
        order: section.order,
        props: section.props,
        tempId: section.id
      }))
      
      setSections(formattedSections)
      
      // Expand the first section by default
      if (formattedSections.length > 0) {
        setExpandedSections({ [formattedSections[0].tempId]: true })
      }
    }
  }, [pageData, sectionsData])
  
  // Generate slug from title
  const generateSlug = () => {
    if (!title) return
    
    const newSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-')      // Replace multiple hyphens with single
      .trim()
    
    setSlug(newSlug)
  }
  
  // Add a new section
  const addSection = (type: SectionType) => {
    const newSection = {
      type,
      order: sections.length,
      props: getDefaultPropsForType(type),
      tempId: uuidv4()
    }
    
    setSections([...sections, newSection])
    
    // Auto-expand the new section
    setExpandedSections({
      ...expandedSections,
      [newSection.tempId]: true
    })
  }
  
  // Get default props for a section type
  const getDefaultPropsForType = (type: SectionType): Record<string, any> => {
    switch (type) {
      case 'hero':
        return {
          firstLine: 'Welcome to Our Church',
          heading: 'Hero Heading',
          subheading: 'Subheading text goes here',
          backgroundImage: '',
          ctaButtons: [
            { text: 'Learn More', link: '#', style: 'primary' }
          ]
        }
      case 'event_carousel':
        return {
          title: 'Upcoming Events',
          description: 'Join us at our upcoming events',
          maxEvents: 4
        }
      case 'image_collage':
        return {
          title: 'Gallery',
          images: []
        }
      case 'sermon_carousel':
        return {
          title: 'Recent Sermons',
          description: 'Watch our latest messages',
          maxSermons: 3
        }
      case 'icon_grid':
        return {
          title: 'Our Ministries',
          description: 'Learn about our church ministries',
          items: [
            { icon: 'Heart', title: 'Ministry 1', description: 'Description text', link: '#' },
            { icon: 'Users', title: 'Ministry 2', description: 'Description text', link: '#' }
          ]
        }
      case 'testimonial_slider':
        return {
          title: 'Testimonials',
          subtitle: 'What Our Community Says',
          testimonials: [
            { 
              name: 'Sarah Johnson', 
              role: 'Church Member',
              text: 'Joining this church was a life-changing decision for our family. The community here brought our faith to life.',
              image: '',
              video_url: '',
              has_video: false
            },
            { 
              name: 'Pastor Michael', 
              role: 'Lead Pastor',
              text: 'Witnessing God\'s transformative power through our community outreach programs has been incredible.',
              image: '',
              video_url: '',
              has_video: false
            },
            { 
              name: 'Maria Garcia', 
              role: 'Youth Leader',
              text: 'The support and love I\'ve received here has helped me grow not just in faith, but as a person.',
              image: '',
              video_url: '',
              has_video: false
            }
          ]
        }
      case 'call_to_action':
        return {
          heading: 'Ready to join us?',
          text: 'Come be a part of our community',
          buttonText: 'Get Started',
          buttonLink: '#',
          backgroundImage: ''
        }
      case 'media_sections':
        return {
          title: 'Photo Gallery',
          subtitle: 'Capturing moments from our services and programs',
          type: 'photos',
          collections_to_show: 4,
          show_category_badges: true,
          layout: 'grid'
        }
      case 'event_list':
        return {
          title: 'All Events',
          showFilters: true,
          eventsPerPage: 10
        }
      case 'contact_section':
        return {
          title: 'Contact Us',
          address: '123 Church St, City, State',
          phone: '(123) 456-7890',
          email: 'info@church.com',
          showMap: true
        }
      case 'our_story':
        return {
          first_line: 'Our Story',
          main_header: 'Who We Are',
          paragraph_text: 'Share your church\'s journey, mission, and the heart behind your ministry. This is where you can tell your community about your history, values, and what drives your passion for serving Christ.',
          media_url: '',
          media_type: 'image', // 'image' or 'video'
          button_text: 'Learn More',
          button_link: '#',
          button_style: 'primary' // 'primary' or 'secondary'
        }
      case 'get_involved':
        return {
          title: 'Get Involved',
          subtitle: 'Join Our Community',
          description: 'Discover meaningful ways to connect, serve, and grow in your faith journey with us.',
          show_all_link: true,
          all_link_text: 'View All Opportunities',
          all_link_url: '/get-involved',
          max_items: 6,
          filter_categories: [], // Empty means show all categories
          layout: 'grid' // 'grid' or 'list'
        }
      case 'mission_vision':
        return {
          first_line: 'Our Purpose',
          main_header: 'Mission & Vision',
          subheader: 'Our mission guides everything we do, and our vision inspires where we\'re going',
          mission: {
            title: 'Our Mission',
            description: 'To make disciples of Jesus Christ by loving God, loving others, and serving our community with excellence, integrity, and unwavering compassion.',
            media_url: '',
            media_type: 'video',
            items: [
              'Loving God: Through worship, prayer, and biblical study',
              'Loving Others: Building authentic relationships and community',
              'Serving Community: Meeting needs with compassion and excellence'
            ]
          },
          vision: {
            title: 'Our Vision',
            description: 'To be a thriving, Christ-centered community that transforms lives, strengthens families, and impacts our local and global neighborhoods for the Kingdom of God.',
            media_url: '',
            media_type: 'video', 
            items: [
              'Thriving Community: A place where everyone belongs and grows',
              'Transformed Lives: Experiencing the life-changing power of Jesus',
              'Global Impact: Reaching beyond our walls to serve the world'
            ]
          }
        }
      case 'leadership_team':
        return {
          first_line: 'Our Team',
          main_header: 'Leadership Team',
          subheader: 'Meet the passionate leaders who guide our church with wisdom, compassion, and dedication to serving God and our community',
          head_pastor: {
            name: 'Pastor Michael Johnson',
            role: 'Lead Pastor',
            bio: 'With over 15 years of ministry experience, Pastor Michael brings passion for teaching and community building to DOCM Church.',
            media_url: '',
            media_type: 'video',
            areas_of_ministry: ['Teaching', 'Community Building', 'Pastoral Care'],
            button_text: 'Watch Message',
            button_link: '#'
          },
          other_pastors: [
            {
              name: 'Sarah Williams',
              role: 'Worship Director',
              bio: 'Sarah leads our worship ministry with a heart for creating meaningful encounters with God through music and praise.',
              media_url: '',
              media_type: 'video',
              areas_of_ministry: ['Worship Leading', 'Music Ministry', 'Creative Arts']
            },
            {
              name: 'David Chen',
              role: 'Youth Pastor', 
              bio: 'David is passionate about helping young people discover their identity in Christ and grow in their faith journey.',
              media_url: '',
              media_type: 'video',
              areas_of_ministry: ['Youth Ministry', 'Discipleship', 'Mentoring']
            }
          ]
        }
      case 'team_highlights':
        return {
          title: 'Team Highlights',
          subtitle: 'Celebrating Excellence',
          description: 'Recognizing the outstanding achievements and contributions of our dedicated team members',
          layout: 'grid',
          background_color: 'white',
          show_icons: true,
          highlights: [
            {
              name: 'Pastor Sarah Williams',
              role: 'Worship Director',
              achievement: 'Church Growth Leadership Award',
              description: 'Led our worship ministry to reach over 500 regular attendees, creating meaningful worship experiences that brought our community closer to God.',
              image_url: '',
              video_url: '',
              media_type: 'image',
              highlight_type: 'achievement'
            },
            {
              name: 'David Chen',
              role: 'Youth Pastor',
              achievement: '10 Years of Youth Ministry',
              description: 'Celebrating a decade of dedicated service to young people, helping over 200 youth discover their faith and purpose.',
              image_url: '',
              video_url: '',
              media_type: 'image',
              highlight_type: 'milestone'
            },
            {
              name: 'Maria Rodriguez',
              role: 'Community Outreach Coordinator',
              achievement: 'Community Service Recognition',
              description: 'Recognized by the city for exceptional community service, organizing food drives that served over 1,000 families in need.',
              image_url: '',
              video_url: '',
              media_type: 'image',
              highlight_type: 'recognition'
            }
          ]
        }
      default:
        return {}
    }
  }
  
  // Remove a section
  const removeSection = (tempId: string) => {
    setSections(sections.filter(section => section.tempId !== tempId))
  }
  
  // Toggle section expansion
  const toggleSectionExpand = (tempId: string) => {
    setExpandedSections({
      ...expandedSections,
      [tempId]: !expandedSections[tempId]
    })
  }
  
  // Update section props
  const updateSectionProps = (tempId: string, newProps: Record<string, any>) => {
    setSections(sections.map(section => 
      section.tempId === tempId 
        ? { ...section, props: { ...section.props, ...newProps } } 
        : section
    ))
  }
  
  // Handle drag and drop reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return
    
    const items = Array.from(sections)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    // Update order numbers
    const reorderedSections = items.map((item, index) => ({
      ...item,
      order: index
    }))
    
    setSections(reorderedSections)
  }
  
  // Save the page
  const savePage = async () => {
    if (!title || !slug) {
      toast({
        title: 'Error',
        description: 'Title and slug are required',
        variant: 'destructive'
      })
      return
    }
    
    setSaving(true)
    
    try {
      const pageToSave = {
        title,
        slug,
        seo_meta: {
          title: seoTitle,
          description: seoDescription,
          image_url: seoImage
        },
        published_at: published ? new Date().toISOString() : null
      }
      
      // Strip tempId from sections
      const sectionsToSave = sections.map(({ tempId, ...rest }) => rest)
      
      console.log('Saving page with data:', { pageToSave, sectionsToSave, pageId: pageData?.id })
      
      const { data, error } = await savePageWithSections(
        pageToSave,
        sectionsToSave,
        pageData?.id
      )
      
      if (error) throw error
      
      // Log the response for debugging
      console.log('Save response:', data)
      
      if (!data?.page) {
        throw new Error('No page data returned after save')
      }
      
      toast({
        title: 'Success',
        description: `Page ${isEditing ? 'updated' : 'created'} successfully`
      })
      
      // Handle redirection with better error handling
      if (!isEditing) {
        let pageId = null
        
        if (typeof data.page === 'object' && data.page !== null) {
          if ('id' in data.page) {
            pageId = data.page.id
          } else if (Array.isArray(data.page) && data.page.length > 0 && data.page[0]?.id) {
            pageId = data.page[0].id
          }
        }
        
        if (pageId) {
          console.log('Redirecting to page ID:', pageId)
          router.push(`/content/${pageId}`)
        } else {
          console.error('No valid page ID found for redirection:', data.page)
          toast({
            title: 'Warning',
            description: 'Page saved but could not redirect to editor. Returning to content list.',
            variant: 'destructive'
          })
          router.push('/content')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error saving page:', error)
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} page: ${errorMessage}`,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Toggle published status
  const togglePublished = async () => {
    if (!pageData?.id) return
    
    try {
      const { error } = published 
        ? await unpublishPage(pageData.id)
        : await publishPage(pageData.id)
        
      if (error) throw error
      
      setPublished(!published)
      
      toast({
        title: 'Success',
        description: `Page ${published ? 'unpublished' : 'published'} successfully`
      })
    } catch (error) {
      console.error(`Error ${published ? 'unpublishing' : 'publishing'} page:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${published ? 'unpublish' : 'publish'} page`,
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title"
              />
            </div>
            
            <div className="space-y-2 flex items-center lg:justify-end">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="published" 
                  checked={published}
                  onCheckedChange={isEditing ? togglePublished : setPublished}
                />
                <Label htmlFor="published">
                  {published ? 'Published' : 'Draft'}
                </Label>
              </div>
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">Page Slug</Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={generateSlug} 
                  className="h-auto p-0"
                  type="button"
                >
                  Generate from title
                </Button>
              </div>
              <div className="flex">
                <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                  /
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="page-slug"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Tabs defaultValue="seo">
              <TabsList>
                <TabsTrigger value="seo">SEO Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="seo" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="SEO title (leave blank to use page title)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Meta Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Enter meta description for search engines"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoImage">Meta Image URL</Label>
                  <Input
                    id="seoImage"
                    value={seoImage}
                    onChange={(e) => setSeoImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Content Sections</CardTitle>
          <Select onValueChange={(value) => addSection(value as SectionType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Add Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero</SelectItem>
              <SelectItem value="event_carousel">Event Carousel</SelectItem>
              <SelectItem value="image_collage">Image Collage</SelectItem>
              <SelectItem value="sermon_carousel">Sermon Carousel</SelectItem>
              <SelectItem value="icon_grid">Icon Grid</SelectItem>
              <SelectItem value="testimonial_slider">Testimonial Slider</SelectItem>
              <SelectItem value="call_to_action">Call to Action</SelectItem>
              <SelectItem value="media_sections">Media Gallery</SelectItem>
              <SelectItem value="event_list">Event List</SelectItem>
              <SelectItem value="contact_section">Contact Section</SelectItem>
              <SelectItem value="our_story">Our Story</SelectItem>
              <SelectItem value="get_involved">Get Involved</SelectItem>
              <SelectItem value="mission_vision">Mission & Vision</SelectItem>
              <SelectItem value="leadership_team">Leadership Team</SelectItem>
              <SelectItem value="team_highlights">Team Highlights</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No content sections yet</p>
              <Button 
                onClick={() => addSection('hero')}
                className="mx-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Hero Section
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {sections.map((section, index) => (
                      <Draggable 
                        key={section.tempId} 
                        draggableId={section.tempId} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-lg bg-card"
                          >
                            {/* Section Header */}
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer border-b"
                              onClick={() => toggleSectionExpand(section.tempId)}
                            >
                              <div className="flex items-center space-x-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <h3 className="font-medium capitalize">
                                  {section.type.replace('_', ' ')} Section
                                </h3>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeSection(section.tempId)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {expandedSections[section.tempId] ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </div>
                            </div>
                            
                            {/* Section Content */}
                            {expandedSections[section.tempId] && (
                              <div className="p-4">
                                <SectionEditor 
                                  type={section.type} 
                                  props={section.props}
                                  onChange={(newProps) => updateSectionProps(section.tempId, newProps)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => router.push('/content')}
        >
          Cancel
        </Button>
        <Button 
          onClick={savePage}
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          Save {published ? 'and Publish' : 'as Draft'}
        </Button>
      </div>
    </div>
  )
}

interface SectionEditorProps {
  type: SectionType
  props: Record<string, any>
  onChange: (newProps: Record<string, any>) => void
}

function SectionEditor({ type, props, onChange }: SectionEditorProps) {
  const updateProps = (key: string, value: any) => {
    onChange({ [key]: value })
  }
  
  // Render fields based on section type
  switch (type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-first-line">First Line Text</Label>
            <Input
              id="hero-first-line"
              value={props.firstLine || ''}
              onChange={(e) => updateProps('firstLine', e.target.value)}
              placeholder="e.g., Welcome to Our Church"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-heading">Heading</Label>
            <Input
              id="hero-heading"
              value={props.heading || ''}
              onChange={(e) => updateProps('heading', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subheading">Subheading</Label>
            <Textarea
              id="hero-subheading"
              value={props.subheading || ''}
              onChange={(e) => updateProps('subheading', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-image">Background Media</Label>
            <MediaPicker
              selectedUrl={props.backgroundImage}
              onSelect={(url) => updateProps('backgroundImage', url)}
              type="all"
              buttonText="Select Background Media"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>CTA Buttons</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newButtons = [...(props.ctaButtons || []), { text: 'New Button', link: '#', style: 'secondary' }];
                  updateProps('ctaButtons', newButtons);
                }}
              >
                Add Button
              </Button>
            </div>
            
            {props.ctaButtons && props.ctaButtons.length > 0 ? (
              <div className="space-y-3">
                {props.ctaButtons.map((button: any, index: number) => (
                  <div key={index} className="border rounded-md p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Button {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={index === 0 && props.ctaButtons.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                        disabled={index === 0 && props.ctaButtons.length === 1}
                        onClick={() => {
                          if (index === 0 && props.ctaButtons.length === 1) return; // Don't allow removing the last button
                          const newButtons = [...props.ctaButtons];
                          newButtons.splice(index, 1);
                          updateProps('ctaButtons', newButtons);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`hero-button-${index}-text`} className="text-xs">Button Text</Label>
                        <Input
                          id={`hero-button-${index}-text`}
                          value={button.text || ''}
                          onChange={(e) => {
                            const newButtons = [...props.ctaButtons];
                            newButtons[index] = { ...newButtons[index], text: e.target.value };
                            updateProps('ctaButtons', newButtons);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`hero-button-${index}-link`} className="text-xs">Button Link</Label>
                        <Input
                          id={`hero-button-${index}-link`}
                          value={button.link || ''}
                          onChange={(e) => {
                            const newButtons = [...props.ctaButtons];
                            newButtons[index] = { ...newButtons[index], link: e.target.value };
                            updateProps('ctaButtons', newButtons);
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`hero-button-${index}-style`} className="text-xs">Button Style</Label>
                      <Select
                        value={button.style || 'primary'}
                        onValueChange={(value) => {
                          const newButtons = [...props.ctaButtons];
                          newButtons[index] = { ...newButtons[index], style: value };
                          updateProps('ctaButtons', newButtons);
                        }}
                      >
                        <SelectTrigger id={`hero-button-${index}-style`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">No buttons added yet</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    updateProps('ctaButtons', [{ text: 'Learn More', link: '#', style: 'primary' }]);
                  }}
                >
                  Add First Button
                </Button>
              </div>
            )}
          </div>
        </div>
      )
      
    case 'call_to_action':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta-heading">Heading</Label>
            <Input
              id="cta-heading"
              value={props.heading || ''}
              onChange={(e) => updateProps('heading', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-text">Text</Label>
            <Textarea
              id="cta-text"
              value={props.text || ''}
              onChange={(e) => updateProps('text', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-background">Background Media</Label>
            <MediaPicker
              selectedUrl={props.backgroundImage}
              onSelect={(url) => updateProps('backgroundImage', url)}
              type="all"
              buttonText="Select Background Media"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta-button-text">Button Text</Label>
              <Input
                id="cta-button-text"
                value={props.buttonText || ''}
                onChange={(e) => updateProps('buttonText', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-button-link">Button Link</Label>
              <Input
                id="cta-button-link"
                value={props.buttonLink || ''}
                onChange={(e) => updateProps('buttonLink', e.target.value)}
              />
            </div>
          </div>
        </div>
      )
      
    case 'event_carousel':
    case 'sermon_carousel':
      const isSermonsSection = type === 'sermon_carousel'
      const entityName = isSermonsSection ? 'Sermons' : 'Events'
      const countPropName = isSermonsSection ? 'maxSermons' : 'maxEvents'
      
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${type}-title`}>Section Title</Label>
            <Input
              id={`${type}-title`}
              value={props.title || ''}
              onChange={(e) => updateProps('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${type}-description`}>Description</Label>
            <Textarea
              id={`${type}-description`}
              value={props.description || ''}
              onChange={(e) => updateProps('description', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${type}-max`}>Maximum {entityName} to Display</Label>
            <Input
              id={`${type}-max`}
              type="number"
              min="1"
              max="10"
              value={props[countPropName] || 3}
              onChange={(e) => updateProps(countPropName, parseInt(e.target.value) || 3)}
            />
          </div>
        </div>
      )
      
    case 'image_collage':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collage-title">Section Title</Label>
            <Input
              id="collage-title"
              value={props.title || ''}
              onChange={(e) => updateProps('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="grid grid-cols-3 gap-2">
              {(props.images || []).map((image: string, index: number) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Collage image ${index + 1}`}
                    className="h-24 w-full object-cover rounded-md"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => {
                      const newImages = [...props.images]
                      newImages.splice(index, 1)
                      updateProps('images', newImages)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="h-24 flex items-center justify-center border border-dashed rounded-md">
                <MediaPicker
                  onSelect={(url) => {
                    const newImages = [...(props.images || []), url]
                    updateProps('images', newImages)
                  }}
                  buttonText="Add Image"
                  type="image"
                />
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'testimonial_slider':
      return (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testimonials-title">Section Title</Label>
              <Input
                id="testimonials-title"
                value={props.title || ''}
                onChange={(e) => updateProps('title', e.target.value)}
                placeholder="e.g. Testimonials"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonials-subtitle">Subtitle</Label>
              <Input
                id="testimonials-subtitle"
                value={props.subtitle || ''}
                onChange={(e) => updateProps('subtitle', e.target.value)}
                placeholder="e.g. What Our Community Says"
              />
            </div>
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Testimonials</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newTestimonials = [...(props.testimonials || []), {
                    name: 'New Person',
                    role: 'Church Member',
                    text: 'Add your testimonial text here...',
                    image: '',
                    video_url: '',
                    has_video: false
                  }];
                  updateProps('testimonials', newTestimonials);
                }}
              >
                Add Testimonial
              </Button>
            </div>
            
            {props.testimonials && props.testimonials.length > 0 ? (
              <div className="space-y-6">
                {props.testimonials.map((testimonial: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Testimonial {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newTestimonials = [...props.testimonials];
                          newTestimonials.splice(index, 1);
                          updateProps('testimonials', newTestimonials);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Name and Role */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`testimonial-${index}-name`}>Name</Label>
                        <Input
                          id={`testimonial-${index}-name`}
                          value={testimonial.name || ''}
                          onChange={(e) => {
                            const newTestimonials = [...props.testimonials];
                            newTestimonials[index] = { ...newTestimonials[index], name: e.target.value };
                            updateProps('testimonials', newTestimonials);
                          }}
                          placeholder="Person's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`testimonial-${index}-role`}>Role</Label>
                        <Input
                          id={`testimonial-${index}-role`}
                          value={testimonial.role || ''}
                          onChange={(e) => {
                            const newTestimonials = [...props.testimonials];
                            newTestimonials[index] = { ...newTestimonials[index], role: e.target.value };
                            updateProps('testimonials', newTestimonials);
                          }}
                          placeholder="e.g. Church Member, Pastor"
                        />
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <div className="space-y-2">
                      <Label htmlFor={`testimonial-${index}-text`}>Testimonial Text</Label>
                      <Textarea
                        id={`testimonial-${index}-text`}
                        value={testimonial.text || ''}
                        onChange={(e) => {
                          const newTestimonials = [...props.testimonials];
                          newTestimonials[index] = { ...newTestimonials[index], text: e.target.value };
                          updateProps('testimonials', newTestimonials);
                        }}
                        rows={3}
                        placeholder="Enter the testimonial quote..."
                      />
                    </div>

                    {/* Media Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 min-w-0 w-full">
                        <Label htmlFor={`testimonial-${index}-image`}>Profile Image</Label>
                        <div className="w-full">
                          <MediaPicker
                            selectedUrl={testimonial.image}
                            onSelect={(url) => {
                              const newTestimonials = [...props.testimonials];
                              newTestimonials[index] = { ...newTestimonials[index], image: url };
                              updateProps('testimonials', newTestimonials);
                            }}
                            type="image"
                            buttonText="Select Image"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 min-w-0 w-full">
                        <Label htmlFor={`testimonial-${index}-video`}>Testimonial Video</Label>
                        <div className="w-full">
                          <MediaPicker
                            selectedUrl={testimonial.video_url}
                            onSelect={(url) => {
                              const newTestimonials = [...props.testimonials];
                              newTestimonials[index] = { 
                                ...newTestimonials[index], 
                                video_url: url,
                                has_video: Boolean(url)
                              };
                              updateProps('testimonials', newTestimonials);
                            }}
                            type="video"
                            buttonText="Select Video"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Video Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`testimonial-${index}-has-video`}
                        checked={Boolean(testimonial.has_video)}
                        onCheckedChange={(checked) => {
                          const newTestimonials = [...props.testimonials];
                          newTestimonials[index] = { ...newTestimonials[index], has_video: checked };
                          updateProps('testimonials', newTestimonials);
                        }}
                      />
                      <Label htmlFor={`testimonial-${index}-has-video`}>
                        Show as video testimonial
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">No testimonials added yet</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateProps('testimonials', [{
                      name: 'First Person',
                      role: 'Church Member',
                      text: 'Add your first testimonial here...',
                      image: '',
                      video_url: '',
                      has_video: false
                    }]);
                  }}
                >
                  Add First Testimonial
                </Button>
              </div>
            )}
          </div>
        </div>
      )
      
    case 'our_story':
      return (
        <div className="space-y-6">
          {/* Text Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_line">First Line Text</Label>
              <Input
                id="first_line"
                value={props.first_line || ''}
                onChange={(e) => updateProps('first_line', e.target.value)}
                placeholder="e.g. Our Story"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_header">Main Header</Label>
              <Input
                id="main_header"
                value={props.main_header || ''}
                onChange={(e) => updateProps('main_header', e.target.value)}
                placeholder="e.g. Who We Are"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paragraph_text">Paragraph Text</Label>
            <Textarea
              id="paragraph_text"
              value={props.paragraph_text || ''}
              onChange={(e) => updateProps('paragraph_text', e.target.value)}
              rows={4}
              placeholder="Share your church's journey, mission, and values..."
            />
          </div>
          
          {/* Media Section */}
          <div className="space-y-4">
            <Label>Media Upload</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="media_type">Media Type</Label>
                <Select
                  value={props.media_type || 'image'}
                  onValueChange={(value) => updateProps('media_type', value)}
                >
                  <SelectTrigger id="media_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Upload Media</Label>
                <MediaPicker
                  selectedUrl={props.media_url || ''}
                  onSelect={(url) => updateProps('media_url', url)}
                  type={props.media_type === 'video' ? 'video' : 'image'}
                />
              </div>
            </div>
          </div>
          
          {/* Button Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button_text">Button Text</Label>
              <Input
                id="button_text"
                value={props.button_text || ''}
                onChange={(e) => updateProps('button_text', e.target.value)}
                placeholder="e.g. Learn More"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button_link">Button Link</Label>
              <Input
                id="button_link"
                value={props.button_link || ''}
                onChange={(e) => updateProps('button_link', e.target.value)}
                placeholder="e.g. /about"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button_style">Button Style</Label>
              <Select
                value={props.button_style || 'primary'}
                onValueChange={(value) => updateProps('button_style', value)}
              >
                <SelectTrigger id="button_style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )
      
    case 'get_involved':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={props.title || ''}
              onChange={(e) => updateProps('title', e.target.value)}
              placeholder="Enter title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={props.subtitle || ''}
              onChange={(e) => updateProps('subtitle', e.target.value)}
              placeholder="Enter subtitle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={props.description || ''}
              onChange={(e) => updateProps('description', e.target.value)}
              rows={3}
              placeholder="Enter description"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_items">Max Items to Display</Label>
              <Input
                id="max_items"
                type="number"
                value={props.max_items || 6}
                onChange={(e) => updateProps('max_items', parseInt(e.target.value) || 6)}
                placeholder="6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="layout">Layout Style</Label>
              <Select
                value={props.layout || 'grid'}
                onValueChange={(value) => updateProps('layout', value)}
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="list">List Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show_all_link"
                checked={Boolean(props.show_all_link)}
                onCheckedChange={(checked) => updateProps('show_all_link', checked)}
              />
              <Label htmlFor="show_all_link">Show "View All" link</Label>
            </div>
            
            {props.show_all_link && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="all_link_text">Link Text</Label>
                  <Input
                    id="all_link_text"
                    value={props.all_link_text || ''}
                    onChange={(e) => updateProps('all_link_text', e.target.value)}
                    placeholder="View All Opportunities"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="all_link_url">Link URL</Label>
                  <Input
                    id="all_link_url"
                    value={props.all_link_url || ''}
                    onChange={(e) => updateProps('all_link_url', e.target.value)}
                    placeholder="/get-involved"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
      
    case 'mission_vision':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_line">First Line Text</Label>
              <Input
                id="first_line"
                value={props.first_line || ''}
                onChange={(e) => updateProps('first_line', e.target.value)}
                placeholder="e.g. Our Purpose"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_header">Main Header</Label>
              <Input
                id="main_header"
                value={props.main_header || ''}
                onChange={(e) => updateProps('main_header', e.target.value)}
                placeholder="e.g. Mission & Vision"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subheader">Subheader</Label>
            <Textarea
              id="subheader"
              value={props.subheader || ''}
              onChange={(e) => updateProps('subheader', e.target.value)}
              rows={2}
              placeholder="Enter subheader text"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Mission</h4>
              <div className="space-y-2">
                <Label htmlFor="mission_title">Title</Label>
                <Input
                  id="mission_title"
                  value={props.mission?.title || ''}
                  onChange={(e) => updateProps('mission', { ...props.mission, title: e.target.value })}
                  placeholder="Our Mission"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission_description">Description</Label>
                <Textarea
                  id="mission_description"
                  value={props.mission?.description || ''}
                  onChange={(e) => updateProps('mission', { ...props.mission, description: e.target.value })}
                  rows={3}
                  placeholder="Mission statement..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission_media">Media</Label>
                <MediaPicker
                  selectedUrl={props.mission?.media_url || ''}
                  onSelect={(url) => updateProps('mission', { ...props.mission, media_url: url })}
                  type="all"
                  buttonText="Select Mission Media"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission_items">Key Points (one per line)</Label>
                <Textarea
                  id="mission_items"
                  value={props.mission?.items?.join('\n') || ''}
                  onChange={(e) => updateProps('mission', { ...props.mission, items: e.target.value.split('\n').filter(item => item.trim()) })}
                  rows={3}
                  placeholder="Point 1: Description&#10;Point 2: Description&#10;Point 3: Description"
                />
              </div>
            </div>

            {/* Vision Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Vision</h4>
              <div className="space-y-2">
                <Label htmlFor="vision_title">Title</Label>
                <Input
                  id="vision_title"
                  value={props.vision?.title || ''}
                  onChange={(e) => updateProps('vision', { ...props.vision, title: e.target.value })}
                  placeholder="Our Vision"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision_description">Description</Label>
                <Textarea
                  id="vision_description"
                  value={props.vision?.description || ''}
                  onChange={(e) => updateProps('vision', { ...props.vision, description: e.target.value })}
                  rows={3}
                  placeholder="Vision statement..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision_media">Media</Label>
                <MediaPicker
                  selectedUrl={props.vision?.media_url || ''}
                  onSelect={(url) => updateProps('vision', { ...props.vision, media_url: url })}
                  type="all"
                  buttonText="Select Vision Media"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision_items">Key Points (one per line)</Label>
                <Textarea
                  id="vision_items"
                  value={props.vision?.items?.join('\n') || ''}
                  onChange={(e) => updateProps('vision', { ...props.vision, items: e.target.value.split('\n').filter(item => item.trim()) })}
                  rows={3}
                  placeholder="Point 1: Description&#10;Point 2: Description&#10;Point 3: Description"
                />
              </div>
            </div>
          </div>
        </div>
      )
      
    case 'leadership_team':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_line">First Line Text</Label>
              <Input
                id="first_line"
                value={props.first_line || ''}
                onChange={(e) => updateProps('first_line', e.target.value)}
                placeholder="e.g. Our Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_header">Main Header</Label>
              <Input
                id="main_header"
                value={props.main_header || ''}
                onChange={(e) => updateProps('main_header', e.target.value)}
                placeholder="e.g. Leadership Team"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subheader">Subheader</Label>
            <Textarea
              id="subheader"
              value={props.subheader || ''}
              onChange={(e) => updateProps('subheader', e.target.value)}
              rows={2}
              placeholder="Enter subheader text"
            />
          </div>

          {/* Head Pastor Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-semibold text-lg">Head Pastor</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="head_pastor_name">Name</Label>
                <Input
                  id="head_pastor_name"
                  value={props.head_pastor?.name || ''}
                  onChange={(e) => updateProps('head_pastor', { ...props.head_pastor, name: e.target.value })}
                  placeholder="Pastor Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head_pastor_role">Role</Label>
                <Input
                  id="head_pastor_role"
                  value={props.head_pastor?.role || ''}
                  onChange={(e) => updateProps('head_pastor', { ...props.head_pastor, role: e.target.value })}
                  placeholder="Lead Pastor"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="head_pastor_bio">Biography</Label>
              <Textarea
                id="head_pastor_bio"
                value={props.head_pastor?.bio || ''}
                onChange={(e) => updateProps('head_pastor', { ...props.head_pastor, bio: e.target.value })}
                rows={3}
                placeholder="Biography..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="head_pastor_media">Media</Label>
              <MediaPicker
                selectedUrl={props.head_pastor?.media_url || ''}
                onSelect={(url) => updateProps('head_pastor', { ...props.head_pastor, media_url: url })}
                type="all"
                buttonText="Select Pastor Media"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="head_pastor_areas">Areas of Ministry (one per line)</Label>
              <Textarea
                id="head_pastor_areas"
                value={props.head_pastor?.areas_of_ministry?.join('\n') || ''}
                onChange={(e) => updateProps('head_pastor', { 
                  ...props.head_pastor, 
                  areas_of_ministry: e.target.value.split('\n').filter(area => area.trim()) 
                })}
                rows={3}
                placeholder="Teaching&#10;Community Building&#10;Pastoral Care"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="head_pastor_button_text">Button Text</Label>
                <Input
                  id="head_pastor_button_text"
                  value={props.head_pastor?.button_text || ''}
                  onChange={(e) => updateProps('head_pastor', { ...props.head_pastor, button_text: e.target.value })}
                  placeholder="Watch Message"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head_pastor_button_link">Button Link</Label>
                <Input
                  id="head_pastor_button_link"
                  value={props.head_pastor?.button_link || ''}
                  onChange={(e) => updateProps('head_pastor', { ...props.head_pastor, button_link: e.target.value })}
                  placeholder="#"
                />
              </div>
            </div>
          </div>

          {/* Other Pastors Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-semibold text-lg">Other Team Members</h4>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Add and manage your leadership team members</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newPastors = [...(props.other_pastors || []), {
                    name: 'New Team Member',
                    role: 'Role',
                    bio: 'Add biography here...',
                    media_url: '',
                    media_type: 'video',
                    areas_of_ministry: ['Ministry Area']
                  }];
                  updateProps('other_pastors', newPastors);
                }}
              >
                Add Team Member
              </Button>
            </div>
            
            {props.other_pastors && props.other_pastors.length > 0 ? (
              <div className="space-y-6">
                {props.other_pastors.map((pastor: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">Team Member {index + 1}</h5>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newPastors = [...props.other_pastors];
                          newPastors.splice(index, 1);
                          updateProps('other_pastors', newPastors);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Name and Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`pastor-${index}-name`}>Name</Label>
                        <Input
                          id={`pastor-${index}-name`}
                          value={pastor.name || ''}
                          onChange={(e) => {
                            const newPastors = [...props.other_pastors];
                            newPastors[index] = { ...newPastors[index], name: e.target.value };
                            updateProps('other_pastors', newPastors);
                          }}
                          placeholder="Team member's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`pastor-${index}-role`}>Role</Label>
                        <Input
                          id={`pastor-${index}-role`}
                          value={pastor.role || ''}
                          onChange={(e) => {
                            const newPastors = [...props.other_pastors];
                            newPastors[index] = { ...newPastors[index], role: e.target.value };
                            updateProps('other_pastors', newPastors);
                          }}
                          placeholder="e.g. Worship Director, Youth Pastor"
                        />
                      </div>
                    </div>

                    {/* Biography */}
                    <div className="space-y-2">
                      <Label htmlFor={`pastor-${index}-bio`}>Biography</Label>
                      <Textarea
                        id={`pastor-${index}-bio`}
                        value={pastor.bio || ''}
                        onChange={(e) => {
                          const newPastors = [...props.other_pastors];
                          newPastors[index] = { ...newPastors[index], bio: e.target.value };
                          updateProps('other_pastors', newPastors);
                        }}
                        rows={3}
                        placeholder="Brief biography about this team member..."
                      />
                    </div>

                    {/* Media Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`pastor-${index}-media-type`}>Media Type</Label>
                        <Select
                          value={pastor.media_type || 'video'}
                          onValueChange={(value) => {
                            const newPastors = [...props.other_pastors];
                            newPastors[index] = { ...newPastors[index], media_type: value };
                            updateProps('other_pastors', newPastors);
                          }}
                        >
                          <SelectTrigger id={`pastor-${index}-media-type`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`pastor-${index}-media`}>Media Upload</Label>
                        <MediaPicker
                          selectedUrl={pastor.media_url || ''}
                          onSelect={(url) => {
                            const newPastors = [...props.other_pastors];
                            newPastors[index] = { ...newPastors[index], media_url: url };
                            updateProps('other_pastors', newPastors);
                          }}
                          type={pastor.media_type === 'video' ? 'video' : 'image'}
                          buttonText={`Select ${pastor.media_type === 'video' ? 'Video' : 'Image'}`}
                        />
                      </div>
                    </div>

                    {/* Areas of Ministry */}
                    <div className="space-y-2">
                      <Label htmlFor={`pastor-${index}-areas`}>Areas of Ministry (one per line)</Label>
                      <Textarea
                        id={`pastor-${index}-areas`}
                        value={pastor.areas_of_ministry?.join('\n') || ''}
                        onChange={(e) => {
                          const newPastors = [...props.other_pastors];
                          newPastors[index] = { 
                            ...newPastors[index], 
                            areas_of_ministry: e.target.value.split('\n').filter(area => area.trim()) 
                          };
                          updateProps('other_pastors', newPastors);
                        }}
                        rows={3}
                        placeholder="Worship Leading&#10;Music Ministry&#10;Creative Arts"
                      />
                    </div>

                    {/* Preview */}
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h6 className="text-xs font-medium text-gray-500 mb-2">Preview:</h6>
                      <div className="text-sm">
                        <span className="font-semibold">{pastor.name || 'Name'}</span>
                        <span className="text-blue-600 mx-2">•</span>
                        <span>{pastor.role || 'Role'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(pastor.areas_of_ministry || ['Ministry Area']).slice(0, 3).map((area: string, i: number) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {area}
                          </span>
                        ))}
                        {(pastor.areas_of_ministry || []).length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            +{(pastor.areas_of_ministry || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">No team members added yet</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    updateProps('other_pastors', [{
                      name: 'First Team Member',
                      role: 'Role',
                      bio: 'Add biography here...',
                      media_url: '',
                      media_type: 'video',
                      areas_of_ministry: ['Ministry Area']
                    }]);
                  }}
                >
                  Add First Team Member
                </Button>
              </div>
            )}
          </div>
        </div>
      )
      
    case 'team_highlights':
      return (
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={props.title || ''}
                onChange={(e) => updateProps('title', e.target.value)}
                placeholder="Team Highlights"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={props.subtitle || ''}
                onChange={(e) => updateProps('subtitle', e.target.value)}
                placeholder="Celebrating Excellence"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={props.description || ''}
              onChange={(e) => updateProps('description', e.target.value)}
              rows={3}
              placeholder="Recognizing the outstanding achievements..."
            />
          </div>

          {/* Display Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={props.layout || 'grid'}
                onValueChange={(value) => updateProps('layout', value)}
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="background_color">Background</Label>
              <Select
                value={props.background_color || 'white'}
                onValueChange={(value) => updateProps('background_color', value)}
              >
                <SelectTrigger id="background_color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="show_icons">Show Icons</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="show_icons"
                  checked={Boolean(props.show_icons)}
                  onCheckedChange={(checked) => updateProps('show_icons', checked)}
                />
                <span className="text-sm">Display achievement icons</span>
              </div>
            </div>
          </div>

          {/* Team Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Team Highlights ({(props.highlights || []).length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentHighlights = props.highlights || []
                  const newHighlight = {
                    name: 'New Team Member',
                    role: 'Role Title',
                    achievement: 'Achievement Title',
                    description: 'Description of the achievement or recognition...',
                    image_url: '',
                    video_url: '',
                    media_type: 'image',
                    highlight_type: 'achievement'
                  }
                  updateProps('highlights', [...currentHighlights, newHighlight])
                }}
              >
                Add Highlight
              </Button>
            </div>

            {(props.highlights || []).map((highlight: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Highlight {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const currentHighlights = [...(props.highlights || [])]
                      currentHighlights.splice(index, 1)
                      updateProps('highlights', currentHighlights)
                    }}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={highlight.name || ''}
                      onChange={(e) => {
                        const newHighlights = [...(props.highlights || [])]
                        newHighlights[index] = { ...highlight, name: e.target.value }
                        updateProps('highlights', newHighlights)
                      }}
                      placeholder="Team member name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={highlight.role || ''}
                      onChange={(e) => {
                        const newHighlights = [...(props.highlights || [])]
                        newHighlights[index] = { ...highlight, role: e.target.value }
                        updateProps('highlights', newHighlights)
                      }}
                      placeholder="Job title or role"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Achievement</Label>
                  <Input
                    value={highlight.achievement || ''}
                    onChange={(e) => {
                      const newHighlights = [...(props.highlights || [])]
                      newHighlights[index] = { ...highlight, achievement: e.target.value }
                      updateProps('highlights', newHighlights)
                    }}
                    placeholder="Award, milestone, or recognition"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={highlight.description || ''}
                    onChange={(e) => {
                      const newHighlights = [...(props.highlights || [])]
                      newHighlights[index] = { ...highlight, description: e.target.value }
                      updateProps('highlights', newHighlights)
                    }}
                    rows={3}
                    placeholder="Describe the achievement and its impact..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Media Type</Label>
                    <Select
                      value={highlight.media_type || 'image'}
                      onValueChange={(value) => {
                        const newHighlights = [...(props.highlights || [])]
                        newHighlights[index] = { ...highlight, media_type: value }
                        updateProps('highlights', newHighlights)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Media Upload</Label>
                    <MediaPicker
                      selectedUrl={highlight.media_type === 'video' ? highlight.video_url : highlight.image_url}
                      onSelect={(url) => {
                        const newHighlights = [...(props.highlights || [])]
                        if (highlight.media_type === 'video') {
                          newHighlights[index] = { ...highlight, video_url: url, image_url: '' }
                        } else {
                          newHighlights[index] = { ...highlight, image_url: url, video_url: '' }
                        }
                        updateProps('highlights', newHighlights)
                      }}
                      type={highlight.media_type === 'video' ? 'video' : 'image'}
                      buttonText={`Select ${highlight.media_type === 'video' ? 'Video' : 'Image'}`}
                    />
                  </div>
                </div>
              </div>
            ))}

            {(!props.highlights || props.highlights.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>No highlights added yet. Click "Add Highlight" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )
      
    case 'media_sections':
      return (
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-title">Title</Label>
              <Input
                id="gallery-title"
                value={props.title || ''}
                onChange={(e) => updateProps('title', e.target.value)}
                placeholder="Photo Gallery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-subtitle">Subtitle</Label>
              <Input
                id="gallery-subtitle"
                value={props.subtitle || ''}
                onChange={(e) => updateProps('subtitle', e.target.value)}
                placeholder="Capturing moments from our services and programs"
              />
            </div>
          </div>

          {/* Gallery Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gallery-type">Gallery Type</Label>
              <Select
                value={props.type || 'photos'}
                onValueChange={(value) => updateProps('type', value)}
              >
                <SelectTrigger id="gallery-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photos">Photo Gallery</SelectItem>
                  <SelectItem value="videos">Video Gallery</SelectItem>
                  <SelectItem value="mixed">Mixed Gallery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collections-count">Collections to Show</Label>
              <Input
                type="number"
                id="collections-count"
                value={props.collections_to_show || 4}
                onChange={(e) => updateProps('collections_to_show', parseInt(e.target.value) || 4)}
                min="2"
                max="8"
                placeholder="4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="layout">Layout Style</Label>
              <Select
                value={props.layout || 'grid'}
                onValueChange={(value) => updateProps('layout', value)}
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="masonry">Masonry Layout</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-category-badges"
                checked={props.show_category_badges !== false}
                onCheckedChange={(checked) => updateProps('show_category_badges', checked)}
              />
              <Label htmlFor="show-category-badges">Show service/program badges</Label>
            </div>
          </div>

          {/* Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📸 How This Gallery Works</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Upload images/videos through the Media Library</p>
              <p>• Organize them by service/program (Sunday Service, Youth Ministry, etc.)</p>
              <p>• Add collection names like "Sunday Service March 2024" or "Youth Retreat 2024"</p>
              <p>• This gallery automatically shows the latest {props.collections_to_show || 4} collections</p>
              <p>• {props.type === 'videos' ? 'Only video collections' : props.type === 'photos' ? 'Only photo collections' : 'Both photo and video collections'} will be displayed</p>
            </div>
          </div>
        </div>
      )
      
    default:
      return (
        <div className="p-4 bg-muted/30 rounded-md">
          <p className="text-sm text-muted-foreground">
            Editor for "{type}" section type not yet implemented.
          </p>
        </div>
      )
  }
} 