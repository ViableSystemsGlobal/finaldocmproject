'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, 
  Plus, 
  Search, 
  TrendingUp, 
  FileText, 
  Filter, 
  Calendar, 
  X, 
  Download, 
  RefreshCcw,
  Clock,
  Building,
  DollarSign,
  TrendingDown,
  Sparkles,
  Activity,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import { fetchExpenses, getTotalExpensesYTD, deleteExpense, Expense } from '@/services/expenses'

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

type ExpenseMetrics = {
  totalExpensesYTD: number;
  monthlyAverage: number;
  expenseCount: number;
  loading: boolean;
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [metrics, setMetrics] = useState<ExpenseMetrics>({
    totalExpensesYTD: 0,
    monthlyAverage: 0,
    expenseCount: 0,
    loading: true
  })
  const [filters, setFilters] = useState({
    category: 'all',
    vendor: 'all',
    date: undefined as DateRange | undefined
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Bulk actions state
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  const loadExpensesData = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchExpenses()
      
      if (error) throw error
      
      const expensesData = data ? (data as unknown as Expense[]) : []
      setExpenses(expensesData)
      setFilteredExpenses(expensesData)
      
      // Calculate metrics
      const totalExpensesYTD = await getTotalExpensesYTD()
      
      // Calculate monthly average - if there are expenses
      let monthlyAverage = 0
      const expenseCount = expensesData.length
      
      if (expenseCount > 0) {
        const currentYear = new Date().getFullYear()
        
        // Group expenses by month
        const monthlyTotals: Record<number, number> = {}
        expensesData.forEach(e => {
          const expenseDate = new Date(e.spent_at)
          const expenseYear = expenseDate.getFullYear()
          
          // Only consider current year expenses for monthly average
          if (expenseYear === currentYear) {
            const month = expenseDate.getMonth() + 1
            monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount
          }
        })
        
        // Calculate average using only the months that have data
        const monthsWithData = Object.keys(monthlyTotals).length
        const totalAmount = Object.values(monthlyTotals).reduce((sum, amount) => sum + amount, 0)
        monthlyAverage = monthsWithData > 0 ? totalAmount / monthsWithData : 0
      }
      
      setMetrics({
        totalExpensesYTD,
        monthlyAverage,
        expenseCount,
        loading: false
      })
    } catch (err) {
      console.error('Failed to load expenses:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load expenses. Please try again.'
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Bulk actions functions
  const toggleSelectExpense = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedExpenses(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const toggleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.length) {
      setSelectedExpenses(new Set())
      setShowBulkActions(false)
    } else {
      const allIds = new Set(filteredExpenses.map(e => e.id))
      setSelectedExpenses(allIds)
      setShowBulkActions(true)
    }
  }

  const clearSelection = () => {
    setSelectedExpenses(new Set())
    setShowBulkActions(false)
  }

  useEffect(() => {
    loadExpensesData()
  }, [])

  // Apply filters when search term or filters change
  useEffect(() => {
    if (!expenses.length) return
    
    let filtered = [...expenses]
    
    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(expense => {
        const vendor = (expense.vendor || 'Unknown').toLowerCase()
        const category = expense.category.toLowerCase()
        const notes = expense.notes?.toLowerCase() || ''
        
        return vendor.includes(query) ||
               category.includes(query) ||
               notes.includes(query)
      })
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === filters.category)
    }
    
    // Apply vendor filter
    if (filters.vendor !== 'all') {
      filtered = filtered.filter(expense => (expense.vendor || 'Unknown') === filters.vendor)
    }
    
    // Apply date range filter
    if (filters.date?.from || filters.date?.to) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.spent_at)
        const fromDate = filters.date?.from
        const toDate = filters.date?.to
        
        if (fromDate && toDate) {
          return expenseDate >= fromDate && expenseDate <= toDate
        } else if (fromDate) {
          return expenseDate >= fromDate
        } else if (toDate) {
          return expenseDate <= toDate
        }
        
        return true
      })
    }
    
    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, filters])

  const refreshData = () => {
    setIsRefreshing(true)
    loadExpensesData()
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return formatCurrencyValue(amount)
  }

  // Get unique categories and vendors for filter dropdowns
  const categories = Array.from(new Set(expenses.map(expense => expense.category))).sort()
  const vendors = Array.from(new Set(expenses.map(expense => expense.vendor || 'Unknown'))).sort()

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category: 'all',
      vendor: 'all',
      date: undefined
    })
    setSearchTerm('')
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.category !== 'all' || 
           filters.vendor !== 'all' || 
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
      console.log('Attempting to delete expense with ID:', deleteId)
      const { error } = await deleteExpense(deleteId)
      
      if (error) {
        console.error('Delete expense returned error:', error)
        throw error
      }
      
      console.log('Expense deleted successfully')
      
      // Update local state
      setExpenses(prev => prev.filter(expense => expense.id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Expense deleted successfully'
      })
    } catch (err) {
      console.error('Failed to delete expense:', err)
      
      // Provide more detailed error information
      let errorMessage = 'Failed to delete expense'
      
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

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Get expenses to export (either filtered or all)
      const dataToExport = hasActiveFilters() ? filteredExpenses : expenses
      
      // Create CSV content
      const headers = ['Date', 'Vendor', 'Category', 'Amount', 'Notes']
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(e => [
          formatDate(e.spent_at),
          `"${e.vendor || 'Unknown'}"`,
          `"${e.category}"`,
          e.amount,
          `"${e.notes || ''}"`
        ].join(','))
      ].join('\n')
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Export Successful',
        description: `Exported ${dataToExport.length} expenses to CSV`
      })
    } catch (err) {
      console.error('Failed to export:', err)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export expenses to CSV'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-orange-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Expenses</h2>
          <p className="text-slate-600">Fetching expense data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-2xl">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Expenses
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and manage church expenses and purchases
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/finance/expenses/new">
                <Plus className="mr-2 h-5 w-5" /> New Expense
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-red-100 text-sm font-medium">Total Expenses YTD</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      formatCurrency(metrics.totalExpensesYTD)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-200" />
                <span className="text-red-100 text-sm font-medium">Year to date total</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-medium">Monthly Average</p>
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
                <CalendarDays className="h-4 w-4 text-orange-200" />
                <span className="text-orange-100 text-sm font-medium">Average per month</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Receipt className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.expenseCount.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">All time expenses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Controls */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search & Filter Expenses</h2>
                <p className="text-slate-300">Find expenses by vendor, category, or amount</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by vendor, category, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500"
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
                  Vendor
                </label>
                <Select value={filters.vendor} onValueChange={(value) => setFilters({...filters, vendor: value})}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
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
                Showing {filteredExpenses.length} of {expenses.length} expenses
                {filteredExpenses.length !== expenses.length && ` (filtered)`}
              </span>
              {hasActiveFilters() && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
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
                  {selectedExpenses.size} expense{selectedExpenses.size !== 1 ? 's' : ''} selected
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

        {/* Enhanced Expenses Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 font-bold text-slate-700 w-12">
                  <Checkbox
                    checked={selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all expenses"
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Date</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Vendor</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Category</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Amount</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No expenses found</h3>
                        <p className="text-slate-600">
                          {searchTerm || hasActiveFilters() 
                            ? 'No expenses match your search criteria.'
                            : 'No expenses found. Create your first expense record.'
                          }
                        </p>
                      </div>
                      {(!searchTerm && !hasActiveFilters()) && (
                        <Button 
                          onClick={() => router.push('/finance/expenses/new')}
                          className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Record Your First Expense
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedExpenses.has(expense.id)}
                        onCheckedChange={() => toggleSelectExpense(expense.id)}
                        aria-label={`Select expense ${expense.id}`}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-red-100 to-orange-100 w-10 h-10 rounded-full flex items-center justify-center">
                          <Clock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{formatDate(expense.spent_at)}</div>
                          <div className="text-sm text-slate-500">
                            ID: {expense.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-10 h-10 rounded-full flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{expense.vendor || 'Unknown'}</div>
                          <div className="text-sm text-slate-500">Vendor</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-bold text-lg text-red-600">
                        {formatCurrency(expense.amount)}
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
                          <Link href={`/finance/expenses/${expense.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/finance/expenses/${expense.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(expense.id)}
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
      </div>
      
      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this expense? This action cannot be undone and will permanently remove the expense record.
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
                'Delete Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 