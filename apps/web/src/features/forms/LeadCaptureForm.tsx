"use client";

import type {
	LeadCaptureInput,
	LeadCapturePayload,
	LeadCaptureResult,
	Locale,
} from "@jortemplate/types";
import { Alert, Button, Card, FormField, Input } from "@jortemplate/ui";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { getAttribution, track } from "@/lib/marketing";

const copy = {
	idn: {
		name: "Nama",
		email: "Email",
		phone: "Nomor WhatsApp",
		namePlaceholder: "Nama lengkap kamu",
		phoneHint: "Contoh: 081234567890 atau +6281234567890",
		submit: "Kirim informasi",
		pending: "Mengirim…",
		success: "Terima kasih! Data kamu berhasil dikirim.",
		invalid:
			"Data belum valid. Periksa kembali nama, email, dan nomor WhatsApp.",
		error: "Belum bisa mengirim formulir. Silakan coba lagi.",
		wait: "Terlalu banyak percobaan. Coba lagi dalam",
		seconds: "detik",
		contact: "HUBUNGI KAMI",
	},
	eng: {
		name: "Name",
		email: "Email",
		phone: "WhatsApp number",
		namePlaceholder: "Your full name",
		phoneHint: "Example: 081234567890 or +6281234567890",
		submit: "Send details",
		pending: "Sending…",
		success: "Thank you! Your details have been submitted.",
		invalid: "Please check your name, email, and WhatsApp number.",
		error: "We couldn't submit your form. Please try again.",
		wait: "Too many attempts. Try again in",
		seconds: "seconds",
		contact: "GET IN TOUCH",
	},
};

export function LeadCaptureForm({
	item,
	locale,
}: {
	item: LeadCapturePayload;
	locale: Locale;
}) {
	const text = copy[locale];
	const inFlight = useRef(false);
	const [invalid, setInvalid] = useState(false);
	const [retryUntil, setRetryUntil] = useState(0);
	const [remaining, setRemaining] = useState(0);
	const mutation = useMutation({
		mutationFn: (input: LeadCaptureInput) =>
			apiRequest<LeadCaptureResult>("/forms/leadcapture", {
				method: "POST",
				body: JSON.stringify(input),
			}),
		retry: false,
		gcTime: 0,
	});

	useEffect(() => {
		if (!retryUntil) return;
		const tick = () => {
			const seconds = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
			setRemaining(seconds);
			if (seconds === 0) setRetryUntil(0);
		};
		tick();
		const timer = setInterval(tick, 1000);
		return () => clearInterval(timer);
	}, [retryUntil]);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (inFlight.current || remaining > 0) return;
		const form = event.currentTarget;
		const values = new FormData(form);
		const input = {
			attribution: getAttribution(),
			nama: String(values.get("nama") ?? "").trim(),
			email: String(values.get("email") ?? "").trim(),
			nomorWa: String(values.get("nomorWa") ?? "").trim(),
		};
		if (
			!input.nama ||
			!/^\+?[0-9 ()-]+$/.test(input.nomorWa) ||
			!/^\+?[0-9]{8,15}$/.test(input.nomorWa.replace(/[ ()-]/g, ""))
		) {
			setInvalid(true);
			return;
		}
		setInvalid(false);
		inFlight.current = true;
		track("cta_click", {
			cta_id: "lead-submit",
			cta_text: text.submit,
			section: "leadcapture",
			destination: "lead_form",
			language: locale,
		});
		mutation.mutate(input, {
			onSuccess: () => form.reset(),
			onError: (error) => {
				if (error instanceof ApiError && error.status === 429) {
					const seconds = error.retryAfter || 60;
					setRemaining(seconds);
					setRetryUntil(Date.now() + seconds * 1000);
				}
			},
			onSettled: () => {
				inFlight.current = false;
			},
		});
	}

	return (
		<section
			id="leadcapture"
			className="mt-4 mb-20 grid grid-cols-2 items-center gap-16 rounded-3xl bg-ink p-14 text-white max-[1000px]:gap-9 max-[1000px]:p-9 max-[760px]:mb-12 max-[760px]:grid-cols-1 max-[760px]:gap-6 max-[760px]:p-7 max-[440px]:px-5 max-[440px]:py-6"
			aria-labelledby="lead-title"
		>
			<div className="[&_h2]:mb-6 [&_h2]:text-[clamp(34px,4vw,50px)] [&>p:first-child]:text-[#c5d8c6] [&>p:last-child]:my-[1em] [&>p:last-child]:text-[17px] [&>p:last-child]:leading-[1.8] [&>p:last-child]:whitespace-pre-line [&>p:last-child]:text-[#cbd8d0]">
				<p className="mb-[22px] text-[11px] font-bold tracking-[2px] leading-[1.6] text-accent">
					{text.contact}
				</p>
				<h2
					className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
					id="lead-title"
				>
					{item.title[locale]}
				</h2>
				<p>{item.subtitle[locale]}</p>
			</div>
			<Card className="border-0 text-ink max-[760px]:p-6 max-[440px]:p-5">
				<form className="flex flex-col gap-5" onSubmit={submit}>
					<FormField htmlFor="lead-nama" label={text.name}>
						<Input
							id="lead-nama"
							name="nama"
							autoComplete="name"
							placeholder={text.namePlaceholder}
							maxLength={150}
							required
							disabled={mutation.isPending}
						/>
					</FormField>
					<FormField htmlFor="lead-email" label={text.email}>
						<Input
							id="lead-email"
							name="email"
							type="email"
							autoComplete="email"
							placeholder="nama@example.com"
							maxLength={254}
							required
							disabled={mutation.isPending}
						/>
					</FormField>
					<FormField htmlFor="lead-wa" label={text.phone} hint={text.phoneHint}>
						<Input
							id="lead-wa"
							name="nomorWa"
							type="tel"
							inputMode="tel"
							autoComplete="tel"
							placeholder="081234567890"
							minLength={8}
							maxLength={32}
							aria-describedby="lead-wa-hint"
							required
							disabled={mutation.isPending}
						/>
					</FormField>
					<Button
						type="submit"
						loading={mutation.isPending}
						disabled={remaining > 0}
					>
						{mutation.isPending ? text.pending : text.submit}
					</Button>
					{invalid ? (
						<Alert tone="danger">{text.invalid}</Alert>
					) : remaining > 0 ? (
						<Alert tone="warning">
							{text.wait} {remaining} {text.seconds}.
						</Alert>
					) : mutation.isError ? (
						<Alert tone="danger">
							{mutation.error instanceof ApiError &&
							mutation.error.status === 400
								? text.invalid
								: text.error}
						</Alert>
					) : mutation.isSuccess ? (
						<Alert tone="success">{text.success}</Alert>
					) : null}
				</form>
			</Card>
		</section>
	);
}
