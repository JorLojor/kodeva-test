import type { Metadata } from "next";
import { Showcase } from "./Showcase";
import "./showcase.css";

export const metadata: Metadata = { title: "Components" };

export default function ComponentsPage() {
	return (
		<section className="ui-showcase">
			<p className="eyebrow">SHARED UI</p>
			<h1>Komponen jorTemplate.</h1>
			<p className="intro">Komponen yang sama untuk web dan dashboard.</p>
			<Showcase />
		</section>
	);
}
