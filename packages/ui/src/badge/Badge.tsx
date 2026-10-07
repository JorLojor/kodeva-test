import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type BadgeProps = ComponentPropsWithRef<"span"> & {
	tone?: "neutral" | "success" | "warning" | "danger";
};
const tones = {
	neutral: "bg-[#eaf0ec] text-ink",
	success: "bg-[#e1f3e5] text-[#226338]",
	warning: "bg-[#fff2cc] text-[#745316]",
	danger: "bg-[#ffe6e6] text-danger",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
	return (
		<span
			{...props}
			className={classNames(
				"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-normal",
				tones[tone],
				className,
			)}
		/>
	);
}
