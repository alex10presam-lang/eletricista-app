import { jsPDF } from 'jspdf';
import {
  Quote,
  Profile,
  quoteSchema,
  profileSchema,
  totals,
  money,
  displayDate,
  quoteNumber,
  quantityInput,
} from '../domain/model';

export function buildQuotePDF(input: Quote, professional: Profile, demo = false) {
  const quote = quoteSchema.parse(input);
  const profile = profileSchema.parse(professional);
  const total = totals(quote);
  const pdf = new jsPDF();
  let y = 0;
  const header = () => {
    pdf.setFillColor(16, 47, 44);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(221, 242, 107);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(21);
    pdf.text('EletroPro', 16, 19);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text(quoteNumber(quote.number), 194, 18, { align: 'right' });
    pdf.text(`Orçamento de serviços${demo ? ' - DEMONSTRAÇÃO' : ''}`, 16, 30);
    y = 51;
  };
  const ensure = (height: number) => {
    if (y + height > 272) {
      pdf.addPage();
      header();
    }
  };
  const text = (value: string, bold = false, size = 10) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(30, 48, 45);
    const lines = pdf.splitTextToSize(value, 178) as string[];
    for (const line of lines) {
      ensure(6);
      pdf.text(line, 16, y);
      y += 5.5;
    }
    y += 2;
  };
  header();
  text(profile.businessName || profile.name || 'Profissional autônomo', true, 13);
  for (const detail of [
    profile.name,
    profile.document,
    profile.phone,
    profile.email,
    profile.address,
  ])
    if (detail) text(detail);
  y += 3;
  text(quote.title, true, 14);
  text(`Cliente: ${quote.clientSnapshot.name}`, true);
  if (quote.clientSnapshot.address) text(quote.clientSnapshot.address);
  for (const contact of [quote.clientSnapshot.phone, quote.clientSnapshot.email])
    if (contact) text(contact);
  text(
    `Emissão: ${displayDate(quote.date)} | Validade: ${quote.validityDays} dias a partir da emissão`,
  );
  y += 4;
  for (const item of quote.items) {
    ensure(19);
    text(item.name, true);
    text(
      `${item.kind === 'labor' ? 'Mão de obra' : 'Material'} | ${quantityInput(item.quantityMilli)} ${item.unit} x ${money(item.priceCents)} = ${money(Math.round((item.quantityMilli * item.priceCents) / 1000))}`,
    );
    pdf.setDrawColor(220, 227, 222);
    pdf.line(16, y, 194, y);
    y += 6;
  }
  ensure(37);
  text(`Mão de obra: ${money(total.labor)}`);
  text(`Materiais: ${money(total.material)}`);
  if (quote.discountCents) text(`Desconto: ${money(quote.discountCents)}`);
  text(`TOTAL: ${money(total.total)}`, true, 15);
  if (quote.notes) {
    y += 4;
    text('Condições e observações', true);
    text(quote.notes);
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 110, 105);
    pdf.text('Proposta sujeita à aprovação do cliente. Documento gerado no EletroPro.', 16, 285);
    pdf.text(`${i}/${pages}`, 194, 285, { align: 'right' });
  }
  return pdf;
}
