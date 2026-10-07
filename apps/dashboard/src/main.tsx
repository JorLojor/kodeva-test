import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { Providers } from "./app/providers";
import { log } from "./lib/logger";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing");

createRoot(root, {
	onUncaughtError: (error, info) => {
		log.error(
			{ err: error, componentStack: info.componentStack },
			"Unhandled dashboard error",
		);
	},
}).render(
	<StrictMode>
		<Providers>
			<App />
		</Providers>
	</StrictMode>,
);
