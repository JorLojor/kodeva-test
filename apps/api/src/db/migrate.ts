import { disconnectDatabase, migrateDatabase } from "@/db";

try {
	await migrateDatabase();
} catch {
	process.exitCode = 1;
} finally {
	await disconnectDatabase();
}
