import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Center — Pro Touch Construction",
  description: "AI-powered business automation for construction companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
