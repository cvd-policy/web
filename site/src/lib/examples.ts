// Examples are bundled at build time, so loading one makes no request at all.
const modules = import.meta.glob<Record<string, unknown>>("../../vendor/spec/examples/*.json", {
  eager: true,
  import: "default",
});

export interface Example {
  name: string;
  doc: Record<string, unknown>;
}

export const examples: Example[] = Object.entries(modules)
  .map(([path, doc]) => ({ name: path.split("/").pop() ?? path, doc }))
  .sort((a, b) => a.name.localeCompare(b.name));
