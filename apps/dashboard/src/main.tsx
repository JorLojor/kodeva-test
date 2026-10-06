import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { log } from "./lib/logger";
import "@jortemplate/ui/styles.css";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: false } },
});
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
