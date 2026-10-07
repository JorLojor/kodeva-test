import { createRouter } from "@/lib/create-app";
import authRouter from "@/routes/v1/auth.route";
import blogRouter from "@/routes/v1/blog.route";
import cmsRouter from "@/routes/v1/cms.route";
import formsRouter from "@/routes/v1/forms.route";
import healthRouter from "@/routes/v1/health.route";
import uploadsRouter from "@/routes/v1/uploads.route";
import usersRouter from "@/routes/v1/users.route";

export const v1Router = createRouter();

v1Router.route("/health", healthRouter);
v1Router.route("/", authRouter);
v1Router.route("/", cmsRouter);
v1Router.route("/", blogRouter);
v1Router.route("/", formsRouter);
v1Router.route("/", usersRouter);
v1Router.route("/", uploadsRouter);

import ordersRouter from "./orders.route";

v1Router.route("/", ordersRouter);
