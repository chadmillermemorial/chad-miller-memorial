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
    "Honor Command Sergeant Major Chad Miller at the CSM Chad Miller Memorial Golf Tournament on October 9, 2026, at Hyland Golf Course in Southern Pines, North Carolina, supporting The Honor Foundation.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "/",
    siteName: "CSM Chad Miller Memorial Golf Tournament",
    title: "CSM Chad Miller Memorial Golf Tournament",
    description:
      "Join us October 9, 2026, at Hyland Golf Course in Southern Pines, NC, to honor Command Sergeant Major Chad Miller and support The Honor Foundation.",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "CSM Chad Miller Memorial Golf Tournament",
    description:
      "October 9, 2026 · Hyland Golf Course · Southern Pines, NC · Supporting The Honor Foundation.",
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