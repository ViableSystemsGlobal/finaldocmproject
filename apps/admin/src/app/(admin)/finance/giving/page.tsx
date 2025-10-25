'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  DollarSign, 
  Plus, 
  Search, 
  Receipt, 
  TrendingUp, 
  Filter, 
  Calendar, 
  X, 
  Download, 
  RefreshCcw,
  CreditCard,
  Sparkles,
  Activity,
  TrendingDown,
  Clock,
  User,
  Banknote,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Users,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { format, isAfter, isBefore, isEqual, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, usePagination } from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { 
  fetchTransactions, 
  getTotalTransactionsYTD, 
  getMonthlyAverageTransactions,
  deleteTransaction,
  Transaction 
} from '@/services/transactions'
import {
  fetchDonationCampaigns,
  fetchRecurringDonations,
  getEnhancedGivingMetrics,
  DonationCampaign,
  RecurringDonation,
  GivingMetrics as EnhancedGivingMetrics
} from '@/services/giving'
import CampaignManagement from '@/components/giving/CampaignManagement'

// Interface for our custom date range
interface DateRange {
  from?: Date;
  to?: Date;
}

// Function to format currency
const formatCurrencyValue = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

type GivingMetrics = {
  totalGivingYTD: number;
  monthlyAverage: number;
  transactionCount: number;
  loading: boolean;
}

