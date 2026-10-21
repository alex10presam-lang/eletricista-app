# Validação no Android

## Verificações automatizadas

```sh
npm run verify
npm run test:e2e
npm run android:debug
```

As suítes usam dados fictícios e cobrem valores fracionários, limites e datas,
edições concorrentes, snapshots, referências, estados, backups alterados e PDFs
com várias páginas. A interface é testada em criação/edição, proposta → trabalho,
restauração, isolamento da demonstração e operação sem conexão.

Para o smoke test nativo, instale o APK de depuração em um emulador, configure
`ANDROID_HOME` e execute `npm run test:android`. `ELETROPRO_DEVICE` escolhe o
emulador, com padrão `emulator-5554`. O script rejeita aparelhos físicos. Usa dados
fictícios, abre o compartilhamento e o fecha sem enviar para contatos. Também
desliga a rede do emulador e reabre o app para conferir a persistência.
Use um emulador descartável: os registros de teste permanecem nele. Capturas e
PDFs ficam em `artifacts/`, ignorada pelo Git.

## Conferência no próprio aparelho

1. Abra a demonstração e percorra as cinco abas, inclusive com teclado aberto.
2. No espaço pessoal, cadastre cliente e item de catálogo. Feche e reabra o app.
3. Crie proposta com materiais, mão de obra, quantidades fracionárias e desconto.
4. Abra o PDF em outro aplicativo e confira totais, acentos e páginas longas.
5. Compartilhe um documento de teste com um destino escolhido por você.
6. Registre envio e aprovação; agende, inicie e conclua um trabalho.
7. Exporte um backup e restaure-o após conferir o arquivo.
8. Repita sem Wi-Fi/dados móveis e confira o botão voltar do Android.

Emulador e navegador não substituem a conferência no aparelho do usuário,
especialmente para teclado, fabricante do WebView e aplicativos de destino.
