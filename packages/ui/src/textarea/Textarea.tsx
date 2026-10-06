"use client";

import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  invalid?: boolean;
};

export function Textarea({
  className,
  invalid = false,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      aria-invalid={invalid || props["aria-invalid"]}
      className={classNames("jt-input", "jt-textarea", className)}
    />
  );
}
