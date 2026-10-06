export function classNames(...values: (string | undefined | false)[]): string {
  return values.filter(Boolean).join(" ");
}
