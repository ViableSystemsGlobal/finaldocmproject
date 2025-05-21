'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { createAsset } from '@/services/assets'

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formState, setFormState] = useState({
    name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    cost: '',
    depreciation_method: 'straight-line',
    life_years: '5',
    accumulated_depreciation: '0'
  })

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
      setLoading(true)
      
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
      
      const { error } = await createAsset({
        ...formState,
        cost,
        life_years: lifeYears,
        accumulated_depreciation: accumulatedDepreciation
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Asset has been created'
      })
      
      router.push('/finance/assets')
    } catch (err) {
      console.error('Failed to create asset:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create asset'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Asset</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
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
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/finance/assets')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 