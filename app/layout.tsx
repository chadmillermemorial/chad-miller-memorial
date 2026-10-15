import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chadmillermemorial.org"),

  title: {
    default: "CSM Chad Miller Memorial Golf Tournament",
    template: "%s | CSM Chad Miller Memorial",
  },

  description:
    "Celebrating our successful 2026 inaugural outing honoring CSM Chad Miller and supporting The Honor Foundation. Coming in 2027: Kings Grant in Fayetteville, NC.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "/",
    siteName: "CSM Chad Miller Memorial Golf Tournament",
    title: "CSM Chad Miller Memorial Golf Tournament",
    description:
      "Thank you for an incredible 2026 inaugural tournament. Looking ahead to 2027 at Kings Grant in Fayetteville, NC.",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "CSM Chad Miller Memorial Golf Tournament",
    description:
      "2026 Inaugural: thank you. Coming in 2027: Kings Grant · Fayetteville, NC.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${playfair.variable}`}
    >
      <body className="flex min-h-screen flex-col font-[family-name:var(--font-sans)] antialiased">
        <Navbar />

        <div className="flex-1">{children}</div>

        <Footer />
      </body>
    </html>
  );
}