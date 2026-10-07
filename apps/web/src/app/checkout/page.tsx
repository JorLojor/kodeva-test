import type { Metadata } from "next";
import { Checkout } from "@/features/marketplace/ManualCheckout";
export const metadata: Metadata = { title: "Checkout" };
export default function Page() {
	return <Checkout />;
}
