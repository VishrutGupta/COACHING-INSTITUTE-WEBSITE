export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function uniqueSlug(base: string, existing: string[]): string {
  const root = slugify(base) || "item";
  if (!existing.includes(root)) return root;
  let counter = 2;
  while (existing.includes(`${root}-${counter}`)) counter += 1;
  return `${root}-${counter}`;
}
