import type { Metadata } from "next";
import { Showcase } from "./Showcase";

export const metadata: Metadata = { title: "Components" };

export default function ComponentsPage() {
	return (
		<section className="py-16 [&>h1]:text-[clamp(32px,5vw,52px)] [&>h1]:tracking-[-2px]">
			<p className="mb-[22px] text-[11px] font-bold tracking-[2px] leading-[1.6] text-accent">
				SHARED UI
			</p>
			<h1 className="mb-7 text-[clamp(40px,5.7vw,68px)] leading-[1.05] font-semibold tracking-[-2.8px] wrap-anywhere max-[760px]:tracking-[-1.8px]">
				Komponen Kodeva.
			</h1>
			<p className="my-[1em] max-w-[600px] text-lg leading-[1.7] text-muted">
				Komponen yang sama untuk web dan dashboard.
			</p>
			<Showcase />
		</section>
	);
}
