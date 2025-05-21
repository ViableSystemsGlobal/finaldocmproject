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
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCard } from '@/components/MetricCard'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  
  // States
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
  const [selectedPeriod, setSelectedPeriod] = useState('year-to-date')
  
  // Get current year for default selection
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)
  
  // Load initial data and metrics
  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true)
        
        // Load finance metrics
        const totalGivingYTD = await getTotalTransactionsYTD()
        const totalExpensesYTD = await getTotalExpensesYTD()
        const netBalance = totalGivingYTD - totalExpensesYTD
        
        setMetrics({
          totalGivingYTD,
          totalExpensesYTD,
          netBalance,
          totalAssetValue: 0, // Will be updated with a proper function
          loading: false
        })
        
        // Load recent transactions
        const { data: transactionsData, error: transactionsError } = await fetchRecentTransactions()
        
        if (transactionsError) throw transactionsError
        
        // Cast to the correct type
        setRecentTransactions(transactionsData ? (transactionsData as unknown as Transaction[]) : [])
        
        // Load recent expenses
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
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  // Get donor name from transaction
  const getDonorName = (transaction: Transaction) => {
    if (transaction.contacts) {
      const firstName = transaction.contacts.first_name || ''
      const lastName = transaction.contacts.last_name || ''
      return `${firstName} ${lastName}`.trim() || 'Anonymous'
    }
    return 'Anonymous'
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
              <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
              <SelectItem value="q2">Q2 (Apr-Jun)</SelectItem>
              <SelectItem value="q3">Q3 (Jul-Sep)</SelectItem>
              <SelectItem value="q4">Q4 (Oct-Dec)</SelectItem>
              <SelectItem value="full-year">Full Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Financial Summary Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Income"
          value={metrics.totalGivingYTD}
          icon={<DollarSign className="h-6 w-6" />}
          loading={metrics.loading}
          trend={{ 
            value: 5.2, 
            label: 'vs previous period' 
          }}
        />
        <MetricCard
          title="Total Expenses"
          value={metrics.totalExpensesYTD}
          icon={<CreditCard className="h-6 w-6" />}
          loading={metrics.loading}
          trend={{ 
            value: -2.1, 
            label: 'vs previous period' 
          }}
        />
        <MetricCard
          title="Net Income"
          value={metrics.netBalance}
          icon={<LineChart className="h-6 w-6" />}
          loading={metrics.loading}
          className={metrics.netBalance >= 0 ? 'border-green-500' : 'border-red-500'}
          trend={{ 
            value: metrics.netBalance > 0 ? 8.3 : -8.3, 
            label: 'vs previous period' 
          }}
        />
      </div>
      
      {/* Income vs Expenses Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>Monthly comparison for {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] relative">
            {/* This would be replaced with an actual chart component */}
            <div className="flex flex-col items-center justify-center h-full">
              <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Chart showing monthly income versus expenses would be displayed here.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The chart would integrate with a library like Chart.js or Recharts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Income Categories and Expense Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Income Categories</CardTitle>
            <CardDescription>Income breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Tithe</TableCell>
                      <TableCell>{formatCurrency(45000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>55%</span>
                          <span className="ml-2 text-green-600 flex items-center">
                            <ArrowUpRight className="h-4 w-4" /> 3.2%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Building Fund</TableCell>
                      <TableCell>{formatCurrency(25000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>30%</span>
                          <span className="ml-2 text-green-600 flex items-center">
                            <ArrowUpRight className="h-4 w-4" /> 5.5%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Missions</TableCell>
                      <TableCell>{formatCurrency(8000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>10%</span>
                          <span className="ml-2 text-red-600 flex items-center">
                            <ArrowDownRight className="h-4 w-4" /> 1.8%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other</TableCell>
                      <TableCell>{formatCurrency(4000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>5%</span>
                          <span className="ml-2 text-green-600 flex items-center">
                            <ArrowUpRight className="h-4 w-4" /> 2.1%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
            <CardDescription>Expense breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Salaries</TableCell>
                      <TableCell>{formatCurrency(38000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>45%</span>
                          <span className="ml-2 text-green-600 flex items-center">
                            <ArrowUpRight className="h-4 w-4" /> 0.5%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Utilities</TableCell>
                      <TableCell>{formatCurrency(15000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>18%</span>
                          <span className="ml-2 text-red-600 flex items-center">
                            <ArrowDownRight className="h-4 w-4" /> 2.3%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maintenance</TableCell>
                      <TableCell>{formatCurrency(12000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>14%</span>
                          <span className="ml-2 text-green-600 flex items-center">
                            <ArrowUpRight className="h-4 w-4" /> 3.8%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Programs</TableCell>
                      <TableCell>{formatCurrency(18000)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>21%</span>
                          <span className="ml-2 text-red-600 flex items-center">
                            <ArrowDownRight className="h-4 w-4" /> 1.5%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Recent Income</TabsTrigger>
              <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading transactions...</span>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No recent transactions found</p>
                </div>
              ) :
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.transacted_at)}</TableCell>
                        <TableCell>{getDonorName(transaction)}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.payment_method}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/finance/giving/${transaction.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push('/finance/giving')}>
                  View All Transactions
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="expenses" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading expenses...</span>
                </div>
              ) : recentExpenses.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No recent expenses found</p>
                </div>
              ) :
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
                    {recentExpenses.map((expense) => (
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
              }
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push('/finance/expenses')}>
                  View All Expenses
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
          <CardDescription>Comparing {selectedYear} with {selectedYear - 1}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>{selectedYear}</TableHead>
                <TableHead>{selectedYear - 1}</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Income</TableCell>
                <TableCell>{formatCurrency(82000)}</TableCell>
                <TableCell>{formatCurrency(75000)}</TableCell>
                <TableCell className="text-green-600">+9.3%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Expenses</TableCell>
                <TableCell>{formatCurrency(68000)}</TableCell>
                <TableCell>{formatCurrency(65000)}</TableCell>
                <TableCell className="text-red-600">+4.6%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Net Income</TableCell>
                <TableCell>{formatCurrency(14000)}</TableCell>
                <TableCell>{formatCurrency(10000)}</TableCell>
                <TableCell className="text-green-600">+40%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Average Monthly Income</TableCell>
                <TableCell>{formatCurrency(6833)}</TableCell>
                <TableCell>{formatCurrency(6250)}</TableCell>
                <TableCell className="text-green-600">+9.3%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Average Monthly Expenses</TableCell>
                <TableCell>{formatCurrency(5667)}</TableCell>
                <TableCell>{formatCurrency(5417)}</TableCell>
                <TableCell className="text-red-600">+4.6%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 