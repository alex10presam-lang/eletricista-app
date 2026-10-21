# EletroPro

**O escritório de campo de quem trabalha com elétrica.**

[![Validação Android](https://github.com/alex10presam-lang/eletricista-app/actions/workflows/validacao.yml/badge.svg?branch=main)](https://github.com/alex10presam-lang/eletricista-app/actions/workflows/validacao.yml)
[![Android 7.0+](https://img.shields.io/badge/Android-7.0%2B-174B3A)](https://github.com/alex10presam-lang/eletricista-app/releases/tag/v1.0.0)

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

**[Baixar EletroPro 1.0.0 para Android](https://github.com/alex10presam-lang/eletricista-app/releases/download/v1.0.0/EletroPro-1.0.0-debug.apk)**

O **APK de testes** é compatível com Android 7.0 ou superior e Android System
WebView atualizado. A [página da versão](https://github.com/alex10presam-lang/eletricista-app/releases/tag/v1.0.0)
inclui as notas da entrega e a soma SHA-256 para conferir o download.
Ao compilar localmente, o arquivo fica em `artifacts/EletroPro-1.0.0-debug.apk`.
As execuções aprovadas do GitHub Actions também disponibilizam o artefato
`EletroPro-android-debug` para cada compilação.

Na primeira abertura, escolha **Explorar demonstração** ou **Começar meu espaço**.
Os exemplos usam dados e preços fictícios. Nenhuma conta ou chave do Supabase é necessária.

Para conhecer o fluxo, abra um orçamento da demonstração, gere o PDF e acompanhe
o trabalho vinculado na agenda. Depois, escolha **Usar meus dados** para começar
um espaço vazio. Os dois espaços têm armazenamento separado.

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

## Qualidade verificada

- 35 testes automatizados de regras, armazenamento, backups e documentos PDF.
- 11 cenários de interface em tamanho de celular, incluindo o isolamento da demonstração.
- Verificação de tipos, lint, compilação estática e compilação/lint Android na integração contínua.
- APK conferido em emulador Android 16: abertura, PDF, compartilhamento nativo e persistência após reabertura sem rede.

Os testes cobrem os fluxos descritos; a conferência em aparelhos físicos e nos
aplicativos de destino continua sendo parte da validação antes de uso profissional.

## Dados e privacidade

Os registros ficam no armazenamento privado do aplicativo. Não há sincronização
em nuvem nesta versão. Desinstalar, limpar o armazenamento ou perder o aparelho
pode remover os dados; mantenha cópias de backup fora dele.

O backup é um JSON legível com contatos e propostas. A verificação SHA-256 detecta
alterações acidentais; não criptografa o conteúdo nem comprova a autoria. PDFs e
backups só saem do aplicativo quando você usa a exportação/compartilhamento e
escolhe o destino. Não use dados reais nas demonstrações do portfólio.
