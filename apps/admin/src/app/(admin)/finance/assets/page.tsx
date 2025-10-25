'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building, 
  Plus, 
  Search, 
  DollarSign, 
  TrendingDown, 
  Filter, 
  Calendar, 
  X, 
  Download, 
  RefreshCcw,
  Clock,
  Package,
  Trash2,
  BarChart3,
  Sparkles,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { MetricCard } from '@/components/MetricCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { 
  fetchAssets, 
  calculateBookValue,
  getTotalAssetValue,
  Asset 
} from '@/services/assets'

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [metrics, setMetrics] = useState({
    totalBookValue: 0,
    totalAssets: 0,
    totalCost: 0,
    totalDepreciation: 0,
    loading: true
  })
  const [filters, setFilters] = useState({
    depreciationMethod: '',
    dateRange: {
      startDate: null as Date | null,
      endDate: null as Date | null
    },
    valueRange: [0, 100000] as [number, number]
  })
  const [showFilters, setShowFilters] = useState(false)
  const [maxAssetValue, setMaxAssetValue] = useState(100000)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Bulk actions state
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  const loadAssetsData = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchAssets()
      
      if (error) throw error
      
      const assetsData = data ? (data as unknown as Asset[]) : []
      setAssets(assetsData)
      
      // Calculate metrics
      const totalBookValue = await getTotalAssetValue()
      const totalAssets = assetsData.length
      
      // Calculate total cost and depreciation
      let totalCost = 0
      let totalDepreciation = 0
      
      // Find the max asset value for the slider
      let highestValue = 100000 // Default
      
      assetsData.forEach(asset => {
        totalCost += asset.cost
        totalDepreciation += asset.accumulated_depreciation
        
        const assetValue = asset.cost
        if (assetValue > highestValue) {
          highestValue = Math.ceil(assetValue / 10000) * 10000 // Round up to nearest 10k
        }
      })
      
      setMaxAssetValue(highestValue)
      setFilters(prev => ({
        ...prev,
        valueRange: [0, highestValue]
      }))
      
      setMetrics({
        totalBookValue,
        totalAssets,
        totalCost,
        totalDepreciation,
        loading: false
      })
    } catch (err) {
      console.error('Failed to load assets:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load assets'
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Bulk actions functions
  const toggleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssets)
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId)
    } else {
      newSelected.add(assetId)
    }
    setSelectedAssets(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set())
      setShowBulkActions(false)
    } else {
      const allIds = new Set(filteredAssets.map(a => a.id))
      setSelectedAssets(allIds)
      setShowBulkActions(true)
    }
  }

  const clearSelection = () => {
    setSelectedAssets(new Set())
    setShowBulkActions(false)
  }

  useEffect(() => {
    loadAssetsData()
  }, [])

  const refreshData = () => {
    setIsRefreshing(true)
    loadAssetsData()
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

  // Get unique depreciation methods for filters
  const depreciationMethods = Array.from(new Set(assets.map(asset => asset.depreciation_method))).sort()

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.depreciationMethod !== '' || 
           filters.dateRange.startDate !== null ||
           filters.valueRange[0] > 0 ||
           filters.valueRange[1] < maxAssetValue ||
           searchTerm !== ''
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      depreciationMethod: '',
      dateRange: {
        startDate: null,
        endDate: null
      },
      valueRange: [0, maxAssetValue]
    })
    setSearchTerm('')
  }

  // Filter assets based on all criteria
  const filteredAssets = assets.filter(asset => {
    const name = asset.name.toLowerCase()
    const method = asset.depreciation_method.toLowerCase()
    const search = searchTerm.toLowerCase()
    const purchaseDate = new Date(asset.purchase_date)
    const assetValue = asset.cost
    
    // Search term filter
    const matchesSearch = search === '' || 
                          name.includes(search) || 
                          method.includes(search) ||
                          formatCurrency(asset.cost).toLowerCase().includes(search)
    
    // Depreciation method filter
    const matchesMethod = filters.depreciationMethod === '' || 
                          asset.depreciation_method === filters.depreciationMethod
    
    // Date range filter
    const matchesDateRange = (filters.dateRange.startDate === null || purchaseDate >= filters.dateRange.startDate) && 
                             (filters.dateRange.endDate === null || purchaseDate <= filters.dateRange.endDate)
    
    // Value range filter
    const matchesValueRange = assetValue >= filters.valueRange[0] && 
                             assetValue <= filters.valueRange[1]
    
    return matchesSearch && matchesMethod && matchesDateRange && matchesValueRange
  })

  // Calculate filtered totals
  const filteredTotalCost = filteredAssets.reduce((sum, asset) => sum + asset.cost, 0)
  const filteredBookValue = filteredAssets.reduce((sum, asset) => sum + calculateBookValue(asset), 0)

  // Export to CSV
  const exportToCSV = () => {
    try {
      // Get assets to export (either filtered or all)
      const dataToExport = hasActiveFilters() ? filteredAssets : assets
      
      // Create CSV content
      const headers = ['Name', 'Purchase Date', 'Cost', 'Book Value', 'Depreciation Method', 'Useful Life', 'Accumulated Depreciation']
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(a => [
          `"${a.name}"`,
          formatDate(a.purchase_date),
          a.cost,
          calculateBookValue(a),
          `"${a.depreciation_method}"`,
          (a as any).useful_life || 'N/A',
          a.accumulated_depreciation
        ].join(','))
      ].join('\n')
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `assets-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Export Successful',
        description: `Exported ${dataToExport.length} assets to CSV`
      })
    } catch (err) {
      console.error('Failed to export:', err)
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export assets to CSV'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Assets</h2>
          <p className="text-slate-600">Fetching asset data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <Building className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Assets
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and manage church assets and depreciation
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={refreshData} 
                disabled={isRefreshing}
                className="rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
              >
                <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={assets.length === 0 || loading}
                className="rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => router.push('/finance/assets/new')}
                className="rounded-xl px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Asset
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Book Value</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      formatCurrency(metrics.totalBookValue)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Current value</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Building className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Total Asset Cost</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      formatCurrency(metrics.totalCost)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Original cost</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingDown className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-sm font-medium">Total Depreciation</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      formatCurrency(metrics.totalDepreciation)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-indigo-200" />
                <span className="text-indigo-100 text-sm font-medium">Accumulated</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Package className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-violet-100 text-sm font-medium">Total Assets</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      metrics.totalAssets.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-200" />
                <span className="text-violet-100 text-sm font-medium">Total items</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Assets</h2>
                <p className="text-slate-300">Find assets by name, method, or value</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="search"
                  placeholder="Search assets..."
                  className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-12 px-6 rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80",
                  showFilters && 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters() && (
                  <Badge className="ml-2 px-1 bg-white/20 text-white">
                    {(filters.depreciationMethod ? 1 : 0) + 
                     (filters.dateRange.startDate ? 1 : 0) + 
                     ((filters.valueRange[0] > 0 || filters.valueRange[1] < maxAssetValue) ? 1 : 0) + 
                     (searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <div className="border-t pt-6">
                <div className="flex flex-wrap gap-3 mb-6">
                  {filters.depreciationMethod !== '' && (
                    <Badge className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      Method: {filters.depreciationMethod === 'straight-line' ? 'Straight Line' : 
                               filters.depreciationMethod === 'double-declining' ? 'Double Declining' : 
                               filters.depreciationMethod}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFilters({...filters, depreciationMethod: ''})}
                      />
                    </Badge>
                  )}
                  {filters.dateRange.startDate && (
                    <Badge className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
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
                  {(filters.valueRange[0] > 0 || filters.valueRange[1] < maxAssetValue) && (
                    <Badge className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                      Value: {formatCurrency(filters.valueRange[0])} - {formatCurrency(filters.valueRange[1])}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFilters({
                          ...filters, 
                          valueRange: [0, maxAssetValue]
                        })}
                      />
                    </Badge>
                  )}
                  {hasActiveFilters() && (
                    <Badge 
                      className="flex items-center gap-2 cursor-pointer hover:bg-red-500 bg-gradient-to-r from-red-400 to-red-500 text-white"
                      onClick={resetFilters}
                    >
                      Clear All Filters
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
                
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Depreciation Method</label>
                    <Select
                      value={filters.depreciationMethod}
                      onValueChange={(value) => setFilters({...filters, depreciationMethod: value})}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Methods</SelectItem>
                        {depreciationMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method === 'straight-line' ? 'Straight Line' : 
                             method === 'double-declining' ? 'Double Declining' : method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Purchase Date Range</label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          type="date"
                          className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
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
                      <div className="flex-1">
                        <Input
                          type="date"
                          className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
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
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">Asset Value Range</label>
                      <span className="text-xs text-slate-600">
                        {formatCurrency(filters.valueRange[0])} - {formatCurrency(filters.valueRange[1])}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={maxAssetValue}
                      step={1000}
                      value={filters.valueRange}
                      onValueChange={(value: number[]) => setFilters({...filters, valueRange: value as [number, number]})}
                      className="py-4"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Assets Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {hasActiveFilters() 
                    ? `Filtered Assets (${filteredAssets.length})`
                    : `All Assets (${assets.length})`}
                </h3>
                {hasActiveFilters() && (
                  <div className="space-y-1 mt-2">
                    <p className="text-lg font-semibold text-slate-600">
                      Total Cost: {formatCurrency(filteredTotalCost)}
                    </p>
                    <p className="text-lg font-semibold text-slate-600">
                      Book Value: {formatCurrency(filteredBookValue)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-[200px]" />
                    <Skeleton className="h-12 w-[120px]" />
                    <Skeleton className="h-12 w-[120px]" />
                    <Skeleton className="h-12 w-[120px]" />
                    <Skeleton className="h-12 w-[150px]" />
                    <Skeleton className="h-12 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Assets Found</h3>
                <p className="text-slate-600 mb-6">
                  {hasActiveFilters() 
                    ? "Try adjusting your filters or search term."
                    : "Start by adding your first asset."}
                </p>
                {hasActiveFilters() ? (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="rounded-xl px-6"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push('/finance/assets/new')}
                    className="rounded-xl px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Asset
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Bulk Actions */}
                {showBulkActions && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-800">
                          {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
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

                <Table>
                <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                  <TableRow>
                    <TableHead className="py-4 font-bold text-slate-700 w-12">
                      <Checkbox
                        checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all assets"
                      />
                    </TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Name</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Purchase Date</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-700">Cost</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-700">Book Value</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Depreciation</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow 
                      key={asset.id}
                      className="cursor-pointer hover:bg-white/80 transition-colors"
                      onClick={() => router.push(`/finance/assets/${asset.id}`)}
                    >
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedAssets.has(asset.id)}
                          onCheckedChange={() => toggleSelectAsset(asset.id)}
                          aria-label={`Select asset ${asset.id}`}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="h-4 w-4 text-slate-500" />
                          <span className="font-semibold text-slate-800">{asset.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-800">{formatDate(asset.purchase_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-lg text-blue-600">
                            {formatCurrency(asset.cost)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <BarChart3 className="h-4 w-4 text-purple-500" />
                          <span className="font-bold text-lg text-purple-600">
                            {formatCurrency(calculateBookValue(asset))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                          {asset.depreciation_method === 'straight-line' ? 'Straight Line' : 
                           asset.depreciation_method === 'double-declining' ? 'Double Declining' : 
                           asset.depreciation_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/finance/assets/${asset.id}`)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 