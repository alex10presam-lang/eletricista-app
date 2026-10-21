import { AppState, emptyState, today } from '../domain/model';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export function demoState(): AppState {
  const now = new Date().toISOString();
  const state = emptyState();
  state.profile = {
    businessName: 'Circuito Serviços Elétricos',
    name: 'Alex Demo',
    phone: '',
    email: '',
    address: 'Manaus · AM',
    document: '',
  };
  state.clients = [
    {
      id: id(1),
      name: 'Marina Costa · exemplo',
      phone: '',
      email: '',
      address: 'Residencial Ipê · endereço fictício',
      notes: 'Reforma da cozinha. Dados fictícios.',
      updatedAt: now,
    },
    {
      id: id(2),
      name: 'Oficina Norte · exemplo',
      phone: '',
      email: '',
      address: 'Distrito Industrial · endereço fictício',
      notes: 'Manutenção preventiva. Dados fictícios.',
      updatedAt: now,
    },
    {
      id: id(3),
      name: 'Rafael Lima · exemplo',
      phone: '',
      email: '',
      address: 'Centro · endereço fictício',
      notes: '',
      updatedAt: now,
    },
  ];
  state.catalog = [
    {
      id: id(11),
      name: 'Instalação de tomada',
      kind: 'labor',
      unit: 'ponto',
      priceCents: 8500,
      updatedAt: now,
    },
    {
      id: id(12),
      name: 'Revisão de quadro elétrico',
      kind: 'labor',
      unit: 'un',
      priceCents: 28000,
      updatedAt: now,
    },
    {
      id: id(13),
      name: 'Passagem de cabos',
      kind: 'labor',
      unit: 'm',
      priceCents: 1200,
      updatedAt: now,
    },
    {
      id: id(14),
      name: 'Cabo flexível 2,5 mm²',
      kind: 'material',
      unit: 'm',
      priceCents: 380,
      updatedAt: now,
    },
    {
      id: id(15),
      name: 'Tomada 2P+T 20 A',
      kind: 'material',
      unit: 'un',
      priceCents: 2450,
      updatedAt: now,
    },
  ];
  state.quotes = [
    {
      id: id(21),
      number: 1,
      clientId: id(1),
      clientSnapshot: state.clients[0],
      title: 'Novos pontos da cozinha',
      date: today(),
      validityDays: 15,
      discountCents: 2000,
      items: [
        {
          id: id(31),
          name: 'Instalação de tomada',
          kind: 'labor',
          unit: 'ponto',
          quantityMilli: 4000,
          priceCents: 8500,
        },
        {
          id: id(32),
          name: 'Cabo flexível 2,5 mm²',
          kind: 'material',
          unit: 'm',
          quantityMilli: 30000,
          priceCents: 380,
        },
        {
          id: id(33),
          name: 'Tomada 2P+T 20 A',
          kind: 'material',
          unit: 'un',
          quantityMilli: 4000,
          priceCents: 2450,
        },
      ],
      notes: 'Execução mediante aprovação. Valores e dados ilustrativos.',
      status: 'approved',
      updatedAt: now,
    },
    {
      id: id(22),
      number: 2,
      clientId: id(2),
      clientSnapshot: state.clients[1],
      title: 'Revisão preventiva da oficina',
      date: today(),
      validityDays: 15,
      discountCents: 0,
      items: [
        {
          id: id(34),
          name: 'Revisão de quadro elétrico',
          kind: 'labor',
          unit: 'un',
          quantityMilli: 1000,
          priceCents: 28000,
        },
      ],
      notes: 'Exemplo de orçamento aguardando resposta.',
      status: 'sent',
      updatedAt: now,
    },
  ];
  // Snapshots guardam somente os dados de contato previstos no contrato.
  state.quotes = state.quotes.map((q) => ({
    ...q,
    clientSnapshot: {
      name: q.clientSnapshot.name,
      phone: '',
      email: '',
      address: q.clientSnapshot.address,
    },
  }));
  state.jobs = [
    {
      id: id(41),
      quoteId: id(21),
      clientId: id(1),
      clientSnapshot: state.quotes[0].clientSnapshot,
      title: 'Novos pontos da cozinha',
      date: today(),
      time: '09:00',
      status: 'scheduled',
      notes: 'Confirmar acesso ao imóvel. Registro fictício.',
      updatedAt: now,
    },
  ];
  state.nextNumber = 3;
  return state;
}
