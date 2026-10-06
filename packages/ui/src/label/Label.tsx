import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type LabelProps = ComponentPropsWithRef<"label">;

export function Label({ className, ...props }: LabelProps) {
  return <label {...props} className={classNames("jt-label", className)} />;
}
