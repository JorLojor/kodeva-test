import type { Metadata } from "next";
import { CartPage } from "@/features/marketplace/Marketplace";
export const metadata: Metadata = { title: "Keranjang" };
export default function Page() {
	return <CartPage />;
}
