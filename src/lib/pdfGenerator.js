// src/lib/pdfGenerator.js
import jsPDF from 'jspdf'

export const generatePDF = (budget) => {
  const doc = new jsPDF()

  // --- CABEÇALHO ---
  doc.setFillColor(41, 98, 255) // Azul
  doc.rect(0, 0, 210, 40, 'F') // Retângulo azul no topo
  
  doc.setTextColor(255, 255, 255) // Texto Branco
  doc.setFontSize(22)
  doc.text("ORÇAMENTO DE SERVIÇOS", 20, 25)
  
  doc.setFontSize(12)
  doc.text("Eletricista Profissional", 20, 35)

  // --- DADOS DO CLIENTE ---
  doc.setTextColor(0, 0, 0) // Texto Preto
  doc.setFontSize(12)
  doc.text(`Cliente: ${budget.clients?.name || 'N/A'}`, 20, 60)
  doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 150, 60)

  // --- DADOS DO SERVIÇO ---
  doc.setLineWidth(0.5)
  doc.line(20, 70, 190, 70) // Linha divisória

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(budget.title, 20, 85)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  
  // Quebra o texto da descrição para não sair da folha
  const splitDescription = doc.splitTextToSize(budget.description || '', 170)
  doc.text(splitDescription, 20, 95)

  // --- VALOR ---
  let finalY = 95 + (splitDescription.length * 7) + 20
  
  doc.line(20, finalY, 190, finalY) // Linha divisória
  
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(`Valor Total: R$ ${Number(budget.total_value).toFixed(2)}`, 130, finalY + 15)

  // --- RODAPÉ ---
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text("Orçamento válido por 15 dias.", 20, 280)

  // Salva o arquivo
  doc.save(`orcamento_${budget.clients?.name || 'cliente'}.pdf`)
}