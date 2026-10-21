# Arquitetura e limites

## Android com funcionamento local

A versão inicial prioriza um profissional e um aparelho. Não exige cadastro,
não contém credenciais e não depende do banco usado no protótipo antigo.
Next.js exporta os recursos estáticos para `out/`; o Capacitor os incorpora no APK.
Clientes e propostas ficam em IndexedDB, no contexto privado do WebView.

A interface também pode ser aberta no navegador para demonstração. Não existe
service worker ou promessa de abertura offline de uma URL web: essa garantia é
do APK, que inclui seus próprios recursos. Não há sincronização entre aparelhos.

## Integridade

- Toda gravação passa por comandos de domínio e validação de esquema.
- Valores são inteiros em centavos. Quantidades usam milésimos; o arredondamento
  acontece em cada linha antes da soma.
- Uma transação obtém o estado atual, atribui o número da proposta e grava o
  resultado. Não existem gravações otimistas na interface.
- Timestamps monotônicos identificam edições desatualizadas, inclusive quando
  duas operações chegam no mesmo milissegundo. Exclusões também conferem a versão.
- Propostas guardam cópias dos contatos e preços. Alterar o cadastro ou catálogo
  não modifica propostas existentes. Uma proposta enviada deve ser duplicada
  para que seu conteúdo seja alterado.
- Clientes com vínculos não podem ser excluídos. Uma proposta só origina um trabalho.
- Proposta: rascunho → enviada → aprovada/recusada. Trabalho: agendado → em execução
  → concluído; cancelamento é permitido antes da conclusão.
- Restaurar backup é uma transação com conferência da revisão atual. A restauração
  invalida os timestamps de formulários abertos em outras janelas.

## Backups e limites

O formato possui versão, tipo do espaço, data, checksum e dados. A leitura confere
tamanho, JSON, checksum, contratos, identificadores únicos, sequência e vínculos
antes da confirmação de restauração. Falhas abortam a transação. Demonstração e
espaço pessoal não importam os backups um do outro.

O limite é 10 MiB por backup, 10 mil registros por coleção, 100 itens por proposta,
1.000 unidades por item e R$ 1 milhão de preço unitário. O subtotal não ultrapassa
R$ 10 milhões. Datas aceitas: 2000 a 2100. São limites de aplicação, não uma regra
comercial universal.

## Integrações nativas

O compartilhamento usa arquivos temporários em `cache/exports`, autorizados por
FileProvider somente nesse diretório. Não são solicitadas permissões amplas para
armazenamento, contatos, localização, câmera ou notificações. O botão voltar do
Android fecha o diálogo superior, retorna ao início ou minimiza o aplicativo.

A assinatura de testes não é uma chave de publicação. Chaves privadas de lançamento
não devem entrar no repositório. O manifesto desabilita backup automático; a
transferência de dados é feita explicitamente pela exportação.

## Evolução

Sincronização, equipes, recuperação de conta, alarmes e pagamentos precisam de
contratos e infraestrutura próprios. A camada de domínio pode ser reutilizada,
mas colocar um login sobre o armazenamento local não implementa isolamento entre
contas. Essa mudança exige migração, permissões e testes de conflito.
