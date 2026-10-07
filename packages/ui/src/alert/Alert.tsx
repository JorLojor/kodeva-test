import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type AlertProps = ComponentPropsWithRef<"div"> & {
	tone?: "info" | "success" | "warning" | "danger";
};
const tones = {
	info: "border-[#cde0ef] bg-[#eef6fc] text-[#244d68]",
	success: "border-[#c9dfcc] bg-[#edf7ee] text-ink",
	warning: "border-[#ecdcb1] bg-[#fff8e8] text-[#745316]",
	danger: "border-[#edc9c9] bg-[#fff0f0] text-danger",
};

export function Alert({
	tone = "info",
	role = tone === "danger" ? "alert" : "status",
	className,
	...props
}: AlertProps) {
	return (
		<div
			{...props}
			role={role}
			className={classNames(
				"rounded-lg border px-4 py-3 text-[13px] leading-[1.6]",
				tones[tone],
				className,
			)}
		/>
	);
}
