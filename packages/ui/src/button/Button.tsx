"use client";

import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	size?: "sm" | "md" | "lg";
	loading?: boolean;
};

const variants = {
	primary: "bg-ink text-white enabled:hover:bg-accent",
	secondary:
		"border-ui-border bg-transparent text-ink enabled:hover:bg-[#edf3ed]",
	ghost: "bg-transparent text-ink enabled:hover:bg-[#edf3ed]",
	danger: "bg-danger text-white enabled:hover:bg-[#8b2929]",
};
const sizes = {
	sm: "px-4 py-[9px] text-[13px]",
	md: "px-5 py-[13px] text-sm",
	lg: "px-6 py-4 text-base",
};

export function buttonClassName({
	variant = "primary",
	size = "md",
	className,
}: Pick<ButtonProps, "variant" | "size" | "className"> = {}) {
	return classNames(
		"inline-flex items-center justify-center gap-2.5 rounded-lg border border-transparent font-semibold leading-[1.4] no-underline cursor-pointer transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-60 aria-busy:cursor-wait focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-3 motion-reduce:transition-none",
		variants[variant],
		sizes[size],
		className,
	);
}

export function Button({
	variant = "primary",
	size = "md",
	loading = false,
	disabled,
	type = "button",
	className,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type={type}
			className={buttonClassName({ variant, size, className })}
			disabled={disabled || loading}
			aria-busy={loading || props["aria-busy"]}
		>
			{loading && (
				<span
					className="size-3.5 rounded-full border-2 border-current border-r-transparent animate-spin [animation-duration:0.7s] motion-reduce:animate-none"
					aria-hidden="true"
				/>
			)}
			{children}
		</button>
	);
}
