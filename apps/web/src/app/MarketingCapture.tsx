"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getAttribution } from "@/lib/marketing";

export function MarketingCapture() {
	const pathname = usePathname();
	const search = useSearchParams();
	useEffect(() => {
		if (pathname !== null && search !== null) getAttribution();
	}, [pathname, search]);
	return null;
}
