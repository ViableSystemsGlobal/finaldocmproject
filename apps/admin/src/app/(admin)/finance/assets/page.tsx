'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building, Plus, Search, DollarSign, TrendingDown, Filter, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { MetricCard } from '@/components/MetricCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
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

  useEffect(() => {
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
      }
    }
    
    loadAssetsData()
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
                          method.includes(search)
    
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Button onClick={() => router.push('/finance/assets/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Asset
        </Button>
      </div>
      
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Book Value"
          value={metrics.totalBookValue}
          icon={<DollarSign className="h-6 w-6" />}
          loading={metrics.loading}
        />
        <MetricCard
          title="Total Asset Cost"
          value={metrics.totalCost}
          icon={<Building className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="currency"
        />
        <MetricCard
          title="Total Depreciation"
          value={metrics.totalDepreciation}
          icon={<TrendingDown className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="currency"
        />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Assets</CardTitle>
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
                    {(filters.depreciationMethod ? 1 : 0) + 
                     (filters.dateRange.startDate ? 1 : 0) + 
                     ((filters.valueRange[0] > 0 || filters.valueRange[1] < maxAssetValue) ? 1 : 0) + 
                     (searchTerm ? 1 : 0)}
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
                placeholder="Search assets..."
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
                  <label className="text-sm font-medium">Depreciation Method</label>
                  <Select
                    value={filters.depreciationMethod}
                    onValueChange={(value) => setFilters({...filters, depreciationMethod: value})}
                  >
                    <SelectTrigger>
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
                  <label className="text-sm font-medium">Purchase Date</label>
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
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Asset Value Range</label>
                    <span className="text-xs text-muted-foreground">
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
                {filters.depreciationMethod && (
                  <Badge variant="secondary" className="flex items-center gap-1">
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
                {(filters.valueRange[0] > 0 || filters.valueRange[1] < maxAssetValue) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
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
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading assets...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center p-4">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium">No assets found</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters() ? 'Try changing or clearing your filters' : 'Create your first asset to get started'}
              </p>
              {!hasActiveFilters() && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => router.push('/finance/assets/new')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Asset
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
                      <TableHead>Name</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Book Value</TableHead>
                      <TableHead>Depreciation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{formatDate(asset.purchase_date)}</TableCell>
                        <TableCell>{formatCurrency(asset.cost)}</TableCell>
                        <TableCell>{formatCurrency(calculateBookValue(asset))}</TableCell>
                        <TableCell>{asset.depreciation_method}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/finance/assets/${asset.id}`)}
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
                  Showing {filteredAssets.length} of {assets.length} assets
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