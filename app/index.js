// pages/index.js
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Home Page - Your Site Title</title>
        <meta property="og:title" content="Home Page - Your Site Title" />
        <meta property="og:description" content="Description of your home page" />
        <meta property="og:image" content="https://example.com/home-page-image.jpg" />
        <meta property="og:url" content="https://edith3141.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Home Page - Your Site Title" />
        <meta name="twitter:description" content="Description of your home page" />
        <meta name="twitter:image" content="https://example.com/home-page-image.jpg" />
      </Head>
      <div>
        {/* Your page content */}
      </div>
    </>
  );
}
