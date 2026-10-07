import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { publishedCmsOptions } from "@/features/cms/hooks";
import { LandingPage } from "@/features/cms/LandingPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const client = new QueryClient();
	await client.prefetchQuery({ ...publishedCmsOptions(), retry: false });
	return (
		<HydrationBoundary state={dehydrate(client)}>
			
			<LandingPage />
		</HydrationBoundary>
	);
}
