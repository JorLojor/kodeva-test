import type { SectionType } from "@jortemplate/types";

export function blankItem(type: SectionType) {
	const text = () => ({ idn: "", eng: "" });
	const item = { title: text(), subtitle: text() };
	if (type === "hero")
		return { ...item, image: "", cta: { label: text(), url: "/" } };
	if (type === "testimonials") return { ...item, image: "" };
	return item;
}

export function move<T>(items: T[], index: number, direction: number): T[] {
	const result = [...items];
	[result[index], result[index + direction]] = [
		result[index + direction]!,
		result[index]!,
	];
	return result;
}
