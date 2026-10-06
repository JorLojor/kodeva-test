import type { ComponentPropsWithRef } from "react";
import { classNames } from "../class-names";

export type CardProps = ComponentPropsWithRef<"section">;

export function Card({ className, ...props }: CardProps) {
  return <section {...props} className={classNames("jt-card", className)} />;
}
