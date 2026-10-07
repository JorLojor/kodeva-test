import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CartLink } from "@/features/marketplace/Marketplace";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
	title: { default: "Kodeva", template: "%s | Kodeva" },
	description: "Temukan informasi terbaru dan hubungi tim kami.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			className="scheme-light scroll-smooth motion-reduce:scroll-auto"
			lang="id"
			data-scroll-behavior="smooth"
		>
			<body className="m-0 bg-paper font-sans leading-normal text-ink">
				<Providers>
					<header className="mx-auto w-[min(1180px,calc(100%-64px))] max-[760px]:w-[calc(100%-40px)] flex min-h-24 items-center justify-between gap-6 border-b border-line max-[760px]:min-h-20 max-[760px]:flex-wrap max-[760px]:gap-4 max-[760px]:py-4">
						<Link
							className="text-[28px] font-extrabold tracking-[-1.5px] [&_span]:text-accent focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-5"
							href="/"
						>
							Kodeva<span>.</span>
						</Link>
						<nav
							className="flex flex-wrap gap-7 text-sm max-[760px]:w-full max-[760px]:gap-[18px] max-[760px]:text-[13px] [&_a:hover]:text-accent [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-focus [&_a:focus-visible]:outline-offset-5"
							aria-label="Navigasi utama"
						>
							<Link href="/">Home</Link>
							<Link href="/products">Marketplace</Link>
							<Link href="/blog">Blog</Link>
							<CartLink />
						</nav>
					</header>
					<main className="mx-auto w-[min(1180px,calc(100%-64px))] max-[760px]:w-[calc(100%-40px)] min-h-[calc(100vh-190px)]">
						{children}
					</main>
					<footer className="mx-auto w-[min(1180px,calc(100%-64px))] max-[760px]:w-[calc(100%-40px)] flex min-h-[94px] items-center justify-between gap-6 border-t border-line text-xs text-muted max-[760px]:min-h-20">
						<span className="text-[17px] font-bold tracking-[-0.5px] text-ink">
							Kodeva.
						</span>
						<span>© {new Date().getFullYear()} Kodeva</span>
					</footer>
				</Providers>
			</body>
		</html>
	);
}
