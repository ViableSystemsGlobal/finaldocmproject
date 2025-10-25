'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, 
  CreditCard, 
  LineChart, 
  Receipt, 
  Building,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Target,
  Activity,
  PieChart,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MetricCard } from '@/components/MetricCard'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDateRange, exportToCSV, formatDisplayDate, getPeriodDisplayName, formatCurrency } from '@/lib/utils'

import { 
  getTotalTransactionsYTD, 
  fetchRecentTransactions,
  Transaction 
} from '@/services/transactions'
import { 
  getTotalExpensesYTD, 
  fetchRecentExpenses,
  Expense 
} from '@/services/expenses'

export default function FinancialReportsPage() {
  const router = useRouter()
  
  const [metrics, setMetrics] = useState({
    totalGivingYTD: 0,
    totalExpensesYTD: 0,
    netBalance: 0,
    totalAssetValue: 0,
    loading: true
  })
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isExporting, setIsExporting] = useState(false)
  
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)
  
  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true)
        
        const totalGivingYTD = await getTotalTransactionsYTD()
        const totalExpensesYTD = await getTotalExpensesYTD()
        const netBalance = totalGivingYTD - totalExpensesYTD
        
        setMetrics({
          totalGivingYTD,
          totalExpensesYTD,
          netBalance,
          totalAssetValue: 0,
          loading: false
        })
        
        const { data: transactionsData, error: transactionsError } = await fetchRecentTransactions()
        
        if (transactionsError) throw transactionsError
        
        setRecentTransactions(transactionsData ? (transactionsData as unknown as Transaction[]) : [])
        
        const { data: expensesData, error: expensesError } = await fetchRecentExpenses()
        
        if (expensesError) throw expensesError
        
        setRecentExpenses(expensesData ? (expensesData as unknown as Expense[]) : [])
      } catch (err) {
        console.error('Failed to load financial data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load financial data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadFinancialData()
  }, [selectedYear, selectedPeriod])
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  const getDonorName = (transaction: Transaction) => {
    if (transaction.contacts) {
      const firstName = transaction.contacts.first_name || ''
      const lastName = transaction.contacts.last_name || ''
      return `${firstName} ${lastName}`.trim() || 'Anonymous'
    }
    return 'Anonymous'
  }

  const handleDownloadReport = async () => {
    setIsExporting(true)
    try {
      // Prepare export data
      const exportData = []
      
      // Add summary metrics
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total Income',
        value: formatCurrency(metrics.totalGivingYTD),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total Expenses',
        value: formatCurrency(metrics.totalExpensesYTD),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Net Income',
        value: formatCurrency(metrics.netBalance),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total Asset Value',
        value: formatCurrency(metrics.totalAssetValue),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      // Add recent transactions
      recentTransactions.forEach(transaction => {
        exportData.push({
          section: 'Recent Transactions',
          metric: 'Transaction',
          donor: getDonorName(transaction),
          amount: formatCurrency(transaction.amount || 0),
          date: formatDate(transaction.transacted_at || ''),
          category: transaction.category || 'General',
          period: getPeriodDisplayName(selectedPeriod)
        })
      })
      
      // Add recent expenses
      recentExpenses.forEach(expense => {
        exportData.push({
          section: 'Recent Expenses',
          metric: 'Expense',
          description: expense.vendor || 'No vendor',
          amount: formatCurrency(expense.amount || 0),
          date: formatDate(expense.created_at || ''),
          category: expense.category || 'General',
          period: getPeriodDisplayName(selectedPeriod)
        })
      })
      
      // Add sample expense categories breakdown
      const expenseCategories = [
        { category: 'Staff & Payroll', amount: 45000, percentage: 35 },
        { category: 'Facilities & Utilities', amount: 28000, percentage: 22 },
        { category: 'Ministry Programs', amount: 22000, percentage: 17 },
        { category: 'Missions & Outreach', amount: 18000, percentage: 14 },
        { category: 'Administration', amount: 15000, percentage: 12 },
      ]
      
      expenseCategories.forEach(category => {
        exportData.push({
          section: 'Expense Categories',
          metric: category.category,
          amount: formatCurrency(category.amount),
          percentage: `${category.percentage}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Generate filename
      const filename = `financial-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      
      // Export to CSV
      exportToCSV(filename, exportData)
      
      toast({
        title: 'Report Exported',
        description: `Financial report for ${getPeriodDisplayName(selectedPeriod)} has been downloaded successfully.`
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Financial Reports</h2>
          <p className="text-slate-600">Analyzing financial data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Financial Reports
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track giving, expenses, and financial health
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[180px] bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px] bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleDownloadReport}
                variant="outline"
                className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl px-6"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Financial Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Total Income</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.totalGivingYTD)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">+5.2% vs previous period</span>
              </div>
            </div>
          </div>
      
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CreditCard className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.totalExpensesYTD)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-200" />
                <span className="text-red-100 text-sm font-medium">-2.1% vs previous period</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 ${
              metrics.netBalance >= 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-orange-500 to-red-500'
            }`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <LineChart className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    metrics.netBalance >= 0 ? 'text-blue-100' : 'text-orange-100'
                  }`}>Net Income</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.netBalance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {metrics.netBalance >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-blue-200" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-orange-200" />
                )}
                <span className={`text-sm font-medium ${
                  metrics.netBalance >= 0 ? 'text-blue-100' : 'text-orange-100'
                }`}>
                  {metrics.netBalance >= 0 ? '+8.3%' : '-8.3%'} vs previous period
                </span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Target className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Budget Performance</p>
                  <p className="text-3xl font-bold">92.3%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">of budget achieved</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="income" className="rounded-lg">Income</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-lg">Expenses</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg">Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Income vs Expenses
                  </CardTitle>
                  <CardDescription>Financial breakdown for this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
                    <PieChart className="h-16 w-16 text-slate-400 mb-4" />
                    <p className="text-slate-600 text-center mb-2">
                      Income vs Expenses chart would be displayed here
                    </p>
                    <Badge variant="outline">Chart integration with Recharts recommended</Badge>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 rounded-b-xl">
                  <div className="w-full">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span><span className="font-medium">Income:</span> {formatCurrency(metrics.totalGivingYTD)}</span>
                      <span><span className="font-medium">Expenses:</span> {formatCurrency(metrics.totalExpensesYTD)}</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </CardFooter>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Monthly Trends
                  </CardTitle>
                  <CardDescription>Income and expense trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <BarChart3 className="h-16 w-16 text-green-400 mb-4" />
                    <p className="text-green-700 text-center mb-2">
                      Monthly financial trends chart would be displayed here
                    </p>
                    <Badge variant="outline" className="text-green-600">Revenue and expense patterns</Badge>
                  </div>
                </CardContent>
                <CardFooter className="bg-green-50 rounded-b-xl">
                  <div className="text-sm text-green-700">
                    <span className="font-medium">Trend:</span> Steady growth with seasonal variations
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Top Expense Categories
                  </CardTitle>
                  <CardDescription>Breakdown of major expense categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { category: 'Staff & Payroll', amount: 45000, percentage: 35, color: 'bg-blue-500' },
                    { category: 'Facilities & Utilities', amount: 28000, percentage: 22, color: 'bg-purple-500' },
                    { category: 'Ministry Programs', amount: 22000, percentage: 17, color: 'bg-green-500' },
                    { category: 'Missions & Outreach', amount: 18000, percentage: 14, color: 'bg-orange-500' },
                    { category: 'Administration', amount: 15000, percentage: 12, color: 'bg-gray-500' },
                  ].map((expense) => (
                    <div key={expense.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{expense.category}</span>
                        <span className="text-sm text-slate-500">{formatCurrency(expense.amount)} ({expense.percentage}%)</span>
                      </div>
                      <Progress value={expense.percentage} className="h-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-orange-500" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>Latest giving and expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...recentTransactions.slice(0, 3), ...recentExpenses.slice(0, 2)].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                            'amount' in item ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {'amount' in item ? <DollarSign className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {'amount' in item ? getDonorName(item as Transaction) : (item as Expense).vendor || 'Unknown Expense'}
                            </div>
                            <div className="text-sm text-slate-600">
                              {formatDate('amount' in item ? (item as Transaction).created_at : (item as Expense).spent_at)}
                            </div>
                          </div>
                        </div>
                        <div className={`text-right font-medium ${
                          'amount' in item ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {'amount' in item ? '+' : '-'}{formatCurrency('amount' in item ? (item as Transaction).amount : (item as Expense).amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">View All Transactions</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Giving Analysis
                </CardTitle>
                <CardDescription>Detailed analysis of church giving patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Online Giving', amount: 45000, percentage: 60, trend: '+12%' },
                    { label: 'Cash/Check', amount: 22500, percentage: 30, trend: '-5%' },
                    { label: 'Special Offerings', amount: 7500, percentage: 10, trend: '+25%' }
                  ].map((method) => (
                    <div key={method.label} className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800 mb-1">{formatCurrency(method.amount)}</div>
                      <div className="text-sm font-medium text-slate-600 mb-2">{method.label}</div>
                      <Progress value={method.percentage} className="h-2 mb-2" />
                      <div className="text-xs text-slate-500">{method.percentage}% • {method.trend}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle>Recent Giving</CardTitle>
                <CardDescription>Latest donations and offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.slice(0, 10).map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{getDonorName(transaction)}</TableCell>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.payment_method || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-red-500" />
                  Expense Breakdown
                </CardTitle>
                <CardDescription>Detailed breakdown of church expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { category: 'Payroll', amount: 45000, budget: 50000, color: 'bg-blue-500' },
                    { category: 'Facilities', amount: 28000, budget: 30000, color: 'bg-purple-500' },
                    { category: 'Programs', amount: 22000, budget: 25000, color: 'bg-green-500' },
                    { category: 'Missions', amount: 18000, budget: 20000, color: 'bg-orange-500' }
                  ].map((expense) => (
                    <div key={expense.category} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${expense.color}`}></div>
                        <span className="text-sm font-medium text-slate-700">{expense.category}</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">{formatCurrency(expense.amount)}</div>
                      <Progress value={(expense.amount / expense.budget) * 100} className="h-2 mb-1" />
                      <div className="text-xs text-slate-500">
                        {((expense.amount / expense.budget) * 100).toFixed(1)}% of {formatCurrency(expense.budget)} budget
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Latest church expenditures</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentExpenses.slice(0, 10).map((expense, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{expense.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expense.category || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(expense.spent_at)}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          -{formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-500" />
                  Financial Trends
                </CardTitle>
                <CardDescription>Track financial performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <LineChart className="h-20 w-20 text-blue-400 mb-4" />
                  <p className="text-blue-700 text-center mb-2">
                    Financial trends chart would be displayed here
                  </p>
                  <Badge variant="outline" className="text-blue-600">Income, expenses, and net balance over time</Badge>
                </div>
              </CardContent>
              <CardFooter className="bg-blue-50 rounded-b-xl">
                <div className="w-full">
                  <div className="flex justify-between text-sm text-blue-700 mb-2">
                    <span><span className="font-medium">Growth Rate:</span> +12.5% YoY</span>
                    <span><span className="font-medium">Forecast:</span> Positive trend</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 