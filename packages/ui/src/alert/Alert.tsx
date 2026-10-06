import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type AlertProps = ComponentPropsWithRef<"div"> & {
  tone?: "info" | "success" | "warning" | "danger";
};

export function Alert({
  tone = "info",
  role = tone === "danger" ? "alert" : "status",
  className,
  ...props
}: AlertProps) {
  return (
    <div
      {...props}
      role={role}
      className={classNames("jt-alert", `jt-alert--${tone}`, className)}
    />
  );
}
