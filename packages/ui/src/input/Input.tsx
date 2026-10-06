"use client";

import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type InputProps = ComponentPropsWithRef<"input"> & { invalid?: boolean };

export function Input({
  className,
  invalid = false,
  type = "text",
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      type={type}
      aria-invalid={invalid || props["aria-invalid"]}
      className={classNames("jt-input", className)}
    />
  );
}
