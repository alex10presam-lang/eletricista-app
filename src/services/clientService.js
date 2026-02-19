import { createClient } from '@/lib/supabase'

export const clientService = {
  // Buscar clientes
  async getClients() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Adicionar cliente
  async addClient(clientData) {
    const supabase = createClient()
    
    // Pega o usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não logado')

    // Salva no banco vinculando ao ID do usuário
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, user_id: user.id }])
      .select()

    if (error) throw error
    return data
  },

  // Deletar cliente
  async deleteClient(id) {
    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}