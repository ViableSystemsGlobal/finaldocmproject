'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building, Plus, Loader2, Save, X } from 'lucide-react'
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
        description: 'Asset has been created successfully'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
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
                  New Asset
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Add a new asset to the inventory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Asset Details</h2>
                <p className="text-slate-300">Enter the details for this asset</p>
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
                  placeholder="Enter asset name (e.g., Laptop, Office Desk, Sound System)"
                  value={formState.name}
                  onChange={handleChange}
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-slate-500">
                  Give this asset a descriptive name
                </p>
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
                  <p className="text-sm text-slate-500">
                    When was this asset purchased?
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="cost" className="text-base font-semibold text-slate-700">
                    Purchase Cost
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
                  <p className="text-sm text-slate-500">
                    Original purchase price in USD
                  </p>
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
                      <SelectValue placeholder="Select depreciation method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight-line">Straight Line</SelectItem>
                      <SelectItem value="double-declining">Double Declining Balance</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    How should this asset depreciate?
                  </p>
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
                  <p className="text-sm text-slate-500">
                    Expected useful life in years
                  </p>
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
                <p className="text-sm text-slate-500">
                  Any depreciation already recorded (usually $0 for new assets)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/finance/assets')}
                  disabled={loading}
                  className="rounded-xl px-8 py-3 border-2 border-slate-200 bg-white/50 hover:bg-white/80"
                >
                  <X className="mr-2 h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Asset...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Create Asset
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 