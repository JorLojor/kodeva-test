import type { Metadata } from "next";
import { Catalog } from "@/features/marketplace/Marketplace";
export const metadata: Metadata = { title: "Marketplace" };
export default function Page() {
	return <Catalog />;
}
