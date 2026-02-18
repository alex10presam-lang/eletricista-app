// src/app/dashboard/clients/page.js
'use client'

import { useState, useEffect } from 'react'
import { clientService } from '@/services/clientService'
import Link from 'next/link'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Busca os clientes ao carregar a página
  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const data = await clientService.getClients()
      setClients(data)
    } catch (error) {
      alert('Erro ao carregar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await clientService.addClient(formData)
      setFormData({ name: '', phone: '', email: '' }) // Limpa o formulário
      loadClients() // Recarrega a lista
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    try {
      await clientService.deleteClient(id)
      setClients(clients.filter(client => client.id !== id))
    } catch (error) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho com botão de voltar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            &larr; Voltar ao Painel
          </Link>
        </div>

        {/* Formulário de Cadastro */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Novo Cliente</h2>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Nome do Cliente"
              required
              className="border p-2 rounded flex-1"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Telefone/WhatsApp"
              className="border p-2 rounded flex-1"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </div>

        {/* Lista de Clientes */}
        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      Nenhum cliente cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{client.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}