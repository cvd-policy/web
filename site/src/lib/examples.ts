// Examples are bundled at build time, so loading one makes no request at all.
const legacyModules = import.meta.glob<Record<string, unknown>>("../../vendor/spec/examples/*.json", {
  eager: true,
  import: "default",
});
const v1Modules = import.meta.glob<Record<string, unknown>>("../../vendor/spec/v1/examples/*.json", {
  eager: true,
  import: "default",
});

export interface Example {
  name: string;
  doc: Record<string, unknown>;
}

const list = (modules: Record<string, Record<string, unknown>>): Example[] => Object.entries(modules)
  .map(([path, doc]) => ({ name: path.split("/").pop() ?? path, doc }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const v1Examples = list(v1Modules);
export const legacyExamples = list(legacyModules);

// The legacy explainer still consumes the frozen 0.x examples explicitly.
export const examples = legacyExamples;
