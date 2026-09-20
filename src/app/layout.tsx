import { Source_Sans_3, Source_Code_Pro } from "next/font/google";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProgressProvider } from "@/components/ProgressProvider";
import { site } from "@/lib/site";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = Source_Code_Pro({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "AI agents",
    "autonomous agents",
    "ReAct",
    "RAG",
    "LLM tutorial",
    "Python for AI",
    "multi-agent systems",
    "function calling",
    "Joeven",
  ],
  authors: [{ name: "Joeven" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.domain,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  alternates: { canonical: site.domain },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <ProgressProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </ProgressProvider>
      </body>
    </html>
  );
}
