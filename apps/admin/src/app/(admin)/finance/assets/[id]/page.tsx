'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { 
  fetchAsset, 
  updateAsset, 
  deleteAsset,
  calculateDepreciationSchedule,
  Asset 
} from '@/services/assets'

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  
  const [asset, setAsset] = useState<Asset | null>(null)
  const [depreciationSchedule, setDepreciationSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        description: 'Asset has been updated'
      })
      
      // Refresh asset data
      const { data } = await fetchAsset(id)
      const updatedAsset = data as unknown as Asset
      setAsset(updatedAsset)
      
      // Recalculate depreciation schedule
      const schedule = calculateDepreciationSchedule(updatedAsset)
      setDepreciationSchedule(schedule)
      
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
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return
    }
    
    try {
      setSaving(true)
      
      const { error } = await deleteAsset(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Asset has been deleted'
      })
      
      router.push('/finance/assets')
    } catch (err) {
      console.error('Failed to delete asset:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete asset'
      })
      setSaving(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading asset...</span>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center p-4">
        <p className="text-lg font-medium">Asset not found</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => router.push('/finance/assets')}
        >
          Back to Assets
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/finance/assets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Asset Details</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter asset name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={formState.purchase_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formState.cost}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depreciation_method">Depreciation Method</Label>
                  <Select 
                    name="depreciation_method" 
                    value={formState.depreciation_method}
                    onValueChange={(value) => handleSelectChange('depreciation_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight-line">Straight Line</SelectItem>
                      <SelectItem value="double-declining">Double Declining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="life_years">Useful Life (Years)</Label>
                  <Input
                    id="life_years"
                    name="life_years"
                    type="number"
                    min="1"
                    step="1"
                    value={formState.life_years}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accumulated_depreciation">Accumulated Depreciation</Label>
                <Input
                  id="accumulated_depreciation"
                  name="accumulated_depreciation"
                  type="number"
                  step="0.01"
                  value={formState.accumulated_depreciation}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/finance/assets')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Depreciation Schedule</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Depreciation</TableHead>
                  <TableHead>Book Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depreciationSchedule.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>{formatCurrency(item.depreciation)}</TableCell>
                    <TableCell>{formatCurrency(item.bookValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 