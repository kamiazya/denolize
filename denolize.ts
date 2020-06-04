import { fs, path, ts } from "./deps.ts";
import { denolizeSourceFile } from "./code_transformer.ts";

function createWalker(
  rootDir: string,
  include: string[],
  exclude: string[],
): AsyncIterableIterator<fs.WalkEntry> {
  return fs.walk(rootDir, {
    match: include.map((v) => path.globToRegExp(v, { extended: true })),
    skip: exclude.map((v) => path.globToRegExp(v, { extended: true })),
  });
}

export async function* denolize(
  rootDir: string,
  {
    include = ["**/*.{ts,tsx,js,jsx}"],
    exclude = [
      "**/node_modules/**/*",
      "**/__specs__/**/*",
      "**/__tests__/**/*",
      "**/__spec__/**/*",
      "**/__test__/**/*",
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
    ],
  }: { include?: string[]; exclude?: string[] } = {},
): AsyncIterableIterator<ts.SourceFile> {
  const decoder = new TextDecoder();
  for await (const entry of createWalker(rootDir, include, exclude)) {
    const buffer = await Deno.readFile(entry.path);
    const source = ts.createSourceFile(
      entry.path,
      decoder.decode(buffer),
      ts.ScriptTarget.ESNext,
    );
    yield denolizeSourceFile(source);
  }
}
