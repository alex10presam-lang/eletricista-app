// src/app/dashboard/budgets/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clientService } from '@/services/clientService'
import { budgetService } from '@/services/budgetService' // Certifica-te que criaste este serviço no passo anterior

export default function NewBudgetPage() {
  const router = useRouter()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dados do formulário
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    total_value: '',
    status: 'Em Aberto'
  })

  // 1. Carregar clientes assim que a página abre
  useEffect(() => {
    async function loadClients() {
      try {
        const data = await clientService.getClients()
        setClients(data)
      } catch (error) {
        alert('Erro ao carregar clientes.')
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  // 2. Enviar o formulário
  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.client_id) {
      alert('Por favor, selecione um cliente.')
      return
    }

    setSubmitting(true)
    try {
      await budgetService.addBudget({
        ...formData,
        total_value: parseFloat(formData.total_value) // Garante que é número
      })
      router.push('/dashboard/budgets') // Volta para a lista
    } catch (error) {
      alert('Erro ao criar orçamento: ' + error.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center">A carregar formulário...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Novo Orçamento</h1>
        
        {clients.length === 0 ? (
          <div className="text-center p-4 bg-yellow-50 text-yellow-800 rounded">
            <p>Não tens clientes registados.</p>
            <a href="/dashboard/clients" className="font-bold underline">Cria um cliente primeiro.</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seleção de Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <select
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Título do Serviço */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Título do Serviço</label>
              <input
                type="text"
                required
                placeholder="Ex: Instalação Elétrica Completa"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Total (R$)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.total_value}
                onChange={(e) => setFormData({...formData, total_value: e.target.value})}
              />
            </div>

            {/* Descrição Detalhada */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Detalhes / Descrição</label>
              <textarea
                rows="4"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                placeholder="Descreva o que será feito..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'A guardar...' : 'Salvar Orçamento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}