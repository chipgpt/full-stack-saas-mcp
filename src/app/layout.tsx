import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import Providers from './_components/Providers';
import './globals.css';
import Script from 'next/script';

const montserrat = Montserrat({ subsets: ['latin'] });

const NAME = 'ChipGPT';
const TITLE = 'ChipGPT | Example Full Stack SaaS + MCP';
const TITLE_TEMPLATE = '%s | ChipGPT';
const DESCRIPTION =
  'I have been a software developer working on SaaS platforms for over 15 years. This example project compresses my years of knowledge into a fully functional Software as a Service platform that can be deployed to AWS using IaC and GitHub CI/CD. I hope that this will help some up and coming SaaS entrepreneurs build a production ready platform from end to end.';

export const metadata: Metadata = {
  metadataBase: new URL('https://chipgpt.biz'),
  title: {
    default: TITLE,
    template: TITLE_TEMPLATE,
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: NAME,
    title: {
      default: TITLE,
      template: TITLE_TEMPLATE,
    },
    description: DESCRIPTION,
    url: 'https://chipgpt.biz',
    images: `/favicon.png`,
  },
  twitter: {
    card: 'summary',
    title: {
      default: TITLE,
      template: TITLE_TEMPLATE,
    },
    description: DESCRIPTION,
  },
  icons: [
    {
      rel: 'icon',
      url: `/favicon.png`,
    },
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://chipgpt.biz',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <html lang="en" className="min-h-[100%] flex flex-col">
        <body className={`${montserrat.className} bg-gray-50 text-gray-800`}>
          <noscript>You need to enable JavaScript to run this app.</noscript>

          <Script
            id="product-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'ChipGPT',
                alternateName:
                  'ChipGPT | Example Full Stack SaaS + MCP',
                description:
                  'I have been a software developer working on SaaS platforms for over 15 years. This example project compresses my years of knowledge into a fully functional Software as a Service platform that can be deployed to AWS using IaC and GitHub CI/CD. I hope that this will help some up and coming SaaS entrepreneurs build a production ready platform from end to end.',
                image: 'https://chipgpt.biz/chipgpt-logo.png',
                brand: {
                  '@type': 'Brand',
                  name: 'ChipGPT',
                },
                url: 'https://chipgpt.biz',
                offers: {
                  '@type': 'Offer',
                  url: 'https://chipgpt.biz',
                  priceCurrency: 'USD',
                  price: '0',
                  availability: 'https://schema.org/PreOrder',
                  itemCondition: 'https://schema.org/NewCondition',
                },
              }),
            }}
            strategy="beforeInteractive"
          />
          <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'ChipGPT',
                alternateName:
                  'ChipGPT | Example Full Stack SaaS + MCP',
                url: 'https://chipgpt.biz',
                logo: 'https://chipgpt.biz/chipgpt-logo.png',
                sameAs: [],
                founder: {
                  '@type': 'Person',
                  name: 'ChipGPT',
                },
              }),
            }}
            strategy="beforeInteractive"
          />

          <main>{children}</main>
        </body>
      </html>
    </Providers>
  );
}