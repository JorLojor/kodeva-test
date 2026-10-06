import { bootstrap } from "@/config/bootstrap";

void bootstrap().catch((error: unknown) => {
	console.error("Failed to start API", error);
	process.exit(1);
});
