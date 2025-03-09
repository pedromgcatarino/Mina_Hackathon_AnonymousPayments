import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

export const metadata: Metadata = {
  title: "Anonymous Payment System",
  description: "Deposit and send MINA anonymously on the Devnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
