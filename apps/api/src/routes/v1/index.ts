import { createRouter } from "@/lib/create-app";
import authRouter from "@/routes/v1/auth.route";
import healthRouter from "@/routes/v1/health.route";
import usersRouter from "@/routes/v1/users.route";

export const v1Router = createRouter();

v1Router.route("/health", healthRouter);
v1Router.route("/", authRouter);
v1Router.route("/", usersRouter);
