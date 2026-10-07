import type { CampaignAttribution } from "@jortemplate/types";
export function CampaignDetails({
	attribution,
}: {
	attribution?: CampaignAttribution;
}) {
	const entries = Object.entries(attribution ?? {});
	return entries.length ? (
		<dl className="space-y-1 text-xs wrap-anywhere">
			{entries.map(([key, value]) => (
				<div key={key}>
					<dt className="inline text-muted">{key.replace("utm_", "")}:</dt>{" "}
					<dd className="inline">{value}</dd>
				</div>
			))}
		</dl>
	) : (
		<span className="text-xs text-muted">Tanpa UTM</span>
	);
}
