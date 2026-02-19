// src/app/dashboard/budgets/page.js
'use client'

import { useState, useEffect } from 'react'
import { budgetService } from '@/services/budgetService'
import Link from 'next/link'
import { generatePDF } from '@/lib/pdfGenerator'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudgets()
  }, [])

  async function loadBudgets() {
    try {
      const data = await budgetService.getBudgets()
      setBudgets(data)
    } catch (error) {
      alert('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este orçamento?')) return
    await budgetService.deleteBudget(id)
    loadBudgets()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <div className="space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Voltar</Link>
            <Link 
              href="/dashboard/budgets/new" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Novo Orçamento
            </Link>
          </div>
        </div>

        {loading ? <p>Carregando...</p> : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center">Nenhum orçamento encontrado.</td></tr>
                ) : (
                  budgets.map((budget) => (
                    <tr key={budget.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{budget.clients?.name}</td>
                      <td className="px-6 py-4 text-gray-500">{budget.title}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold">
                        {Number(budget.total_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          {budget.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {/* Botão PDF */}
                        <button 
                          onClick={() => generatePDF(budget)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                          title="Baixar PDF"
                        >
                          📄 PDF
                        </button>

                        {/* Botão Excluir */}
                        <button 
                          onClick={() => handleDelete(budget.id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                        <button onClick={() => handleDelete(budget.id)} className="text-red-600 hover:text-red-900">Excluir</button>
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