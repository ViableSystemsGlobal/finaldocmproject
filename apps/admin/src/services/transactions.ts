import { supabase } from '@/lib/supabase';

export type Transaction = {
  id: string;
  contact_id: string;
  amount: number;
  currency: string;
  category: string;
  payment_method: string;
  transacted_at: string;
  notes: string;
  created_at: string;
  contacts?: {
    first_name: string | null;
    last_name: string | null;
  };
};

export function fetchTransactions() {
  return supabase
    .from('transactions')
    .select('id, contact_id, amount, currency, category, payment_method, transacted_at, notes, created_at, contacts(id, first_name, last_name)')
    .order('transacted_at', { ascending: false });
}

export function fetchTransaction(id: string) {
  return supabase
    .from('transactions')
    .select('id, contact_id, amount, currency, category, payment_method, transacted_at, notes, created_at, contacts(id, first_name, last_name)')
    .eq('id', id)
    .single();
}

export function createTransaction(data: Partial<Transaction>) {
  return supabase.from('transactions').insert(data);
}

export function updateTransaction(id: string, data: Partial<Transaction>) {
  return supabase.from('transactions').update(data).eq('id', id);
}

export function deleteTransaction(id: string) {
  return supabase.from('transactions').delete().eq('id', id);
}

export async function getTotalTransactionsYTD() {
  try {
    // Try to use the database function first
    const { data, error } = await supabase.rpc('sum_transactions_ytd');
    
    if (error) {
      console.warn('Database function sum_transactions_ytd not available, calculating manually:', error);
      
      // Fallback: Calculate YTD manually if the function isn't available
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('amount')
        .gte('transacted_at', startOfYear);
      
      if (fetchError) throw fetchError;
      
      // Sum the transactions manually
      return transactions.reduce((total, tx) => total + (tx.amount || 0), 0);
    }
    
    return data || 0;
  } catch (err) {
    console.error('Error calculating transactions YTD:', err);
    return 0; // Return 0 as fallback
  }
}

export function fetchRecentTransactions(limit = 5) {
  return supabase
    .from('transactions')
    .select('id, contact_id, amount, currency, category, payment_method, transacted_at, notes, created_at, contacts(id, first_name, last_name)')
    .order('transacted_at', { ascending: false })
    .limit(limit);
}

// Function to calculate monthly average transactions
export async function getMonthlyAverageTransactions() {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transacted_at')
      .gte('transacted_at', startOfYear);
    
    if (error) throw error;
    if (!data || data.length === 0) return 0;
    
    // Group by month
    const monthlyTotals: Record<number, number> = {};
    data.forEach(tx => {
      const txDate = new Date(tx.transacted_at);
      const month = txDate.getMonth();
      monthlyTotals[month] = (monthlyTotals[month] || 0) + tx.amount;
    });
    
    // Calculate average of months that have data
    const monthsWithData = Object.keys(monthlyTotals).length;
    const totalAmount = Object.values(monthlyTotals).reduce((sum, amount) => sum + amount, 0);
    
    return monthsWithData > 0 ? totalAmount / monthsWithData : 0;
  } catch (err) {
    console.error('Error calculating monthly average:', err);
    return 0;
  }
} 