import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TalentBridge — Competências comprovadas para tecnologia",
  description:
    "Plataforma de recrutamento e desenvolvimento profissional que usa IA para analisar currículos, gerar avaliações personalizadas e apoiar decisões de contratação.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${sourceSerif.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
