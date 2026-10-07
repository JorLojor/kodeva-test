"use client";

import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	FormField,
	Input,
	Textarea,
} from "@jortemplate/ui";
import { type FormEvent, useState } from "react";

export function Showcase() {
	const [submitted, setSubmitted] = useState(false);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitted(true);
	}

	return (
		<div className="mt-10 grid grid-cols-2 items-start gap-6 max-[760px]:grid-cols-1 [&>section>h2]:mb-6 [&>section>h2]:text-xl [&>section>h2]:font-semibold [&>section>h2]:tracking-[-1.7px] [&>section>h3]:mt-8 [&>section>h3]:mb-[1em] [&>section>h3]:text-sm [&>section>h3]:font-bold">
			<Card aria-labelledby="buttons-title">
				<h2
					className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
					id="buttons-title"
				>
					Button
				</h2>
				<div className="flex flex-wrap items-center gap-3">
					<Button>Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="danger">Danger</Button>
					<Button disabled>Disabled</Button>
					<Button loading>Menyimpan…</Button>
				</div>
				<h3>Ukuran</h3>
				<div className="flex flex-wrap items-center gap-3">
					<Button size="sm">Small</Button>
					<Button size="md">Medium</Button>
					<Button size="lg">Large</Button>
				</div>
			</Card>
			<Card aria-labelledby="form-title">
				<h2
					className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
					id="form-title"
				>
					Input & form
				</h2>
				<form className="flex flex-col gap-5" onSubmit={submit}>
					<FormField
						htmlFor="project"
						label="Nama proyek"
						hint="Contoh form lokal, tanpa request ke API."
					>
						<Input
							id="project"
							name="project"
							placeholder="Proyek baru"
							required
							aria-describedby="project-hint"
						/>
					</FormField>
					<FormField htmlFor="email" label="Email">
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="nama@example.com"
							required
						/>
					</FormField>
					<FormField htmlFor="description" label="Deskripsi">
						<Textarea
							id="description"
							name="description"
							placeholder="Ceritakan proyekmu"
						/>
					</FormField>
					<FormField
						htmlFor="invalid-example"
						label="Contoh error"
						error="Isi field ini dengan nilai yang valid."
					>
						<Input
							id="invalid-example"
							invalid
							aria-describedby="invalid-example-error"
						/>
					</FormField>
					<FormField htmlFor="disabled-example" label="Contoh disabled">
						<Input
							id="disabled-example"
							disabled
							placeholder="Tidak bisa diedit"
						/>
					</FormField>
					<Button type="submit">Coba form</Button>
					{submitted && (
						<Alert tone="success">
							Form contoh berhasil diproses secara lokal.
						</Alert>
					)}
				</form>
			</Card>
			<Card aria-labelledby="status-title">
				<h2
					className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
					id="status-title"
				>
					Alert & badge
				</h2>
				<div className="flex flex-col gap-5">
					<Alert>Informasi untuk pengguna.</Alert>
					<Alert tone="success">Perubahan berhasil disimpan.</Alert>
					<Alert tone="warning">Periksa kembali data yang diisi.</Alert>
					<Alert tone="danger">Terjadi kesalahan. Silakan coba lagi.</Alert>
					<div className="flex flex-wrap items-center gap-3">
						<Badge>Draft</Badge>
						<Badge tone="success">Aktif</Badge>
						<Badge tone="warning">Pending</Badge>
						<Badge tone="danger">Gagal</Badge>
					</div>
				</div>
			</Card>
			<Card aria-labelledby="empty-title">
				<h2
					className="mb-8 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold tracking-[-1.7px] wrap-anywhere"
					id="empty-title"
				>
					Empty state
				</h2>
				<EmptyState
					icon="◇"
					title="Belum ada data"
					description="Data akan muncul di sini setelah tersedia."
				/>
			</Card>
		</div>
	);
}
