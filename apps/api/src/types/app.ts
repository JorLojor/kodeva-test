export type AppEnv = {
	Bindings: {
		clientIp: string | null;
	};
	Variables: {
		requestId: string;
		authUser: { id: number; publicId: string; role: "admin" | "user" };
		sessionId: string;
	};
};
