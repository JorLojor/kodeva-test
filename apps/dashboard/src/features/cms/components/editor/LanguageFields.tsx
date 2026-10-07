import type { Language } from "@jortemplate/types";
import { FormField, Input, Textarea } from "@jortemplate/ui";

export function LanguageFields({
	id,
	label,
	value,
	onChange,
	multiline = false,
}: {
	id: string;
	label: string;
	value: Language;
	onChange: (value: Language) => void;
	multiline?: boolean;
}) {
	const Field = multiline ? Textarea : Input;
	return (
		<div className="grid grid-cols-1 gap-4 @min-[600px]:grid-cols-2">
			{(["idn", "eng"] as const).map((locale) => (
				<FormField
					key={locale}
					htmlFor={`${id}-${locale}`}
					label={`${label} · ${locale === "idn" ? "Indonesia" : "English"}`}
				>
					<Field
						id={`${id}-${locale}`}
						value={value[locale]}
						placeholder={`${label} dalam ${locale === "idn" ? "bahasa Indonesia" : "bahasa Inggris"}`}
						className={multiline ? "min-h-28 resize-y bg-white" : "bg-white"}
						required
						maxLength={5000}
						onChange={(event) =>
							onChange({ ...value, [locale]: event.target.value })
						}
					/>
				</FormField>
			))}
		</div>
	);
}
