'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Plus, Search, TrendingUp, FileText, Filter, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { MetricCard } from '@/components/MetricCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { fetchExpenses, getTotalExpensesYTD, Expense } from '@/services/expenses'

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [metrics, setMetrics] = useState({
    totalExpensesYTD: 0,
    monthlyAverage: 0,
    expenseCount: 0,
    loading: true
  })
  const [filters, setFilters] = useState({
    category: '',
    vendor: '',
    dateRange: {
      startDate: null as Date | null,
      endDate: null as Date | null
    }
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const loadExpensesData = async () => {
      try {
        setLoading(true)
        const { data, error } = await fetchExpenses()
        
        if (error) throw error
        
        const expensesData = data ? (data as unknown as Expense[]) : []
        setExpenses(expensesData)
        
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
          description: 'Failed to load expenses'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadExpensesData()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Get unique categories and vendors for filters
  const categories = Array.from(new Set(expenses.map(expense => expense.category))).sort()
  const vendors = Array.from(new Set(expenses.map(expense => expense.vendor || 'Unknown'))).sort()

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.category !== '' || 
           filters.vendor !== '' || 
           filters.dateRange.startDate !== null ||
           searchTerm !== ''
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category: '',
      vendor: '',
      dateRange: {
        startDate: null,
        endDate: null
      }
    })
    setSearchTerm('')
  }

  // Filter expenses based on all filter criteria
  const filteredExpenses = expenses.filter(expense => {
    const vendor = (expense.vendor || 'Unknown').toLowerCase()
    const category = expense.category.toLowerCase()
    const search = searchTerm.toLowerCase()
    const expenseDate = new Date(expense.spent_at)
    
    // Search term filter
    const matchesSearch = search === '' || 
                          vendor.includes(search) || 
                          category.includes(search)
    
    // Category filter
    const matchesCategory = filters.category === '' || 
                            expense.category === filters.category
    
    // Vendor filter
    const matchesVendor = filters.vendor === '' || 
                          (expense.vendor || 'Unknown') === filters.vendor
    
    // Date range filter
    const matchesDateRange = (filters.dateRange.startDate === null || expenseDate >= filters.dateRange.startDate) && 
                             (filters.dateRange.endDate === null || expenseDate <= filters.dateRange.endDate)
    
    return matchesSearch && matchesCategory && matchesVendor && matchesDateRange
  })

  // Handle date range selection
  const handleDateRangeChange = (range: { startDate: Date | null, endDate: Date | null }) => {
    setFilters({
      ...filters,
      dateRange: range
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => router.push('/finance/expenses/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Expense
        </Button>
      </div>
      
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Expenses YTD"
          value={metrics.totalExpensesYTD}
          icon={<CreditCard className="h-6 w-6" />}
          loading={metrics.loading}
        />
        <MetricCard
          title="Monthly Average"
          value={metrics.monthlyAverage}
          icon={<TrendingUp className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="currency"
        />
        <MetricCard
          title="Total Expenses"
          value={metrics.expenseCount}
          icon={<FileText className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Expenses</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-2 px-1">
                    {Object.values(filters).filter(f => f !== '').length + (searchTerm !== '' ? 1 : 0)}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters() && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear filters</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({...filters, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor</label>
                  <Select
                    value={filters.vendor}
                    onValueChange={(value) => setFilters({...filters, vendor: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Vendors</SelectItem>
                      {vendors.map(vendor => (
                        <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal flex-grow",
                            !filters.dateRange.startDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {filters.dateRange.startDate ? (
                            formatDate(filters.dateRange.startDate.toISOString())
                          ) : (
                            <span>Select date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto">
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium">Start Date</label>
                              <Input
                                type="date"
                                value={filters.dateRange.startDate ? filters.dateRange.startDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : null
                                  setFilters(prev => ({
                                    ...prev,
                                    dateRange: {
                                      ...prev.dateRange,
                                      startDate: date
                                    }
                                  }))
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium">End Date</label>
                              <Input
                                type="date"
                                value={filters.dateRange.endDate ? filters.dateRange.endDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : null
                                  setFilters(prev => ({
                                    ...prev,
                                    dateRange: {
                                      ...prev.dateRange,
                                      endDate: date
                                    }
                                  }))
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {filters.dateRange.startDate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            dateRange: { startDate: null, endDate: null }
                          }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Filter badges */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-2 pt-2">
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchTerm}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchTerm('')}
                    />
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {filters.category}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({...filters, category: ''})}
                    />
                  </Badge>
                )}
                {filters.vendor && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Vendor: {filters.vendor}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({...filters, vendor: ''})}
                    />
                  </Badge>
                )}
                {filters.dateRange.startDate && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date Range
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({
                        ...filters, 
                        dateRange: { startDate: null, endDate: null }
                      })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading expenses...</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center p-4">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium">No expenses found</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters() ? 'Try changing or clearing your filters' : 'Create your first expense to get started'}
              </p>
              {!hasActiveFilters() && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => router.push('/finance/expenses/new')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Expense
                </Button>
              )}
              {hasActiveFilters() && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={resetFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.spent_at)}</TableCell>
                        <TableCell>{expense.vendor || 'Unknown'}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/finance/expenses/${expense.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </div>
                {hasActiveFilters() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetFilters}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 