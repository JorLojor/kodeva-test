import { twMerge } from "tailwind-merge";

export function classNames(...values: (string | undefined | false)[]): string {
	return twMerge(values.filter(Boolean).join(" "));
}
