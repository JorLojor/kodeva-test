import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type BadgeProps = ComponentPropsWithRef<"span"> & {
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={classNames("jt-badge", `jt-badge--${tone}`, className)}
    />
  );
}
