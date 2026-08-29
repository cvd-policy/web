const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export class DuplicateMemberError extends SyntaxError {
  readonly path: string;

  constructor(path: string) {
    super(`duplicate member at ${path}`);
    this.path = path;
  }
}

const pointer = (parts: Array<string | number>): string =>
  parts.length === 0
    ? ""
    : `/${parts
        .map((part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1"))
        .join("/")}`;

/** Parses RFC 8259 JSON and rejects duplicate names at every object depth. */
export function parseJsonText(text: string): JsonValue {
  let index = 0;
  const fail = (message: string): never => {
    throw new SyntaxError(`${message} at character ${index}`);
  };
  const whitespace = (): void => {
    while (index < text.length && WHITESPACE.has(text[index] ?? "")) index++;
  };
  const string = (): string => {
    const start = index;
    if (text[index++] !== '"') fail("expected string");
    while (index < text.length) {
      const char = text[index++];
      if (char === '"') {
        try {
          return JSON.parse(text.slice(start, index)) as string;
        } catch {
          fail("invalid string");
        }
      }
      if (char === "\\") {
        const escaped = text[index++];
        if (escaped === "u") {
          if (!/^[0-9A-Fa-f]{4}$/.test(text.slice(index, index + 4)))
            fail("invalid Unicode escape");
          index += 4;
        } else if (!'"\\/bfnrt'.includes(escaped ?? "")) {
          fail("invalid escape");
        }
      } else if (char === undefined || char.charCodeAt(0) < 0x20) {
        fail("invalid string character");
      }
    }
    return fail("unterminated string");
  };
  const number = (): void => {
    const match = text
      .slice(index)
      .match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    const token = match?.[0];
    if (token === undefined)
      throw new SyntaxError(`invalid number at character ${index}`);
    index += token.length;
  };
  const value = (parts: Array<string | number>): void => {
    whitespace();
    const char = text[index];
    if (char === "{") return object(parts);
    if (char === "[") return array(parts);
    if (char === '"') {
      string();
      return;
    }
    if (char === "-" || /[0-9]/.test(char ?? "")) return number();
    for (const literal of ["true", "false", "null"]) {
      if (text.startsWith(literal, index)) {
        index += literal.length;
        return;
      }
    }
    fail("expected JSON value");
  };
  const object = (parts: Array<string | number>): void => {
    index++;
    whitespace();
    const names = new Set<string>();
    if (text[index] === "}") {
      index++;
      return;
    }
    while (true) {
      whitespace();
      if (text[index] !== '"') fail("expected object member name");
      const name = string();
      if (names.has(name))
        throw new DuplicateMemberError(pointer([...parts, name]));
      names.add(name);
      whitespace();
      if (text[index++] !== ":") fail("expected colon");
      value([...parts, name]);
      whitespace();
      if (text[index] === "}") {
        index++;
        return;
      }
      if (text[index++] !== ",") fail("expected comma or closing brace");
    }
  };
  const array = (parts: Array<string | number>): void => {
    index++;
    whitespace();
    if (text[index] === "]") {
      index++;
      return;
    }
    let item = 0;
    while (true) {
      value([...parts, item++]);
      whitespace();
      if (text[index] === "]") {
        index++;
        return;
      }
      if (text[index++] !== ",") fail("expected comma or closing bracket");
    }
  };

  value([]);
  whitespace();
  if (index !== text.length) fail("unexpected trailing data");
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return fail("invalid JSON");
  }
}
