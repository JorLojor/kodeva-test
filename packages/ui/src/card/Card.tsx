import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type CardProps = ComponentPropsWithRef<"section">;

export function Card({ className, ...props }: CardProps) {
	return (
		<section
			{...props}
			className={classNames(
				"rounded-2xl border border-ui-border bg-white p-8",
				className,
			)}
		/>
	);
}
