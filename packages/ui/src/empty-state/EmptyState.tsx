import type { ComponentPropsWithRef, ReactNode } from "react";
import { classNames } from "../class-names";

export type EmptyStateProps = Omit<
	ComponentPropsWithRef<"div">,
	"title" | "children"
> & {
	title: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
};

export function EmptyState({
	title,
	description,
	icon,
	action,
	className,
	...props
}: EmptyStateProps) {
	return (
		<div
			{...props}
			className={classNames(
				"rounded-2xl border border-dashed border-ui-border bg-white px-6 py-12 text-center",
				className,
			)}
		>
			{icon && (
				<div className="mb-4 text-[40px] text-accent" aria-hidden="true">
					{icon}
				</div>
			)}
			<h2 className="m-0 mb-3 text-xl font-semibold text-ink">{title}</h2>
			{description && (
				<p className="m-0 text-sm leading-[1.6] text-muted">{description}</p>
			)}
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}
