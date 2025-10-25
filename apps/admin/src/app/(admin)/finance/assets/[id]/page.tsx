'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building, Edit, Trash2, Save, X, Eye, Loader2, Calendar, DollarSign, FileText, BarChart3, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  fetchAsset, 
  updateAsset, 
  deleteAsset,
  calculateDepreciationSchedule,
  calculateBookValue,
  Asset 
} from '@/services/assets'
import { format } from 'date-fns'

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = use(params)
  const isEditMode = searchParams.get('mode') === 'edit'
  
  const [asset, setAsset] = useState<Asset | null>(null)
  const [depreciationSchedule, setDepreciationSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editMode, setEditMode] = useState(isEditMode)
  const [formState, setFormState] = useState({
    name: '',
    purchase_date: '',
    cost: '',
    depreciation_method: 'straight-line',
    life_years: '',
    accumulated_depreciation: ''
  })

  // Load asset data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch asset details
        const { data, error } = await fetchAsset(id)
        
        if (error) throw error
        
        if (data) {
          const assetData = data as unknown as Asset
          setAsset(assetData)
          
          // Set form state from asset data
          setFormState({
            name: assetData.name,
            purchase_date: new Date(assetData.purchase_date).toISOString().split('T')[0],
            cost: assetData.cost.toString(),
            depreciation_method: assetData.depreciation_method,
            life_years: assetData.life_years.toString(),
            accumulated_depreciation: assetData.accumulated_depreciation.toString()
          })
          
          // Calculate depreciation schedule
          const schedule = calculateDepreciationSchedule(assetData)
          setDepreciationSchedule(schedule)
        }
      } catch (err) {
        console.error('Failed to load asset data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load asset'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  useEffect(() => {
    setEditMode(isEditMode)
  }, [isEditMode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Validate inputs
      const cost = parseFloat(formState.cost)
      const lifeYears = parseInt(formState.life_years)
      const accumulatedDepreciation = parseFloat(formState.accumulated_depreciation)
      
      if (isNaN(cost) || cost <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid cost',
          description: 'Please enter a valid positive cost'
        })
        return
      }
      
      if (isNaN(lifeYears) || lifeYears <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid life years',
          description: 'Please enter a valid number of years'
        })
        return
      }
      
      if (isNaN(accumulatedDepreciation) || accumulatedDepreciation < 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid accumulated depreciation',
          description: 'Please enter a valid accumulated depreciation'
        })
        return
      }
      
      if (accumulatedDepreciation > cost) {
        toast({
          variant: 'destructive',
          title: 'Invalid accumulated depreciation',
          description: 'Accumulated depreciation cannot exceed cost'
        })
        return
      }
      
      const { error } = await updateAsset(id, {
        ...formState,
        cost,
        life_years: lifeYears,
        accumulated_depreciation: accumulatedDepreciation
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Asset has been updated successfully'
      })
      
      // Refresh asset data
      const { data } = await fetchAsset(id)
      const updatedAsset = data as unknown as Asset
      setAsset(updatedAsset)
      
      // Recalculate depreciation schedule
      const schedule = calculateDepreciationSchedule(updatedAsset)
      setDepreciationSchedule(schedule)
      setEditMode(false)
      
    } catch (err) {
      console.error('Failed to update asset:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update asset'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const { error } = await deleteAsset(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Asset has been deleted successfully'
      })
      
      router.push('/finance/assets')
    } catch (err) {
      console.error('Failed to delete asset:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete asset'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPp')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Asset</h2>
          <p className="text-slate-600">Fetching asset details...</p>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Building className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Asset Not Found</h2>
          <p className="text-slate-600 mb-6">The asset you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/finance/assets')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/finance/assets">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {editMode ? 'Edit Asset' : 'Asset Details'}
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  {editMode ? 'Update asset information' : asset.name}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!editMode && (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Asset
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {editMode ? (
          /* Edit Form */
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Asset</h2>
                  <p className="text-slate-300">Update the asset details</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Asset Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-slate-700">
                    Asset Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter asset name"
                    value={formState.name}
                    onChange={handleChange}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {/* Purchase Date and Cost */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="purchase_date" className="text-base font-semibold text-slate-700">
                      Purchase Date
                    </Label>
                    <Input
                      id="purchase_date"
                      name="purchase_date"
                      type="date"
                      value={formState.purchase_date}
                      onChange={handleChange}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="cost" className="text-base font-semibold text-slate-700">
                      Cost
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg font-bold">$</span>
                      <Input
                        id="cost"
                        name="cost"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={formState.cost}
                        onChange={handleChange}
                        className="pl-8 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500 text-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Depreciation Method and Life Years */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="depreciation_method" className="text-base font-semibold text-slate-700">
                      Depreciation Method
                    </Label>
                    <Select 
                      name="depreciation_method" 
                      value={formState.depreciation_method}
                      onValueChange={(value) => handleSelectChange('depreciation_method', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight-line">Straight Line</SelectItem>
                        <SelectItem value="double-declining">Double Declining Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="life_years" className="text-base font-semibold text-slate-700">
                      Useful Life (Years)
                    </Label>
                    <Input
                      id="life_years"
                      name="life_years"
                      type="number"
                      min="1"
                      step="1"
                      value={formState.life_years}
                      onChange={handleChange}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                {/* Accumulated Depreciation */}
                <div className="space-y-3">
                  <Label htmlFor="accumulated_depreciation" className="text-base font-semibold text-slate-700">
                    Accumulated Depreciation
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg font-bold">$</span>
                    <Input
                      id="accumulated_depreciation"
                      name="accumulated_depreciation"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formState.accumulated_depreciation}
                      onChange={handleChange}
                      className="pl-8 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                    className="rounded-xl px-8 py-3 border-2 border-slate-200 bg-white/50 hover:bg-white/80"
                  >
                    <X className="mr-2 h-5 w-5" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex-1 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Asset Overview */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Asset Overview</h2>
                    <p className="text-slate-300">Complete asset details and depreciation information</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Original Cost</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {formatCurrency(asset.cost)}
                        </p>
                        <p className="text-sm text-blue-600">Purchase Price</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-3 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-600">Current Book Value</p>
                        <p className="text-2xl font-bold text-indigo-800">
                          {formatCurrency(calculateBookValue(asset))}
                        </p>
                        <p className="text-sm text-indigo-600">Net Asset Value</p>
                      </div>
                    </div>
                  </div>

                  {/* Asset Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Asset Name</p>
                        <p className="text-lg font-semibold text-green-800">{asset.name}</p>
                        <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                          {asset.depreciation_method === 'straight-line' ? 'Straight Line' : 'Double Declining'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-xl">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600">Purchase Date</p>
                        <p className="text-lg font-semibold text-orange-800">{formatDate(asset.purchase_date)}</p>
                        <p className="text-sm text-orange-600">
                          Useful Life: {asset.life_years} years
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Depreciation Summary */}
                <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Depreciation Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-red-600">Accumulated Depreciation</p>
                          <p className="text-xl font-bold text-red-800">{formatCurrency(asset.accumulated_depreciation)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">Depreciation Rate</p>
                          <p className="text-xl font-bold text-red-800">
                            {asset.depreciation_method === 'straight-line' 
                              ? `${(100 / asset.life_years).toFixed(1)}%` 
                              : `${(200 / asset.life_years).toFixed(1)}%`} per year
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">Remaining Value</p>
                          <p className="text-xl font-bold text-red-800">
                            {formatCurrency(Math.max(0, asset.cost - asset.accumulated_depreciation))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Depreciation Schedule */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Depreciation Schedule</h2>
                    <p className="text-slate-300">Year-by-year depreciation breakdown</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                    <TableRow>
                      <TableHead className="py-4 font-bold text-slate-700">Year</TableHead>
                      <TableHead className="text-right py-4 font-bold text-slate-700">Annual Depreciation</TableHead>
                      <TableHead className="text-right py-4 font-bold text-slate-700">Accumulated Depreciation</TableHead>
                      <TableHead className="text-right py-4 font-bold text-slate-700">Book Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciationSchedule.map((item, index) => (
                      <TableRow key={index} className="hover:bg-white/80 transition-colors">
                        <TableCell className="py-4 font-semibold text-slate-800">{item.year}</TableCell>
                        <TableCell className="text-right py-4 font-bold text-red-600">
                          {formatCurrency(item.depreciation)}
                        </TableCell>
                        <TableCell className="text-right py-4 font-bold text-orange-600">
                          {formatCurrency(item.accumulatedDepreciation)}
                        </TableCell>
                        <TableCell className="text-right py-4 font-bold text-blue-600">
                          {formatCurrency(item.bookValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this asset "{asset.name}"? This action cannot be undone and will permanently remove the asset record and all associated depreciation data.
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Asset'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 