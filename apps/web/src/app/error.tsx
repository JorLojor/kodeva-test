"use client";

import { Button } from "@jortemplate/ui";
import { useEffect } from "react";
import { log } from "@/lib/logger";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    log.error({ err: error, digest: error.digest }, "Unhandled web error");
  }, [error]);

  return (
    <section className="marketplace">
      <h1>Halaman belum bisa ditampilkan.</h1>
      <p className="intro">Terjadi kesalahan. Silakan coba lagi.</p>
      <Button className="error-retry" size="lg" onClick={retry}>
        Coba lagi
      </Button>
    </section>
  );
}
