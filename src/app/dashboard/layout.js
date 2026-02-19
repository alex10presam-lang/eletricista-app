// src/app/dashboard/layout.js
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation' // Para saber em qual página estamos
import { LayoutDashboard, Users, FileText, LogOut, Zap } from 'lucide-react' // Ícones
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Lista de menus
  const menuItems = [
    { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/dashboard/clients', icon: Users },
    { name: 'Orçamentos', href: '/dashboard/budgets', icon: FileText },
  ]

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* --- SIDEBAR (Barra Lateral) --- */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Zap className="h-6 w-6 text-yellow-500 mr-2" />
          <span className="text-xl font-bold text-gray-800">EletroPro</span>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 overflow-y-auto">
        {/* Barra Superior Mobile (só aparece em telas pequenas) */}
        <header className="md:hidden bg-white h-16 border-b flex items-center px-4 justify-between">
           <span className="font-bold text-gray-800">EletroPro</span>
           <button onClick={handleLogout} className="text-sm text-red-600">Sair</button>
        </header>

        {/* Conteúdo das páginas (Children) */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}