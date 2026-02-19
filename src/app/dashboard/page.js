// src/app/dashboard/page.js
'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Users, FileText, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ clients: 0, budgets: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Busca contagem simples (Poderia ser um count(*) no banco, mas vamos contar o array por enquanto)
      const { data: clients } = await supabase.from('clients').select('id')
      const { data: budgets } = await supabase.from('budgets').select('id')
      
      setStats({
        clients: clients?.length || 0,
        budgets: budgets?.length || 0
      })
    }
    loadData()
  }, [])

  if (!user) return <div className="p-8 text-gray-500">Carregando painel...</div>

  return (
    <div>
      {/* Cabeçalho da Página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Olá, Eletricista! 👋</h1>
        <p className="text-gray-500 mt-1">Aqui está o resumo do seu negócio hoje.</p>
      </div>

      {/* Grid de Estatísticas (Cartões Coloridos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Clientes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Clientes</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.clients}</h3>
          </div>
        </div>

        {/* Card 2: Orçamentos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Orçamentos Gerados</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.budgets}</h3>
          </div>
        </div>

        {/* Card 3: Ação Rápida */}
        <Link href="/dashboard/budgets/new" className="group bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg flex items-center justify-between text-white hover:opacity-90 transition">
          <div>
            <p className="text-blue-100 font-medium text-sm">Acesso Rápido</p>
            <h3 className="text-xl font-bold">Novo Orçamento</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition">
            <Plus className="h-6 w-6 text-white" />
          </div>
        </Link>
      </div>

      {/* Seção de Atalhos Rápidos */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Acesso Rápido</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/dashboard/clients" 
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition flex items-center"
        >
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Gerenciar Clientes</h4>
            <p className="text-sm text-gray-500">Adicione ou edite contatos</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/budgets" 
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition flex items-center"
        >
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Histórico de Orçamentos</h4>
            <p className="text-sm text-gray-500">Veja todos os PDFs gerados</p>
          </div>
        </Link>
      </div>
    </div>
  )
}