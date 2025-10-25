"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Trash2, Plus, Users, TrendingUp, Activity, Sparkles, Eye, Download, Upload, RefreshCw, CheckCircle2, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pagination, usePagination } from "@/components/ui/pagination"
import { fetchContacts, deleteContact, exportContacts, importContacts } from "@/services/contacts"
import type { Contact } from "@/lib/supabase"
import ImportExportButtons from "@/components/ImportExportButtons"
import { EnhancedDeleteContactDialog } from "@/components/EnhancedDeleteContactDialog"
import { ProtectedRoute, RequirePermission } from "@/components/auth/ProtectedRoute"
import { toast } from "@/components/ui/use-toast"

function ContactsPageContent() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [lifecycleFilter, setLifecycleFilter] = useState("all")
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Enhanced delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    contact: Contact | null;
  }>({
    isOpen: false,
    contact: null,
  })
  
  // Checkbox selection state
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Filter contacts based on search query and lifecycle filter
  const filteredContacts = contacts.filter(contact => {
    // Search query filter
    const matchesSearch = !searchQuery.trim() || (
      (contact.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (contact.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (contact.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (contact.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (contact.lifecycle?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    
    // Lifecycle filter
    const matchesLifecycle = lifecycleFilter === 'all' || contact.lifecycle === lifecycleFilter
    
    return matchesSearch && matchesLifecycle
  })

  const pagination = usePagination(filteredContacts, 10)

  // Calculate member percentage (use original contacts, not filtered)
  const memberCount = contacts.filter(c => c.lifecycle === 'member').length
  const memberPercentage = contacts.length > 0 ? Math.round((memberCount / contacts.length) * 100) : 0

  // Get unique lifecycle values for filter
  const lifecycleOptions = Array.from(new Set(contacts.map(c => c.lifecycle).filter(Boolean))).sort()

  const loadContacts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const { data, error } = await fetchContacts()
      if (error) throw error
      setContacts(data || [])
      // Clear selections when data reloads
      setSelectedContacts(new Set())
      setSelectAll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts")
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  // Auto-refresh when window gains focus (user comes back to the tab)
  useEffect(() => {
    const handleFocus = () => {
      loadContacts(true)
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape to clear search and filters
      if (e.key === 'Escape' && (searchQuery || lifecycleFilter !== 'all')) {
        setSearchQuery('')
        setLifecycleFilter('all')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery, lifecycleFilter])

  const handleRefresh = () => {
    loadContacts(true)
  }

  // Enhanced delete handler
  const handleDeleteContact = (contact: Contact) => {
    setDeleteDialog({
      isOpen: true,
      contact
    });
  }

  const handleDeleteConfirmed = () => {
    setDeleteDialog({ isOpen: false, contact: null });
    loadContacts(true); // Refresh the contacts list
  };

  const handleExport = async () => {
    try {
      await exportContacts();
      toast({
        title: "Contacts exported",
        description: "Your contacts have been exported successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err instanceof Error ? err.message : "Failed to export contacts",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importContacts(file);
      
      if (result.duplicatesFound > 0) {
        toast({
          title: "Import completed with duplicates",
          description: `${result.imported} contacts imported successfully. ${result.duplicatesFound} duplicates were skipped: ${result.duplicates.slice(0, 3).join(', ')}${result.duplicates.length > 3 ? ' and ' + (result.duplicates.length - 3) + ' more' : ''}`,
        });
      } else {
        toast({
          title: "Contacts imported",
          description: `${result.imported} contacts imported successfully`,
        });
      }
      
      // Reload the contacts list to show updated data
      await loadContacts(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: err instanceof Error ? err.message : "Failed to import contacts",
      });
      throw err; // Re-throw to show in the import dialog
    }
  };

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedContacts(new Set(pagination.currentItems.map(contact => contact.id)))
    } else {
      setSelectedContacts(new Set())
    }
  }

  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts)
    if (checked) {
      newSelected.add(contactId)
    } else {
      newSelected.delete(contactId)
      setSelectAll(false)
    }
    setSelectedContacts(newSelected)
  }

  // Enhanced bulk delete with better error handling
  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return
    
    const selectedContactsList = Array.from(selectedContacts)
    const contactNames = selectedContactsList.map(id => {
      const contact = contacts.find(c => c.id === id)
      return contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
    })

    const confirmMessage = `Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}?\n\n${contactNames.slice(0, 5).join(', ')}${contactNames.length > 5 ? '\n...and ' + (contactNames.length - 5) + ' more' : ''}\n\nNote: Contacts with dependencies (groups, follow-ups, etc.) cannot be deleted.`
    
    if (!confirm(confirmMessage)) return
    
    try {
      setIsBulkDeleting(true)
      
      let successCount = 0
      let failedContacts: string[] = []
      
      // Delete contacts one by one to handle individual failures
      for (const contactId of selectedContactsList) {
        try {
          await deleteContact(contactId)
          successCount++
        } catch (error) {
          const contact = contacts.find(c => c.id === contactId)
          const name = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
          failedContacts.push(name)
        }
      }
      
      // Update the UI
      if (successCount > 0) {
        setContacts(prevContacts => 
          prevContacts.filter(contact => !selectedContactsList.includes(contact.id) || failedContacts.some(name => name.includes(contact.first_name || '')))
        )
      }
      setSelectedContacts(new Set())
      setSelectAll(false)
      
      // Show appropriate message
      if (failedContacts.length === 0) {
        toast({
          title: "Contacts deleted",
          description: `${successCount} contact${successCount > 1 ? 's' : ''} deleted successfully`,
        })
      } else if (successCount === 0) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: `Could not delete any contacts. They may be in groups or have other dependencies.`,
        })
      } else {
        toast({
          title: "Partially completed",
          description: `${successCount} contact${successCount > 1 ? 's' : ''} deleted. ${failedContacts.length} contact${failedContacts.length > 1 ? 's' : ''} could not be deleted due to dependencies.`,
        })
      }
      
      // Refresh to get updated data
      await loadContacts(true)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "An unexpected error occurred during bulk deletion",
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const clearSelection = () => {
    setSelectedContacts(new Set())
    setSelectAll(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Contacts</h2>
          <p className="text-slate-600">Fetching contact data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Contacts Directory
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage all contacts in your system
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ImportExportButtons 
                onExport={handleExport}
                onImport={handleImport}
                entityName="Contacts"
              />
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/people/contacts/new">
                  <Plus className="mr-2 h-5 w-5" /> Add New Contact
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Contacts</p>
                  <p className="text-3xl font-bold">{contacts.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">All contacts</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Members</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{memberCount}</p>
                    <p className="text-emerald-200 text-sm font-medium">({memberPercentage}%)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Active members</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Visitors</p>
                  <p className="text-3xl font-bold">
                    {contacts.filter(c => c.lifecycle === 'visitor').length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Recent visitors</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Other Contacts</p>
                  <p className="text-3xl font-bold">
                    {contacts.filter(c => c.lifecycle !== 'member' && c.lifecycle !== 'visitor').length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">All others</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-8">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}

                {/* Search and Filter Bar */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search contacts by name, email, phone, or status... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-12 pr-10 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </div>
              <div className="w-full sm:w-48">
                <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {lifecycleOptions.map(lifecycle => (
                      <SelectItem key={lifecycle} value={lifecycle}>
                        {lifecycle.charAt(0).toUpperCase() + lifecycle.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-10 px-4 border-2 border-slate-200 hover:border-blue-500 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {(searchQuery || lifecycleFilter !== 'all') && (
                <div className="text-sm text-slate-600">
                  Showing {filteredContacts.length} of {contacts.length} contacts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedContacts.size > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-blue-800 font-medium">
                {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Contacts Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 w-12">
                  <Checkbox
                    checked={selectAll && pagination.currentItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={pagination.currentItems.length === 0}
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">First Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Last Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Email</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Phone</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        {searchQuery ? <Search className="h-8 w-8 text-slate-500" /> : <Users className="h-8 w-8 text-slate-500" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                          {searchQuery ? 'No matching contacts found' : 'No contacts found'}
                        </h3>
                        <p className="text-slate-600">
                          {searchQuery || lifecycleFilter !== 'all'
                            ? `No contacts match your current filters. Try adjusting your search or filters.`
                            : 'Create your first contact to get started.'
                          }
                        </p>
                        {(searchQuery || lifecycleFilter !== 'all') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery('')
                              setLifecycleFilter('all')
                            }}
                            className="mt-4"
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-slate-800">{contact.first_name}</TableCell>
                    <TableCell className="py-4 font-semibold text-slate-800">{contact.last_name}</TableCell>
                    <TableCell className="py-4 text-slate-600">{contact.email}</TableCell>
                    <TableCell className="py-4 text-slate-600">{contact.phone}</TableCell>
                    <TableCell className="py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        contact.lifecycle === 'member' 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                          : contact.lifecycle === 'visitor' 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {contact.lifecycle}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/contacts/${contact.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/contacts/${contact.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteContact(contact)}
                          className="hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {contacts.length > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
              onItemsPerPageChange={pagination.handleItemsPerPageChange}
            />
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <EnhancedDeleteContactDialog
        contact={deleteDialog.contact}
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, contact: null })}
        onDeleted={handleDeleteConfirmed}
      />
    </div>
  )
}

export default function ContactsPage() {
  return (
    <ProtectedRoute requiredPermissions={['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned']}>
      <ContactsPageContent />
    </ProtectedRoute>
  )
} 