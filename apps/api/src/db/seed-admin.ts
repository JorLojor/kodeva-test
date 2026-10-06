import { disconnectDatabase } from "@/db";
import { readSeedAdminInput, seedAdminUsage } from "@/db/seed-admin-input";
import UserManagementService from "@/services/user-management/service";
import { log } from "@/utils/logger";

try {
	const input = readSeedAdminInput(Bun.argv.slice(2), process.env);
	if (input) {
		const user = await UserManagementService.createAccount(input);
		log.info({ publicId: user.publicId, username: user.username }, "Admin created");
	} else {
		process.stdout.write(`${seedAdminUsage}\n`);
	}
} catch (error) {
	log.error(
		{ message: error instanceof Error ? error.message : "Failed to create admin" },
		"Admin creation failed",
	);
	process.exitCode = 1;
} finally {
	await disconnectDatabase();
}
