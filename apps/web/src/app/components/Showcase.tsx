"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Textarea,
} from "@jortemplate/ui";
import { useState, type FormEvent } from "react";

export function Showcase() {
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="showcase-grid">
      <Card aria-labelledby="buttons-title">
        <h2 id="buttons-title">Button</h2>
        <div className="showcase-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Menyimpan…</Button>
        </div>
        <h3>Ukuran</h3>
        <div className="showcase-row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Card>
      <Card aria-labelledby="form-title">
        <h2 id="form-title">Input & form</h2>
        <form className="showcase-stack" onSubmit={submit}>
          <FormField
            htmlFor="project"
            label="Nama proyek"
            hint="Contoh form lokal, tanpa request ke API."
          >
            <Input
              id="project"
              name="project"
              placeholder="Proyek baru"
              required
              aria-describedby="project-hint"
            />
          </FormField>
          <FormField htmlFor="email" label="Email">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@example.com"
              required
            />
          </FormField>
          <FormField htmlFor="description" label="Deskripsi">
            <Textarea
              id="description"
              name="description"
              placeholder="Ceritakan proyekmu"
            />
          </FormField>
          <FormField
            htmlFor="invalid-example"
            label="Contoh error"
            error="Isi field ini dengan nilai yang valid."
          >
            <Input
              id="invalid-example"
              invalid
              aria-describedby="invalid-example-error"
            />
          </FormField>
          <FormField htmlFor="disabled-example" label="Contoh disabled">
            <Input
              id="disabled-example"
              disabled
              placeholder="Tidak bisa diedit"
            />
          </FormField>
          <Button type="submit">Coba form</Button>
          {submitted && (
            <Alert tone="success">
              Form contoh berhasil diproses secara lokal.
            </Alert>
          )}
        </form>
      </Card>
      <Card aria-labelledby="status-title">
        <h2 id="status-title">Alert & badge</h2>
        <div className="showcase-stack">
          <Alert>Informasi untuk pengguna.</Alert>
          <Alert tone="success">Perubahan berhasil disimpan.</Alert>
          <Alert tone="warning">Periksa kembali data yang diisi.</Alert>
          <Alert tone="danger">Terjadi kesalahan. Silakan coba lagi.</Alert>
          <div className="showcase-row">
            <Badge>Draft</Badge>
            <Badge tone="success">Aktif</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger">Gagal</Badge>
          </div>
        </div>
      </Card>
      <Card aria-labelledby="empty-title">
        <h2 id="empty-title">Empty state</h2>
        <EmptyState
          icon="◇"
          title="Belum ada data"
          description="Data akan muncul di sini setelah tersedia."
        />
      </Card>
    </div>
  );
}
