import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import './globals.css';

export const metadata = {
  title: 'EletroPro · Seu escritório de campo',
  description:
    'Clientes, orçamentos e agenda para profissionais da elétrica. Funciona sem internet.',
  icons: { icon: '/icon.svg' },
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#102f2c',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
