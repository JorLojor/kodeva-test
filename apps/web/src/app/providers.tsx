"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, Suspense, useState } from "react";
import { CartProvider } from "@/features/marketplace/CartProvider";
import { MarketingCapture } from "./MarketingCapture";

export function Providers({ children }: { children: ReactNode }) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: { staleTime: 60_000, retry: 1 },
					mutations: { retry: false },
				},
			}),
	);
	return (
		<QueryClientProvider client={client}>
			<Suspense fallback={null}>
				<MarketingCapture />
			</Suspense>
			<CartProvider>{children}</CartProvider>
		</QueryClientProvider>
	);
}
