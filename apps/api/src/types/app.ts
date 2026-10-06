export type AppEnv = {
	Variables: {
		requestId: string;
		authUser: { id: number; publicId: string; role: "admin" | "user" };
		sessionId: string;
	};
};
