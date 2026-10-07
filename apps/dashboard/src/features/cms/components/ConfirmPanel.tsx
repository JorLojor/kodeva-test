import { Alert, Button } from "@jortemplate/ui";
import type { ReactNode } from "react";

export function ConfirmPanel({
	children,
	confirmLabel,
	loading,
	cancelDisabled,
	confirmDisabled,
	onCancel,
	onConfirm,
}: {
	children: ReactNode;
	confirmLabel: string;
	loading: boolean;
	cancelDisabled: boolean;
	confirmDisabled: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	return (
		<div className="mt-6 grid gap-4 rounded-[14px] border border-line bg-white p-6">
			<Alert tone="warning">{children}</Alert>
			<div className="flex flex-wrap items-center gap-2">
				<Button variant="ghost" disabled={cancelDisabled} onClick={onCancel}>
					Batal
				</Button>
				<Button
					loading={loading}
					disabled={confirmDisabled}
					onClick={onConfirm}
				>
					{confirmLabel}
				</Button>
			</div>
		</div>
	);
}
