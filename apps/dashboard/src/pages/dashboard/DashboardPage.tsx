import { Alert, Button } from "@jortemplate/ui";
import { useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useLogout } from "../../features/auth/hooks";
import { Blog } from "../blog/BlogPage";
import { CmsPage } from "../cms/CmsPage";
import { LeadCapturePage } from "../leadcapture/LeadCapturePage";
import { OrdersPage } from "../orders/OrdersPage";

export function DashboardPage() {
	const logout = useLogout();
	const [editor, setEditor] = useState({ dirty: false, busy: false });
	return (
		<div className="min-h-screen">
			<header className="flex min-h-22 flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-10 py-5 max-[480px]:px-6">
				<span className="text-[28px] font-extrabold tracking-[-1.5px] [&_span]:text-accent">
					Kodeva<span>.</span>
				</span>
				<nav
					aria-label="Menu dashboard"
					className="flex flex-wrap items-center gap-2 max-[600px]:order-last max-[600px]:w-full"
				>
					{[
						{ to: "/cms", label: "CMS" },
						{ to: "/leadcapture", label: "Lead Capture" },
						{ to: "/blog", label: "Blog" },
						{ to: "/orders", label: "Pesanan" },
					].map(({ to, label }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${isActive ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"}`
							}
							onClick={(event) => {
								if (
									event.currentTarget.getAttribute("aria-current") === "page" ||
									event.metaKey ||
									event.ctrlKey ||
									event.shiftKey ||
									event.altKey
								)
									return;
								if (
									editor.busy ||
									(editor.dirty &&
										!window.confirm(
											"Pindah halaman dan buang perubahan yang belum disimpan?",
										))
								)
									event.preventDefault();
							}}
						>
							{label}
						</NavLink>
					))}
				</nav>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					disabled={editor.busy}
					onClick={() => {
						if (
							!editor.dirty ||
							window.confirm("Keluar dan buang perubahan yang belum disimpan?")
						)
							logout.mutate();
					}}
					loading={logout.isPending}
				>
					{logout.isPending ? "Sedang keluar…" : "Keluar"}
				</Button>
			</header>
			{logout.isError && (
				<Alert tone="danger" className="mx-10 my-5">
					{logout.error.message}
				</Alert>
			)}
			<main className="min-h-[calc(100vh-88px)]" aria-label="Dashboard">
				<Routes>
					<Route index element={<Navigate to="/cms" replace />} />
					<Route
						path="cms"
						element={<CmsPage onEditorStateChange={setEditor} />}
					/>
					<Route path="orders" element={<OrdersPage />} />
					<Route path="leadcapture" element={<LeadCapturePage />} />
					<Route
						path="blog"
						element={<Blog onEditorStateChange={setEditor} />}
					/>
					<Route path="*" element={<Navigate to="/cms" replace />} />
				</Routes>
			</main>
		</div>
	);
}
