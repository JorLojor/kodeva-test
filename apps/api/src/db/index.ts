import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "@/db/schemas";
import { log } from "@/utils/logger";

const queryClient = postgres(env.DATABASE_URL || "");

export const checkDatabaseConnection = async () => {
	try {
		await queryClient`SELECT 1`;
		return true;
	} catch (error) {
		console.error("Failed to check database connection", error);
		return false;
	}
};

const db = drizzle({ client: queryClient, schema });

export const disconnectDatabase = async () => {
	await queryClient.end();
};

export const migrateDatabase = async () => {
	try {
		await migrate(db, { migrationsFolder: "./src/db/migrations" });
		log.info("Database migrated successfully");
	} catch (error) {
		console.error("Failed to migrate database", error);
		throw error;
	}
};

export default db;
