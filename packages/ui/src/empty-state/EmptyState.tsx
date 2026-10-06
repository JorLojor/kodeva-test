import type { ComponentPropsWithRef, ReactNode } from "react";
import { classNames } from "../class-names";

export type EmptyStateProps = Omit<
  ComponentPropsWithRef<"div">,
  "title" | "children"
> & {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div {...props} className={classNames("jt-empty-state", className)}>
      {icon && (
        <div className="jt-empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className="jt-empty-state-title">{title}</h2>
      {description && (
        <p className="jt-empty-state-description">{description}</p>
      )}
      {action && <div className="jt-empty-state-action">{action}</div>}
    </div>
  );
}
