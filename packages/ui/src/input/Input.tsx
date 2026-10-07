"use client";

import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type InputProps = ComponentPropsWithRef<"input"> & { invalid?: boolean };

export const inputClassName =
	"w-full rounded-lg border border-ui-border bg-white px-3.5 py-3 text-sm leading-normal text-ink placeholder:text-[#84918a] disabled:cursor-not-allowed disabled:bg-[#f1f4f0] disabled:opacity-70 aria-invalid:border-danger focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-3";

export function Input({
	className,
	invalid = false,
	type = "text",
	...props
}: InputProps) {
	return (
		<input
			{...props}
			type={type}
			aria-invalid={invalid || props["aria-invalid"]}
			className={classNames(inputClassName, className)}
		/>
	);
}
