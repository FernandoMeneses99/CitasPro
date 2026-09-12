import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Citas Pro — Agenda inteligente para profesionales",
    template: "%s · Citas Pro",
  },
  description:
    "La plataforma SaaS para psicólogos, médicos, barberos, esteticistas y profesionales independientes. Gestiona tu agenda, clientes y reservas en un solo lugar.",
  keywords: [
    "agenda digital",
    "gestión de citas",
    "reservas online",
    "SaaS",
    "Citas Pro",
    "profesionales independientes",
  ],
  openGraph: {
    siteName: "Citas Pro",
    type: "website",
    locale: "es_CO",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}