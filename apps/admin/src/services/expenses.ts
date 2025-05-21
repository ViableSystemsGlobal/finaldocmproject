import { supabase } from '@/lib/supabase';

export type Expense = {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  spent_at: string;
  notes: string;
  created_at: string;
};

export function fetchExpenses() {
  return supabase
    .from('expenses')
    .select('*')
    .order('spent_at', { ascending: false });
}

export function fetchExpense(id: string) {
  return supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();
}

export function createExpense(data: Partial<Expense>) {
  return supabase.from('expenses').insert(data);
}

export function updateExpense(id: string, data: Partial<Expense>) {
  return supabase.from('expenses').update(data).eq('id', id);
}

export function deleteExpense(id: string) {
  return supabase.from('expenses').delete().eq('id', id);
}

export async function getTotalExpensesYTD() {
  const { data, error } = await supabase.rpc('sum_expenses_ytd');
  
  if (error) {
    throw error;
  }
  
  return data || 0;
}

export function fetchRecentExpenses(limit = 5) {
  return supabase
    .from('expenses')
    .select('*')
    .order('spent_at', { ascending: false })
    .limit(limit);
} 