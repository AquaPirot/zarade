import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="sr">
      <Head>
        <meta name="description" content="Sistem za obračun gotovinske zarade zaposlenih by AG GROUP" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#10b981" />
        <title>ZARADE - Obračun Gotovinske Zarade</title>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}