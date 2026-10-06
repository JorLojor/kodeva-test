"use client";

import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={classNames(
        "jt-button",
        `jt-button--${variant}`,
        `jt-button--${size}`,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || props["aria-busy"]}
    >
      {loading && <span className="jt-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
