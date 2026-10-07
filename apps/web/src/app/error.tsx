"use client";

import { Button } from "@jortemplate/ui";
import { useEffect } from "react";
import { log } from "@/lib/logger";

export default function ErrorPage({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	useEffect(() => {
		log.error({ err: error, digest: error.digest }, "Unhandled web error");
	}, [error]);

	return (
		<section className="py-16">
			<h1 className="mb-7 text-[clamp(40px,5.7vw,68px)] leading-[1.05] font-semibold tracking-[-2.8px] wrap-anywhere max-[760px]:tracking-[-1.8px]">
				Halaman belum bisa ditampilkan.
			</h1>
			<p className="my-[1em] max-w-[600px] text-lg leading-[1.7] text-muted">
				Terjadi kesalahan. Silakan coba lagi.
			</p>
			<Button className="mt-6" size="lg" onClick={retry}>
				Coba lagi
			</Button>
		</section>
	);
}
