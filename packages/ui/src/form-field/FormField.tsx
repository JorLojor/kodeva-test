import type { ComponentPropsWithRef, ReactNode } from "react";
import { classNames } from "../class-names";
import { Label } from "../label/Label";

export type FormFieldProps = ComponentPropsWithRef<"div"> & {
	htmlFor: string;
	label: ReactNode;
	hint?: ReactNode;
	error?: string;
};

export function FormField({
	htmlFor,
	label,
	hint,
	error,
	children,
	className,
	...props
}: FormFieldProps) {
	return (
		<div
			{...props}
			className={classNames("flex flex-col gap-[9px]", className)}
		>
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
			{error ? (
				<p
					id={`${htmlFor}-error`}
					className="m-0 text-xs leading-normal text-danger"
					role="alert"
				>
					{error}
				</p>
			) : hint ? (
				<p
					id={`${htmlFor}-hint`}
					className="m-0 text-xs leading-normal text-muted"
				>
					{hint}
				</p>
			) : null}
		</div>
	);
}
