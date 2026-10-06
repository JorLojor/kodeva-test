import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "@jortemplate/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "jorTemplate", template: "%s | jorTemplate" },
  description: "Starter monorepo template",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            jorTemplate Lp<span>.</span>
          </Link>
          <nav aria-label="Navigasi utama">
            <Link href="/">Home</Link>
            <Link href="/components">Components</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
