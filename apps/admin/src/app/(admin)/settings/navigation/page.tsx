'use client'

import React, { useState, useEffect } from 'react'
import { 
  Navigation as NavigationIcon, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  ExternalLink,
  Home,
  FileText,
  Calendar,
  Users,
  Heart,
  Info,
  Phone,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  fetchNavLinks, 
  createNavLink,
  updateNavLink,
  deleteNavLink,
  type Navigation 
} from '@/services/settings'

const navSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  href: z.string().min(1, 'URL is required'),
  order: z.number().min(0),
  is_active: z.boolean(),
  parent_id: z.string().optional(),
})

type NavFormData = z.infer<typeof navSchema>

const iconOptions = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'about', label: 'About', icon: Info },
  { value: 'events', label: 'Events', icon: Calendar },
  { value: 'ministries', label: 'Ministries', icon: Users },
  { value: 'giving', label: 'Giving', icon: Heart },
  { value: 'contact', label: 'Contact', icon: Phone },
  { value: 'sermons', label: 'Sermons', icon: FileText },
  { value: 'external', label: 'External Link', icon: ExternalLink },
  { value: 'page', label: 'Page', icon: FileText },
]

export default function NavigationPage() {
  const [navItems, setNavItems] = useState<Navigation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    navItem: Navigation | null
  }>({ open: false, navItem: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    navItem: Navigation | null
  }>({ open: false, navItem: null })
  const [previewDialog, setPreviewDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Simple form state without React Hook Form for parent selection
  const [formData, setFormData] = useState({
    label: '',
    href: '',
    order: 0,
    is_active: true,
    parent_id: 'none'
  })

  const form = useForm<NavFormData>({
    resolver: zodResolver(navSchema),
    defaultValues: {
      label: '',
      href: '',
      order: 0,
      is_active: true,
      parent_id: "none",
    },
  })

  useEffect(() => {
    loadNavItems()
  }, [])

  async function loadNavItems() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchNavLinks()
      
      if (success && data) {
        setNavItems(data)
      } else {
        console.error('Error loading navigation items:', error)
        toast({
          title: 'Error',
          description: 'Failed to load navigation items. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function openEditDialog(navItem?: Navigation) {
    if (navItem) {
      const parentValue = navItem.parent_id || 'none'
      setFormData({
        label: navItem.label,
        href: navItem.href,
        order: navItem.order,
        is_active: navItem.is_active,
        parent_id: parentValue
      })
      form.reset({
        label: navItem.label,
        href: navItem.href,
        order: navItem.order,
        is_active: navItem.is_active,
        parent_id: parentValue,
      })
    } else {
      setFormData({
        label: '',
        href: '',
        order: navItems.length,
        is_active: true,
        parent_id: 'none'
      })
      form.reset({
        label: '',
        href: '',
        order: navItems.length,
        is_active: true,
        parent_id: "none",
      })
    }
    setEditDialog({ open: true, navItem: navItem || null })
  }

  async function onSubmit(data: NavFormData) {
    try {
      setIsSubmitting(true)
      
      // Use formData for parent_id to avoid form conflicts
      const submitData = {
        ...data,
        parent_id: formData.parent_id === "none" ? undefined : formData.parent_id
      }
      
      let result
      if (editDialog.navItem) {
        result = await updateNavLink(editDialog.navItem.id, submitData)
      } else {
        result = await createNavLink(submitData)
      }
      
      if (result.success) {
        toast({
          title: editDialog.navItem ? 'Navigation updated' : 'Navigation created',
          description: `Navigation item "${data.label}" has been ${editDialog.navItem ? 'updated' : 'created'} successfully.`,
        })
        setEditDialog({ open: false, navItem: null })
        setFormData({
          label: '',
          href: '',
          order: 0,
          is_active: true,
          parent_id: 'none'
        })
        loadNavItems()
      } else {
        console.error('Error saving navigation item:', result.error)
        toast({
          title: 'Error',
          description: 'Failed to save navigation item. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteNavItem() {
    if (!deleteDialog.navItem) return

    try {
      setIsDeleting(true)
      const { success, error } = await deleteNavLink(deleteDialog.navItem.id)
      
      if (success) {
        setNavItems(prev => prev.filter(item => item.id !== deleteDialog.navItem?.id))
        toast({
          title: 'Navigation deleted',
          description: 'The navigation item has been deleted successfully.',
        })
        setDeleteDialog({ open: false, navItem: null })
      } else {
        console.error('Error deleting navigation item:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete navigation item. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function toggleNavItemStatus(navItem: Navigation) {
    try {
      const { success, error } = await updateNavLink(navItem.id, {
        is_active: !navItem.is_active
      })
      
      if (success) {
        setNavItems(prev => prev.map(item => 
          item.id === navItem.id ? { ...item, is_active: !item.is_active } : item
        ))
        toast({
          title: `Navigation ${!navItem.is_active ? 'activated' : 'deactivated'}`,
          description: `"${navItem.label}" has been ${!navItem.is_active ? 'activated' : 'deactivated'}.`,
        })
      } else {
        console.error('Error updating navigation status:', error)
        toast({
          title: 'Error',
          description: 'Failed to update navigation status. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }

  function buildMenuTree(items: Navigation[]): Navigation[] {
    const itemMap = new Map<string, Navigation & { children: Navigation[] }>()
    const rootItems: (Navigation & { children: Navigation[] })[] = []

    // Initialize all items with children array
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    // Build tree structure
    items.forEach(item => {
      const itemWithChildren = itemMap.get(item.id)!
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id)!.children.push(itemWithChildren)
      } else {
        rootItems.push(itemWithChildren)
      }
    })

    // Sort by order
    rootItems.sort((a, b) => a.order - b.order)
    rootItems.forEach(item => {
      item.children.sort((a, b) => a.order - b.order)
    })

    return rootItems
  }

  function getIconForPath(path: string) {
    const lowerPath = path.toLowerCase()
    if (lowerPath === '/' || lowerPath === '/home') return Home
    if (lowerPath.includes('about')) return Info
    if (lowerPath.includes('event')) return Calendar
    if (lowerPath.includes('ministries') || lowerPath.includes('groups')) return Users
    if (lowerPath.includes('giving') || lowerPath.includes('tithe')) return Heart
    if (lowerPath.includes('contact')) return Phone
    if (lowerPath.includes('sermon')) return FileText
    if (lowerPath.startsWith('http')) return ExternalLink
    return FileText
  }

  // Simple calculations without memoization to avoid reference issues
  const menuTree = buildMenuTree(navItems)
  const activeItems = navItems.filter(item => item.is_active)
  const parentItems = navItems.filter(item => !item.parent_id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading navigation...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-cyan-700/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <NavigationIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Website Navigation
                </h1>
                <p className="text-xl text-emerald-100 mt-2">
                  Manage your website's menu structure
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setPreviewDialog(true)}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Menu
              </Button>
              
              <Dialog open={editDialog.open} onOpenChange={(open) => {
                setEditDialog({ open, navItem: null })
                if (!open) {
                  setFormData({
                    label: '',
                    href: '',
                    order: 0,
                    is_active: true,
                    parent_id: 'none'
                  })
                }
              }}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openEditDialog()}
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-sm max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editDialog.navItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                    </DialogTitle>
                    <DialogDescription>
                      {editDialog.navItem 
                        ? 'Update the menu item details below.'
                        : 'Create a new menu item for your website navigation.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="label"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Menu Label *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., About Us, Ministries, Contact" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="href"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., /about, /ministries, /contact" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Use / for internal pages or full URLs for external links
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Parent Menu (optional)</label>
                          <select 
                            value={formData.parent_id} 
                            onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                          >
                            <option value="none">No parent (top level)</option>
                            {parentItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-500">
                            Select a parent to create a dropdown menu
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Order</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Lower numbers appear first
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active Menu Item
                              </FormLabel>
                              <FormDescription>
                                Show this item in the website navigation
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
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => {
                            setEditDialog({ open: false, navItem: null })
                            setFormData({
                              label: '',
                              href: '',
                              order: 0,
                              is_active: true,
                              parent_id: 'none'
                            })
                          }}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {editDialog.navItem ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            <>
                              {editDialog.navItem ? 'Update' : 'Create'} Menu Item
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-emerald-100 mt-4">
            <span>• Menu Management</span>
            <span>• Dropdown Submenus</span>
            <span>• Custom Ordering</span>
            <span>• Link Management</span>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{navItems.length}</div>
              <div className="text-emerald-200 text-sm">Total Items</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{activeItems.length}</div>
              <div className="text-emerald-200 text-sm">Active Items</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-white text-2xl font-bold">{parentItems.length}</div>
              <div className="text-emerald-200 text-sm">Top Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {navItems.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-emerald-100 rounded-full mb-4">
                <NavigationIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No Menu Items Yet</h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                Start building your website navigation. Add menu items for About, Ministries, Events, and more.
              </p>
              <Button 
                onClick={() => openEditDialog()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Menu Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <NavigationIcon className="w-5 h-5 text-emerald-600" />
                    <span>Website Menu</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your website navigation structure
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  {activeItems.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Menu Item</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuTree.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Parent Item */}
                      <TableRow className="border-slate-200/50">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <GripVertical className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              {(() => {
                                const Icon = getIconForPath(item.href)
                                return <Icon className="w-4 h-4 text-emerald-600" />
                              })()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {item.label}
                              </div>
                              {item.children && item.children.length > 0 && (
                                <div className="text-xs text-slate-500">
                                  {item.children.length} submenu items
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {item.href.startsWith('http') && (
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            )}
                            <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                              {item.href}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(item.children && item.children.length > 0) ? 'Parent' : 'Link'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.order}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleNavItemStatus(item)}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(item)}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, navItem: item })}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Child Items */}
                      {item.children && item.children.map((child) => (
                        <TableRow key={child.id} className="border-slate-200/50 bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center justify-center ml-6">
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3 ml-6">
                              <div className="p-1 bg-slate-200 rounded">
                                {(() => {
                                  const Icon = getIconForPath(child.href)
                                  return <Icon className="w-3 h-3 text-slate-600" />
                                })()}
                              </div>
                              <div className="font-medium text-slate-700 text-sm">
                                {child.label}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {child.href.startsWith('http') && (
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              )}
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {child.href}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              Submenu
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {child.order}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {child.is_active ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleNavItemStatus(child)}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                {child.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditDialog(child)}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, navItem: child })}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Menu Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              <span>Menu Preview</span>
            </DialogTitle>
            <DialogDescription>
              Preview how your navigation menu will appear on the website
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Desktop Menu Preview */}
            <div>
              <h3 className="font-medium mb-4">Desktop Navigation</h3>
              <div className="bg-slate-900 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg">Your Church</div>
                  <nav className="flex items-center space-x-6">
                    {menuTree.filter(item => item.is_active).map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="flex items-center space-x-1 hover:text-emerald-300 cursor-pointer">
                          <span>{item.label}</span>
                          {item.children && item.children.length > 0 && (
                            <ChevronRight className="w-3 h-3 rotate-90" />
                          )}
                        </div>
                        {item.children && item.children.length > 0 && (
                          <div className="absolute top-full left-0 mt-1 bg-white text-slate-900 rounded-lg shadow-lg p-2 min-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.children.filter(child => child.is_active).map((child) => (
                              <div key={child.id} className="px-3 py-2 hover:bg-slate-100 rounded text-sm">
                                {child.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Mobile Menu Preview */}
            <div>
              <h3 className="font-medium mb-4">Mobile Navigation</h3>
              <div className="bg-slate-100 p-4 rounded-lg max-w-sm">
                <div className="space-y-2">
                  {menuTree.filter(item => item.is_active).map((item) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between p-3 bg-white rounded hover:bg-slate-50">
                        <span className="font-medium">{item.label}</span>
                        {item.children && item.children.length > 0 && (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      {item.children && item.children.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {item.children.filter(child => child.is_active).map((child) => (
                            <div key={child.id} className="p-2 text-sm text-slate-600">
                              {child.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, navItem: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.navItem?.label}"? This will also remove any submenu items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, navItem: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNavItem}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Menu Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 