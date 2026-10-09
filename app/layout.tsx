import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { RevealObserver } from "@/components/RevealObserver";
import { SITE } from "@/lib/config";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
// Departure Mono (OFL) — self-hosted; not on Google Fonts.
const mono = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  weight: "400",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: "%s — OpenWM" },
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    siteName: "OpenWM",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "OpenWM" }],
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description, images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`no-js ${instrument.variable} ${inter.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.remove('no-js')" }} />
      </head>
      <body>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
