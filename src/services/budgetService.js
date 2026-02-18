import { createClient } from '@/lib/supabase'

export const budgetService = {
  // Buscar orçamentos (trazendo o nome do cliente junto)
  async getBudgets() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        clients (name) 
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Criar novo orçamento
  async addBudget(budgetData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budgetData, user_id: user.id }])
      .select()

    if (error) throw error
    return data
  },

  // Deletar orçamento
  async deleteBudget(id) {
    const supabase = createClient()
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}