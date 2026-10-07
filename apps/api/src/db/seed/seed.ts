import postgres from "postgres";
import { env } from "@/config/env";
import { log } from "@/utils/logger";


const sql = postgres(env.DATABASE_URL || "", { onnotice: () => { } });

try {
	await sql.begin((tx) => tx.file(`${import.meta.dir}/data.sql`));
	log.info("Seed data inserted");
} catch (error) {
	log.error(
		{ message: error instanceof Error ? error.message : "Failed to seed data" },
		"Seeding failed",
	);
	process.exitCode = 1;
} finally {
	await sql.end();
}
