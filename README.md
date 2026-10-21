# EletroPro

**O escritório de campo de quem trabalha com elétrica.**

Aplicativo Android para organizar clientes, preparar orçamentos e acompanhar
trabalhos sem depender de conexão. Projeto pessoal desenvolvido por
[Alexandre](https://github.com/alex10presam-lang), com uma demonstração separada
dos dados pessoais para explorar os fluxos com segurança.

<p align="center">
  <img src="docs/images/inicio-mobile.png" width="280" alt="Tela inicial do EletroPro com resumo e acesso rápido ao orçamento" />
  <img src="docs/images/orcamentos-mobile.png" width="280" alt="Lista de orçamentos com status e valores" />
</p>

## O que é possível fazer

- Cadastrar, editar, pesquisar e excluir clientes, preservando vínculos existentes.
- Manter um catálogo próprio de materiais e serviços, com unidade e preço de referência.
- Criar propostas com quantidades fracionárias, materiais, mão de obra e desconto.
- Gerar e compartilhar um PDF com identificação profissional, condições e paginação.
- Registrar propostas como rascunho, enviada, aprovada ou recusada.
- Duplicar propostas para negociar uma nova versão sem alterar o documento anterior.
- Transformar propostas aprovadas em trabalhos agendados e acompanhar sua execução.
- Exportar e restaurar backups validados, com confirmação antes de substituir registros.

O registro de envio/aprovação é manual. O aplicativo não envia mensagens automaticamente,
não oferece aceite eletrônico e a agenda não dispara alarmes.

## Experimentar no Android

O projeto gera um **APK de testes**, compatível com Android 7.0 ou superior e
Android System WebView atualizado. Após uma execução aprovada da rotina Android
no GitHub Actions, baixe o artefato `EletroPro-android-debug` na aba **Actions**.
Ao compilar localmente, o arquivo fica em `artifacts/EletroPro-1.0.0-debug.apk`.

Na primeira abertura, escolha **Explorar demonstração** ou **Começar meu espaço**.
Os exemplos usam dados e preços fictícios. Nenhuma conta ou chave do Supabase é necessária.

Esse APK usa assinatura de depuração. A publicação em loja exige uma chave de
lançamento sob responsabilidade do proprietário. APKs de depuração gerados em
máquinas diferentes podem ter assinaturas diferentes; exporte seus dados antes
de qualquer reinstalação. Não desinstale uma versão com dados importantes sem backup.

## Rodar e verificar o projeto

Requer Node.js 22. Para compilar o Android, use JDK 21 e Android SDK 36.

```sh
npm ci
npm run dev
```

Abra `http://localhost:3000`. A versão de navegador serve para desenvolvimento e
demonstração; o APK inclui os arquivos estáticos e funciona sem rede desde a abertura.

```sh
npm run verify
npx playwright install chromium
npm run test:e2e
```

Para gerar o APK, configure `JAVA_HOME` e `ANDROID_HOME`, então execute:

```sh
npm run android:debug
```

O helper sincroniza a aplicação, compila e executa o lint Android. No Windows,
aplica os ajustes de socket Java e caminho com acentos somente ao processo de
compilação. Nenhuma configuração permanente do sistema é alterada.

## Decisões de implementação

| Parte            | Responsabilidade                                                          |
| ---------------- | ------------------------------------------------------------------------- |
| `src/domain`     | Contratos Zod, valores em centavos, transições e integridade dos vínculos |
| `src/data`       | Transações IndexedDB, restauração e espaços pessoal/demonstração          |
| `src/components` | Telas móveis, formulários, navegação e diálogos acessíveis                |
| `src/lib`        | PDF e exportação/compartilhamento com os recursos nativos                 |
| `android`        | Aplicação Android e configurações do Capacitor                            |
| `tests`          | Regras, armazenamento, backups, PDFs e fluxos de interface                |

O Next.js gera uma aplicação estática embarcada pelo Capacitor. As fontes estão
incluídas no pacote; não há chamadas a um servidor para abrir as telas. A antiga
integração incompleta com Supabase foi substituída por um espaço local funcional.

Leia [arquitetura e limites](docs/arquitetura.md) e o
[roteiro de validação no Android](docs/validacao-android.md).

## Dados e privacidade

Os registros ficam no armazenamento privado do aplicativo. Não há sincronização
em nuvem nesta versão. Desinstalar, limpar o armazenamento ou perder o aparelho
pode remover os dados; mantenha cópias de backup fora dele.

O backup é um JSON legível com contatos e propostas. A verificação SHA-256 detecta
alterações acidentais; não criptografa o conteúdo nem comprova a autoria. PDFs e
backups só saem do aplicativo quando você usa a exportação/compartilhamento e
escolhe o destino. Não use dados reais nas demonstrações do portfólio.
