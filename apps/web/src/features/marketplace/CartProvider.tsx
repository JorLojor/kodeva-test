"use client";
import { useQuery } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { apiRequest } from "@/lib/api";
import { trackEcommerce } from "@/lib/marketing";
import {
	change,
	type Line,
	products,
	restore,
	type Store,
	storageKey,
} from "./model";

type CartContext = {
	store: Store;
	ready: boolean;
	error: string;
	setQuantity: (product: string, pack: string, n: number) => boolean;
	complete: (expected: Line[]) => boolean;
	busy: boolean;
	setBusy: (busy: boolean) => void;
};
const Context = createContext<CartContext | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
	const [store, setStore] = useState<Store>({ lines: [], used: {} });
	const current = useRef(store);
	const inventory = useQuery({
		queryKey: ["orders", "inventory"],
		queryFn: () =>
			apiRequest<{ available: Record<string, number>; enabled: boolean }>(
				"/orders/inventory",
			),
		refetchInterval: 15000,
	});
	const effective = {
		...store,
		used: Object.fromEntries(
			products.map((p) => [
				p.id,
				p.quota - (inventory.data?.available[p.id] ?? 0),
			]),
		),
	};
	const [ready, setReady] = useState(false);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		try {
			const value = restore(localStorage.getItem(storageKey));
			current.current = value;
			setStore(value);
		} catch {
			setError(
				"Penyimpanan browser tidak tersedia. Cart hanya tersimpan selama halaman terbuka.",
			);
		}
		setReady(true);
		const sync = (event: StorageEvent) => {
			if (event.key === storageKey) {
				const value = restore(event.newValue);
				current.current = value;
				setStore(value);
			}
		};
		window.addEventListener("storage", sync);
		return () => window.removeEventListener("storage", sync);
	}, []);
	function commit(value: Store) {
		current.current = value;
		setStore(value);
		try {
			localStorage.setItem(storageKey, JSON.stringify(value));
			setError("");
		} catch {
			setError("Cart belum bisa disimpan di browser. Jangan refresh halaman.");
		}
	}
	function setQuantity(product: string, pack: string, n: number) {
		if (!ready || busy) return false;
		try {
			const previous =
				current.current.lines.find(
					(line) => line.productId === product && line.packageId === pack,
				)?.quantity ?? 0;
			commit(
				change({ ...current.current, used: effective.used }, product, pack, n),
			);
			if (n > previous)
				trackEcommerce("add_to_cart", [
					{ productId: product, packageId: pack, quantity: n - previous },
				]);
			return true;
		} catch (e) {
			setError(e instanceof Error ? e.message : "Gagal mengubah cart.");
			return false;
		}
	}
	function complete(expected: Line[]) {
		let value = current.current;
		try {
			const raw = localStorage.getItem(storageKey);
			if (raw !== null) value = restore(raw);
		} catch {
			/* Continue in memory if browser storage is unavailable. */
		}
		if (
			!value.lines.length ||
			JSON.stringify(value.lines) !== JSON.stringify(expected)
		) {
			current.current = value;
			setStore(value);
			setError(
				"Keranjang berubah di tab lain. Periksa pesanan lalu coba lagi.",
			);
			return false;
		}
		commit({ lines: [], used: {} });
		void inventory.refetch();
		return true;
	}
	return (
		<Context.Provider
			value={{
				store: effective,
				ready,
				error:
					error ||
					(inventory.isError
						? "Kuota server belum bisa dimuat. Coba lagi nanti."
						: ""),
				setQuantity,
				complete,
				busy,
				setBusy,
			}}
		>
			{children}
		</Context.Provider>
	);
}
export function useCart() {
	const value = useContext(Context);
	if (!value) throw new Error("CartProvider required");
	return value;
}
