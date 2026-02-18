// src/app/dashboard/page.js
'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verifica se tem usuário logado
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login') // Se não tiver logado, manda pro login
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return <div className="p-8 text-center">Carregando painel...</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Barra Superior */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Eletricista Pro</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Grid de Atalhos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cartão de Clientes */}
            <a href="/dashboard/clients" className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">👥 Clientes</h5>
              <p className="font-normal text-gray-700">
                Gerencie sua base de clientes. Adicione contatos e veja histórico.
              </p>
            </a>

            {/* Cartão de Orçamentos (Em breve) */}
            <div className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md opacity-60">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">📝 Orçamentos</h5>
              <p className="font-normal text-gray-700">
                Crie orçamentos profissionais em PDF. (Em breve)
              </p>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700">Bem-vindo ao seu Painel!</h2>
              <p className="mt-2 text-gray-500">Aqui ficarão seus orçamentos e clientes.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}