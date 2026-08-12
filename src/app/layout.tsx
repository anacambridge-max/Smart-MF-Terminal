import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart MF Terminal — Mutual Fund Opportunity Dashboard",
  description: "Professional institutional-grade mutual fund opportunity scanner and portfolio dashboard for Indian investors.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-terminal-bg text-terminal-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
