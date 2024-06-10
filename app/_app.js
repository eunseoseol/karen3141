// _app.js
import '../styles/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta property="og:title" content="Your Site Title" />
        <meta property="og:description" content="Your site description" />
        <meta property="og:image" content="https://example.com/your-image.jpg" />
        <meta property="og:url" content="https://edith3141.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Site Title" />
        <meta name="twitter:description" content="Your site description" />
        <meta name="twitter:image" content="https://example.com/your-image.jpg" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
