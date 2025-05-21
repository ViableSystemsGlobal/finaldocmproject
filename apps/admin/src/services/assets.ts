import { supabase } from '@/lib/supabase';

export type Asset = {
  id: string;
  name: string;
  purchase_date: string;
  cost: number;
  depreciation_method: string;
  life_years: number;
  accumulated_depreciation: number;
  created_at: string;
};

export function fetchAssets() {
  return supabase
    .from('assets')
    .select('*')
    .order('purchase_date', { ascending: false });
}

export function fetchAsset(id: string) {
  return supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .single();
}

export function createAsset(data: Partial<Asset>) {
  return supabase.from('assets').insert(data);
}

export function updateAsset(id: string, data: Partial<Asset>) {
  return supabase.from('assets').update(data).eq('id', id);
}

export function deleteAsset(id: string) {
  return supabase.from('assets').delete().eq('id', id);
}

export async function getTotalAssetBookValue() {
  const { data, error } = await supabase.rpc('sum_asset_book_values');
  
  if (error) {
    throw error;
  }
  
  return data || 0;
}

export function getTotalAssetCount() {
  return supabase
    .from('assets')
    .select('id', { count: 'exact', head: true });
}

// Calculate depreciation schedule for an asset
export function calculateDepreciationSchedule(asset: Asset) {
  const { cost, purchase_date, life_years, depreciation_method } = asset;
  const scheduleItems = [];
  const purchaseYear = new Date(purchase_date).getFullYear();
  const purchaseDate = new Date(purchase_date);
  
  let remainingValue = cost;
  let totalDepreciation = 0;
  
  for (let year = 0; year <= life_years; year++) {
    const currentDate = new Date(purchaseDate);
    currentDate.setFullYear(purchaseDate.getFullYear() + year);
    
    let yearlyDepreciation = 0;
    
    if (year > 0) {
      if (depreciation_method === 'straight-line') {
        yearlyDepreciation = cost / life_years;
      } else if (depreciation_method === 'double-declining') {
        const rate = 2 / life_years;
        yearlyDepreciation = remainingValue * rate;
      }
      
      totalDepreciation += yearlyDepreciation;
      remainingValue = cost - totalDepreciation;
      
      // Ensure no negative book value
      if (remainingValue < 0) {
        remainingValue = 0;
        yearlyDepreciation = cost - (totalDepreciation - yearlyDepreciation);
        totalDepreciation = cost;
      }
    }
    
    scheduleItems.push({
      year: purchaseYear + year,
      date: currentDate.toISOString().split('T')[0],
      depreciation: year === 0 ? 0 : yearlyDepreciation,
      accumulatedDepreciation: totalDepreciation,
      bookValue: remainingValue
    });
  }
  
  return scheduleItems;
}

// Calculate book value for an asset
export function calculateBookValue(asset: Asset): number {
  return asset.cost - asset.accumulated_depreciation;
}

// Get total book value of all assets
export async function getTotalAssetValue(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('sum_asset_book_values');
    
    if (error) throw error;
    
    return data || 0;
  } catch (err) {
    console.error('Error getting total asset value:', err);
    return 0;
  }
} 