export default function GivingPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [metrics, setMetrics] = useState<GivingMetrics>({
    totalGivingYTD: 0,
    monthlyAverage: 0,
    transactionCount: 0,
    loading: true
  })
  const [filters, setFilters] = useState({
    category: 'all',
    paymentMethod: 'all',
    date: undefined as DateRange | undefined
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Enhanced state for new features
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [recurringDonations, setRecurringDonations] = useState<RecurringDonation[]>([])
  const [enhancedMetrics, setEnhancedMetrics] = useState<EnhancedGivingMetrics>({
    totalGivingYTD: 0,
    monthlyAverage: 0,
    transactionCount: 0,
    stripeTransactionCount: 0,
    recurringDonationCount: 0,
    averageDonationAmount: 0,
    totalFees: 0,
    netAmount: 0,
    topDonationMethod: 'None',
    activeCampaigns: 0,
    loading: true
  })
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Bulk actions state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  const loadGivingData = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchTransactions()
      
      if (error) throw error
      
      const transactionsData = data ? (data as unknown as Transaction[]) : []
      setTransactions(transactionsData)
      setFilteredTransactions(transactionsData)
      
      // Calculate metrics
      const [totalGivingYTD, monthlyAverage] = await Promise.all([
        getTotalTransactionsYTD(),
        getMonthlyAverageTransactions()
      ])
      
      setMetrics({
        totalGivingYTD,
        monthlyAverage,
        transactionCount: transactionsData.length,
        loading: false
      })
    } catch (err) {
      console.error('Failed to load transactions:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load transactions. Please try again.'
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadGivingData()
  }, [])

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  // Bulk actions functions
  const toggleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const toggleSelectAll = () => {
    if (selectedTransactions.size === currentTransactions.length) {
      setSelectedTransactions(new Set())
      setShowBulkActions(false)
    } else {
      const allIds = new Set(currentTransactions.map(t => t.id))
      setSelectedTransactions(allIds)
      setShowBulkActions(true)
    }
  }

  const clearSelection = () => {
    setSelectedTransactions(new Set())
    setShowBulkActions(false)
  }

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (filteredTransactions.length === 0) return
      
      // Only handle keyboard events when not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        event.preventDefault()
        goToPrevious()
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        event.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, filteredTransactions.length])

  // Apply filters when search term or filters change
  useEffect(() => {
    if (!transactions.length) return
    
    let filtered = [...transactions]
    
    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(transaction => {
        const donorName = getDonorName(transaction).toLowerCase()
        const category = transaction.category?.toLowerCase() || ''
        const paymentMethod = transaction.payment_method?.toLowerCase() || ''
        const notes = transaction.notes?.toLowerCase() || ''
        
        return donorName.includes(query) ||
               category.includes(query) ||
               paymentMethod.includes(query) ||
               notes.includes(query)
      })
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === filters.category)
    }
    
    // Apply payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(transaction => transaction.payment_method === filters.paymentMethod)
    }
    
    // Apply date range filter
    if (filters.date?.from || filters.date?.to) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.transacted_at)
        const fromDate = filters.date?.from
        const toDate = filters.date?.to
        
        if (fromDate && toDate) {
          return transactionDate >= fromDate && transactionDate <= toDate
        } else if (fromDate) {
          return transactionDate >= fromDate
        } else if (toDate) {
          return transactionDate <= toDate
        }
        
        return true
      })
    }
    
    setFilteredTransactions(filtered)
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [transactions, searchTerm, filters])

  const refreshData = () => {
    setIsRefreshing(true)
    loadGivingData()
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return format(date, 'PPp')
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return formatCurrencyValue(amount)
  }
  
  // Get donor name
  const getDonorName = (transaction: Transaction) => {
    if (transaction.contacts) {
      const firstName = transaction.contacts.first_name || ''
      const lastName = transaction.contacts.last_name || ''
      return `${firstName} ${lastName}`.trim() || 'Anonymous'
    }
    return 'Anonymous'
  }

  // Get unique categories and payment methods for filter dropdowns
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort()
  const paymentMethods = Array.from(new Set(transactions.map(t => t.payment_method))).sort()

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category: 'all',
      paymentMethod: 'all',
      date: undefined
    })
    setSearchTerm('')
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.category !== 'all' || 
           filters.paymentMethod !== 'all' || 
           filters.date?.from !== undefined ||
           searchTerm !== ''
  }



  // Delete handlers
  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    
    try {
      console.log('Attempting to delete transaction with ID:', deleteId)
      const { error } = await deleteTransaction(deleteId)
      
      if (error) {
        console.error('Delete transaction returned error:', error)
        throw error
      }
      
      console.log('Transaction deleted successfully')
      
      // Update local state
      setTransactions(prev => prev.filter(transaction => transaction.id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully'
      })
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      
      // Provide more detailed error information
      let errorMessage = 'Failed to delete transaction'
      
      if (err && typeof err === 'object') {
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message
        } else if ('error' in err && typeof err.error === 'string') {
          errorMessage = err.error
        } else if ('details' in err && typeof err.details === 'string') {
          errorMessage = err.details
        } else {
          errorMessage = `Unknown error: ${JSON.stringify(err)}`
        }
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      console.error('Detailed error message:', errorMessage)
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Giving Data</h2>
          <p className="text-slate-600">Fetching transactions and metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Giving
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and manage donations and contributions
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                variant="outline"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 shadow-lg px-6 py-3 rounded-xl"
              >
                <Link href="/finance/giving/campaigns">
                  <Target className="mr-2 h-5 w-5" /> Campaigns
                </Link>
              </Button>
              <Button 
                asChild
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/finance/giving/new">
                  <Plus className="mr-2 h-5 w-5" /> New Transaction
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium">Total Giving YTD</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      formatCurrency(metrics.totalGivingYTD)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">Year to date total</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Monthly Average</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      formatCurrency(metrics.monthlyAverage)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Average per month</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Receipt className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-teal-100 text-sm font-medium">Total Transactions</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.transactionCount.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-200" />
                <span className="text-teal-100 text-sm font-medium">All time transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-lg rounded-xl p-2 shadow-lg border border-white/20">
              <TabsTrigger 
                value="overview" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white font-medium"
              >
                Transactions Overview
              </TabsTrigger>
              <TabsTrigger 
                value="campaigns" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white font-medium"
              >
                Donation Campaigns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              {/* Enhanced Search and Filter Controls */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search & Filter Transactions</h2>
                <p className="text-slate-300">Find transactions by donor, category, or amount</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by donor name, category, payment method, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Category
                </label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Payment Method
                </label>
                <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({...filters, paymentMethod: value})}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {paymentMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <RefreshCcw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  {isRefreshing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-5 w-5" />
                  )}
                  Refresh Data
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                {filteredTransactions.length !== transactions.length && ` (filtered from ${transactions.length} total)`}
              </span>
              {hasActiveFilters() && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {Object.values(filters).filter(f => f !== 'all' && f !== undefined).length + (searchTerm ? 1 : 0)} filter(s) active
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-800">
                  {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  Clear Selection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Transactions Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 font-bold text-slate-700 w-12">
                  <Checkbox
                    checked={selectedTransactions.size === currentTransactions.length && currentTransactions.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all transactions"
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700 w-40">Donor</TableHead>
                <TableHead className="py-4 font-bold text-slate-700 w-28">Amount</TableHead>
                <TableHead className="py-4 font-bold text-slate-700 w-12">Category</TableHead>
                <TableHead className="py-4 font-bold text-slate-700 w-80">Payment Details</TableHead>
                <TableHead className="py-4 font-bold text-slate-700 w-36">Date</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700 w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <DollarSign className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No transactions found</h3>
                        <p className="text-slate-600">
                          {filteredTransactions.length === 0 
                            ? (searchTerm || hasActiveFilters() 
                                ? 'No transactions match your search criteria.'
                                : 'No transactions found. Create your first transaction.')
                            : `No transactions on page ${currentPage}. Try going to a different page.`
                          }
                        </p>
                      </div>
                      {(!searchTerm && !hasActiveFilters()) && (
                        <Button 
                          onClick={() => router.push('/finance/giving/new')}
                          className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Record Your First Transaction
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedTransactions.has(transaction.id)}
                        onCheckedChange={() => toggleSelectTransaction(transaction.id)}
                        aria-label={`Select transaction ${transaction.id}`}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-10 h-10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{getDonorName(transaction)}</div>
                          <div className="text-sm text-slate-500">
                            {(transaction as any).payment_status && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (transaction as any).payment_status === 'succeeded' 
                                  ? 'bg-green-100 text-green-800'
                                  : (transaction as any).payment_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(transaction as any).payment_status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-lg text-green-600">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-slate-500 uppercase">
                        {transaction.currency}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-700 font-medium">{transaction.payment_method}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          <div>ID: {transaction.id.substring(0, 8)}...</div>
                          {(transaction as any).stripe_payment_intent_id && (
                            <div>Stripe: {(transaction as any).stripe_payment_intent_id.substring(3, 11)}...</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{formatDate(transaction.transacted_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/finance/giving/${transaction.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/finance/giving/${transaction.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(transaction.id)}
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
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage)
            setCurrentPage(1)
          }}
          className="mt-6"
        />
            </TabsContent>

            <TabsContent value="campaigns" className="mt-8">
              <CampaignManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this transaction? This action cannot be undone and will permanently remove the transaction record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Transaction'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 