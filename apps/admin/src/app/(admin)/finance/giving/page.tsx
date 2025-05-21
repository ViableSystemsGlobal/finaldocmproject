'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Plus, Search, Receipt, TrendingUp, Filter, Calendar, X, Download, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { MetricCard } from '@/components/MetricCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { format, isAfter, isBefore, isEqual, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

import { 
  fetchTransactions, 
  getTotalTransactionsYTD, 
  getMonthlyAverageTransactions,
  Transaction 
} from '@/services/transactions'

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

export default function GivingPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [metrics, setMetrics] = useState({
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
  const [activeTab, setActiveTab] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadGivingData = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchTransactions()
      
      if (error) throw error
      
      const transactionsData = data ? (data as unknown as Transaction[]) : []
      setTransactions(transactionsData)
      
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

  const refreshData = () => {
    setIsRefreshing(true)
    loadGivingData()
  }

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

  // Function to handle date selection - this will handle start date
  const handleStartDateSelect = (date: Date | undefined) => {
    setFilters({
      ...filters, 
      date: {
        from: date,
        to: filters.date?.to
      }
    })
  }

  // Function to handle end date selection
  const handleEndDateSelect = (date: Date | undefined) => {
    setFilters({
      ...filters, 
      date: {
        from: filters.date?.from,
        to: date
      }
    })
  }

  // Filter transactions
  const getFilteredTransactions = (transactions: Transaction[], includeTabFilter = true) => {
    return transactions.filter(transaction => {
      const donorName = getDonorName(transaction).toLowerCase()
      const category = transaction.category.toLowerCase()
      const paymentMethod = transaction.payment_method.toLowerCase()
      const search = searchTerm.toLowerCase()
      const transactionDate = new Date(transaction.transacted_at)
      
      // Search term filter
      const matchesSearch = search === '' || 
                            donorName.includes(search) || 
                            category.includes(search) || 
                            paymentMethod.includes(search) ||
                            formatCurrency(transaction.amount).toLowerCase().includes(search)
      
      // Category filter
      const matchesCategory = filters.category === 'all' || 
                              transaction.category === filters.category
      
      // Payment method filter
      const matchesPaymentMethod = filters.paymentMethod === 'all' || 
                                   transaction.payment_method === filters.paymentMethod
      
      // Date range filter
      const matchesDateRange = !filters.date?.from || (
        (isAfter(transactionDate, filters.date.from) || isEqual(transactionDate, filters.date.from)) &&
        (!filters.date.to || (isBefore(transactionDate, filters.date.to) || isEqual(transactionDate, filters.date.to)))
      )
      
      // We only check tab filter when includeTabFilter is true
      let matchesTab = true
      if (includeTabFilter && activeTab === 'recent') {
        const thirtyDaysAgo = subDays(new Date(), 30)
        matchesTab = isAfter(transactionDate, thirtyDaysAgo)
      }
      
      return matchesSearch && matchesCategory && matchesPaymentMethod && matchesDateRange && matchesTab
    })
  }

  // Get filtered transactions based on all criteria including active tab
  const filteredTransactions = getFilteredTransactions(transactions, true)
  
  // Get all filtered transactions ignoring the tab filter
  const allFilteredTransactions = getFilteredTransactions(transactions, false)
  
  // Get recent transactions (last 30 days)
  const recentTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transacted_at)
    const thirtyDaysAgo = subDays(new Date(), 30)
    return isAfter(transactionDate, thirtyDaysAgo)
  })
  
  // Apply other filters to recent transactions
  const filteredRecentTransactions = getFilteredTransactions(recentTransactions, false)

  // Calculate filtered total
  const getTotal = (transactions: Transaction[]) => {
    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }

  // Calculate filtered totals
  const allFilteredTotal = getTotal(allFilteredTransactions)
  const recentFilteredTotal = getTotal(filteredRecentTransactions)

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Get transactions to export (either filtered or all)
      const dataToExport = hasActiveFilters() ? filteredTransactions : transactions
      
      // Create CSV content
      const headers = ['Date', 'Donor', 'Category', 'Payment Method', 'Amount', 'Notes']
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(t => [
          formatDate(t.transacted_at),
          `"${getDonorName(t)}"`,
          `"${t.category}"`,
          `"${t.payment_method}"`,
          t.amount,
          `"${t.notes || ''}"`
        ].join(','))
      ].join('\n')
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `giving-transactions-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Export Successful',
        description: `Exported ${dataToExport.length} transactions to CSV`
      })
    } catch (err) {
      console.error('Failed to export:', err)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export transactions to CSV'
      })
    }
  }

  // Render transactions table
  const renderTransactionsTable = (transactions: Transaction[], total?: number) => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-[50px]" />
              <Skeleton className="h-12 w-[200px]" />
              <Skeleton className="h-12 w-[100px]" />
              <Skeleton className="h-12 w-[100px]" />
              <Skeleton className="h-12 w-[100px]" />
            </div>
          ))}
        </div>
      )
    }
    
    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No Transactions Found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters() 
              ? "Try adjusting your filters or try a different search term."
              : "Start by adding your first giving transaction."}
          </p>
          {hasActiveFilters() ? (
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button onClick={() => router.push('/finance/giving/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          )}
        </div>
      )
    }
    
    return (
      <>
        {hasActiveFilters() && total !== undefined && (
          <div className="mb-2 text-sm font-medium text-right">
            Filtered Total: {formatCurrency(total)}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow 
                key={transaction.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/finance/giving/${transaction.id}`)}
              >
                <TableCell className="font-medium">
                  {formatDate(transaction.transacted_at)}
                </TableCell>
                <TableCell>{getDonorName(transaction)}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.payment_method}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giving Transactions</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={isRefreshing}
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            disabled={transactions.length === 0 || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push('/finance/giving/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>
      
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Giving YTD"
          value={metrics.totalGivingYTD}
          loading={metrics.loading}
          icon={<DollarSign className="h-6 w-6" />}
          formatter="currency"
        />
        <MetricCard
          title="Monthly Average"
          value={metrics.monthlyAverage}
          loading={metrics.loading}
          icon={<TrendingUp className="h-6 w-6" />}
          formatter="currency"
        />
        <MetricCard
          title="Number of Transactions"
          value={metrics.transactionCount}
          loading={metrics.loading}
          icon={<Receipt className="h-6 w-6" />}
          formatter="number"
        />
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary text-primary-foreground' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        {/* Filter Panel */}
        {showFilters && (
          <CardContent className="border-t pt-3">
            <div className="flex flex-wrap gap-3 mb-3">
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {filters.category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({...filters, category: ''})}
                  />
                </Badge>
              )}
              {filters.paymentMethod && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Method: {filters.paymentMethod}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({...filters, paymentMethod: ''})}
                  />
                </Badge>
              )}
              {filters.date?.from && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  From: {format(filters.date.from, 'MMM d, yyyy')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({
                      ...filters, 
                      date: filters.date?.to ? { from: undefined, to: filters.date.to } : undefined
                    })}
                  />
                </Badge>
              )}
              {filters.date?.to && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  To: {format(filters.date.to, 'MMM d, yyyy')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({
                      ...filters, 
                      date: filters.date?.from ? { from: filters.date.from, to: undefined } : undefined
                    })}
                  />
                </Badge>
              )}
              {hasActiveFilters() && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 cursor-pointer hover:bg-secondary"
                  onClick={resetFilters}
                >
                  Clear All Filters
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => setFilters({...filters, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select 
                  value={filters.paymentMethod} 
                  onValueChange={(value) => setFilters({...filters, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.date?.from ? (
                              format(filters.date.from, "MMM d, yyyy")
                            ) : (
                              <span>Start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            initialFocus
                            mode="single"
                            selected={filters.date?.from}
                            onSelectDate={handleStartDateSelect}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.date?.to ? (
                              format(filters.date.to, "MMM d, yyyy")
                            ) : (
                              <span>End date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            initialFocus
                            mode="single"
                            selected={filters.date?.to}
                            onSelectDate={handleEndDateSelect}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Transactions Tabs */}
      <Card>
        <CardHeader className="pb-1.5">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4 max-w-md">
              <TabsTrigger value="all">
                All Transactions
              </TabsTrigger>
              <TabsTrigger value="recent">
                Recent (30 Days)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <CardTitle className="mb-4">
                {hasActiveFilters() 
                  ? `Filtered Transactions (${allFilteredTransactions.length})`
                  : `All Transactions (${transactions.length})`}
              </CardTitle>
              <CardContent className="px-0">
                {renderTransactionsTable(allFilteredTransactions, allFilteredTotal)}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="recent">
              <CardTitle className="mb-4">
                {hasActiveFilters() 
                  ? `Recent Filtered Transactions (${filteredRecentTransactions.length})`
                  : `Recent Transactions (${recentTransactions.length})`}
              </CardTitle>
              <CardContent className="px-0">
                {renderTransactionsTable(filteredRecentTransactions, recentFilteredTotal)}
              </CardContent>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
} 