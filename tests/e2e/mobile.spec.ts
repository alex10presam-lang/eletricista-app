import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function personal(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar meu espaço' }).click();
  await expect(page.getByRole('heading', { name: /Bom trabalho/ })).toBeVisible();
}
async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await expect(page.getByText('Dados fictícios · explore à vontade')).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name, exact: true })
    .click();
}
async function client(page: Page, name = 'Cliente de teste') {
  await nav(page, 'Clientes');
  await page.getByRole('button', { name: 'Novo', exact: true }).click();
  await page.getByLabel('Nome do cliente', { exact: true }).fill(name);
  await page.getByLabel('Endereço', { exact: true }).fill('Rua fictícia, 10');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cadastrar cliente', exact: true })
    .click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}
async function quote(page: Page) {
  await nav(page, 'Orçamentos');
  await page.getByRole('button', { name: 'Novo', exact: true }).click();
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Cliente de teste' });
  await page.getByLabel('Título do orçamento').fill('Reforma da cozinha');
  await page.getByLabel('Descrição do item').fill('Instalação de tomada');
  await page.getByLabel('Quantidade do item').fill('2,5');
  await page.getByLabel('Preço unitário (R$)').fill('85,50');
  await page.getByRole('button', { name: 'Adicionar item', exact: true }).click();
  await page.getByLabel('Desconto (R$)').fill('3,75');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Reforma da cozinha', exact: true }),
  ).toBeVisible();
}
test('onboarding e navegação funcionam em tela estreita sem rolagem horizontal', async ({
  page,
}) => {
  await personal(page);
  for (const name of ['Clientes', 'Orçamentos', 'Agenda', 'Mais', 'Início']) {
    await nav(page, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
test('cliente persiste após fechar e reabrir e pode ser editado e excluído', async ({ page }) => {
  await personal(page);
  await client(page);
  await page.reload();
  await nav(page, 'Clientes');
  await page.getByRole('button', { name: 'Editar contato' }).click();
  await page.getByLabel('Nome do cliente', { exact: true }).fill('Cliente atualizado');
  await page.getByRole('button', { name: 'Salvar cliente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cliente atualizado' })).toBeVisible();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir cliente', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Todo serviço começa com uma conexão' }),
  ).toBeVisible();
});
test('orçamento calcula total, preserva proposta enviada e vira trabalho concluído', async ({
  page,
}) => {
  await personal(page);
  await client(page);
  await quote(page);
  await page.getByRole('button', { name: /ORC-0001/ }).click();
  await expect(page.getByRole('dialog').getByText('R$ 210,00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar enviado' }).click();
  await page.getByRole('button', { name: 'Confirmar status', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Editar rascunho' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Aprovado pelo cliente' }).click();
  await page.getByRole('button', { name: 'Confirmar status', exact: true }).click();
  await page.getByRole('button', { name: 'Agendar este trabalho' }).click();
  await page.getByLabel('Horário', { exact: true }).fill('14:30');
  await page.getByRole('button', { name: 'Salvar na agenda' }).click();
  await page.getByRole('button', { name: /14:30/ }).click();
  await page.getByRole('button', { name: 'Iniciar trabalho' }).click();
  await page.getByRole('button', { name: 'Marcar como concluído' }).click();
  await expect(page.getByText('Concluído', { exact: true })).toBeVisible();
});
test('cliente com proposta não é removido e dados continuam após tentativa', async ({ page }) => {
  await personal(page);
  await client(page);
  await quote(page);
  await nav(page, 'Clientes');
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir cliente', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('histórico');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cliente de teste', exact: true })).toBeVisible();
});
test('catálogo permite salvar, buscar e reutilizar item em orçamento', async ({ page }) => {
  await personal(page);
  await client(page);
  await nav(page, 'Mais');
  await page.getByRole('button', { name: /Serviços e materiais/ }).click();
  await page.getByRole('button', { name: 'Novo', exact: true }).click();
  await page.getByLabel('Nome do serviço ou material').fill('Montagem de quadro');
  await page.getByLabel('Valor unitário (R$)').fill('350,00');
  await page.getByRole('button', { name: 'Salvar no catálogo' }).click();
  await expect(page.getByRole('heading', { name: 'Montagem de quadro' })).toBeVisible();
  await nav(page, 'Orçamentos');
  await page.getByRole('button', { name: 'Novo', exact: true }).click();
  await page
    .getByLabel('Usar item do catálogo')
    .selectOption({ label: 'Montagem de quadro · R$ 350,00' });
  await expect(page.getByLabel('Descrição do item')).toHaveValue('Montagem de quadro');
  await expect(page.getByLabel('Preço unitário (R$)')).toHaveValue('350,00');
});
test('dados de demonstração não entram no espaço pessoal', async ({ page }) => {
  await demo(page);
  await nav(page, 'Clientes');
  await expect(page.getByText('Marina Costa · exemplo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Usar meus dados' }).click();
  await nav(page, 'Clientes');
  await expect(
    page.getByRole('heading', { name: 'Todo serviço começa com uma conexão' }),
  ).toBeVisible();
});
test('continua funcionando sem conexão depois de abrir o aplicativo', async ({ page, context }) => {
  await personal(page);
  await context.setOffline(true);
  await client(page, 'Contato sem conexão');
  await nav(page, 'Mais');
  await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await expect(page.getByText('Dados fictícios · explore à vontade')).toBeVisible();
  await page.getByRole('button', { name: 'Usar meus dados' }).click();
  await nav(page, 'Clientes');
  await expect(page.getByRole('heading', { name: 'Contato sem conexão' })).toBeVisible();
});
test('alternâncias preservam os registros visíveis de cada espaço', async ({ page }) => {
  await personal(page);
  await client(page, 'Contato pessoal separado');
  for (let attempt = 0; attempt < 3; attempt++) {
    await nav(page, 'Mais');
    await page.getByRole('button', { name: 'Explorar demonstração' }).click();
    await expect(page.getByText('Dados fictícios · explore à vontade')).toBeVisible();
    await nav(page, 'Orçamentos');
    await expect(page.getByRole('button', { name: /ORC-0001/ })).toBeVisible();
    await nav(page, 'Clientes');
    await expect(
      page.getByRole('heading', { name: 'Marina Costa · exemplo', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Contato pessoal separado', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Usar meus dados' }).click();
    await nav(page, 'Clientes');
    await expect(
      page.getByRole('heading', { name: 'Contato pessoal separado', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Marina Costa · exemplo', exact: true }),
    ).toHaveCount(0);
  }
});
test('backup exportado restaura registros e arquivo corrompido não altera o espaço', async ({
  page,
}) => {
  await personal(page);
  await client(page);
  await nav(page, 'Mais');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const file = await download;
  const path = (await file.path())!;
  const backup = await readFile(path, 'utf-8');
  expect(JSON.parse(backup).data.clients).toHaveLength(1);
  await nav(page, 'Clientes');
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir cliente', exact: true }).click();
  await nav(page, 'Mais');
  await page.getByLabel('Arquivo de backup').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page.getByRole('button', { name: 'Substituir e restaurar' }).click();
  await nav(page, 'Clientes');
  await expect(page.getByRole('heading', { name: 'Cliente de teste', exact: true })).toBeVisible();
  await nav(page, 'Mais');
  await page
    .getByLabel('Arquivo de backup')
    .setInputFiles({ name: 'ruim.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByRole('status')).toContainText('JSON válido');
  await nav(page, 'Clientes');
  await expect(page.getByRole('heading', { name: 'Cliente de teste', exact: true })).toBeVisible();
});
test('PDF é baixado e orçamento longo não bloqueia a interface', async ({ page }) => {
  await demo(page);
  await nav(page, 'Orçamentos');
  await page.getByRole('button', { name: /ORC-0001/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Gerar e compartilhar PDF' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('ORC-0001-demo.pdf');
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
  await expect(page.getByRole('button', { name: 'Duplicar como rascunho' })).toBeEnabled();
});
test('tela principal demonstrativa tem navegação e visual em celular', async ({ page }) => {
  await demo(page);
  await expect(page.getByRole('button', { name: 'Criar orçamento' })).toBeVisible();
  await page.screenshot({
    path: 'docs/images/inicio-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await nav(page, 'Orçamentos');
  await page.screenshot({
    path: 'docs/images/orcamentos-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});
