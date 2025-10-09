import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeriCred+ | Revolutionizing Digital Credentials",
  description: "Delegated, tamper-proof credential management with AI oversight. Built on MetaMask Smart Accounts, Monad blockchain, and powered by Envio indexing.",
  keywords: ["blockchain", "credentials", "NFT", "MetaMask", "Monad", "Envio", "AI", "fraud detection"],
  authors: [{ name: "VeriCred+ Team" }],
  openGraph: {
    title: "VeriCred+ | Revolutionizing Digital Credentials",
    description: "AI-powered credential management with instant verification and fraud detection",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
