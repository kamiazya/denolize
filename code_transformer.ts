import { path, ts, snakeCase } from "./deps.ts";

function isFile(path: string): boolean {
  try {
    const stats = Deno.statSync(path);
    return stats.isFile;
  } catch (err) {
    return false;
  }
}

function isRelative(path: string): boolean {
  return path.startsWith(".");
}

interface ImportMapping {
  type?: string;
  import: string;
}

type MappingFunction = (distFileName: string) => string | ImportMapping;

type ImportMappingLike = string | MappingFunction | ImportMapping;
export type DenolizeFileOption = {
  imports?: {
    [key: string]: ImportMappingLike;
  };
};

function getImportStringLiteral(
  distFileName: string,
  mapping: ImportMappingLike,
): ts.StringLiteral {
  switch (typeof mapping) {
    case "object":
      return ts.createStringLiteral(mapping.import);
    case "function":
      const importMapping = mapping(distFileName);
      if (typeof importMapping === "string") {
        return ts.createStringLiteral(importMapping);
      }
      return ts.createStringLiteral(importMapping.import);
    case "string":
    default:
      return ts.createStringLiteral(mapping);
  }
}

function getTypeComment(
  distFileName: string,
  mapping: ImportMappingLike,
): string | undefined {
  switch (typeof mapping) {
    case "object":
      return mapping.type;
    case "function":
      const importMapping = mapping(distFileName);
      if (typeof importMapping !== "string") {
        return importMapping.type;
      }
    default:
      return undefined;
  }
}

function denoTransformerFactory(
  distFileName: string,
  option: Required<DenolizeFileOption>,
): ts.TransformerFactory<ts.SourceFile> {
  function transformer(
    context: ts.TransformationContext,
  ): ts.Transformer<ts.SourceFile> {
    return (rootNode: ts.SourceFile): ts.SourceFile => {
      const sourceFileName = rootNode.getSourceFile().fileName;
      return ts.visitNode(
        rootNode,
        nodeVisitorFactory(sourceFileName, distFileName, context, option),
      );
    };
  }
  return transformer;
}

function nodeVisitorFactory(
  sourceFileName: string,
  distFileName: string,
  context: ts.TransformationContext,
  option: Required<DenolizeFileOption>,
): ts.Visitor {
  return (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (ts.isImportDeclaration(node)) {
      let name: string | null = null;
      node.forEachChild((n) => {
        if (ts.isStringLiteral(n)) {
          name = n.text;
        }
      });
      if (name !== null) {
        const mapping = option.imports[name];
        if (mapping !== undefined) {
          const type = getTypeComment(distFileName, mapping);
          if (type) {
            // FIXME
            (node as any)["emitNode"] = {};
            ts.addSyntheticLeadingComment(
              node,
              ts.SyntaxKind.SingleLineCommentTrivia,
              ` @deno-types="${type}"`,
              true,
            );
          }
        }
      }
    }
    const visitor: ts.Visitor =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? importAndExportDeclarationVisitorFactory(distFileName, option)
        : nodeVisitorFactory(sourceFileName, distFileName, context, option);

    return ts.visitEachChild(node, visitor, context);
  };
}

function importAndExportDeclarationVisitorFactory(
  distFileName: string,
  option: Required<DenolizeFileOption>,
): ts.Visitor {
  return (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (!ts.isStringLiteral(node)) {
      return node;
    }
    const name = node.text;
    const mapping = option.imports[name];
    if (mapping !== undefined) {
      return getImportStringLiteral(distFileName, mapping);
    }
    const dir = path.dirname(distFileName);
    const moduleName = resolveModuleName(name, dir);
    return ts.createStringLiteral(moduleName);
  };
}

function resolveModuleName(
  moduleName: string,
  dir: string,
): string {
  if (!(path.isAbsolute(moduleName) || isRelative(moduleName))) {
    return moduleName;
  }
  const resolved = path.isAbsolute(moduleName)
    ? moduleName
    : path.resolve(dir, moduleName);
  for (const ext of [".ts", ".tsx", ".js", ".mjs", ".jsx"]) {
    if (isFile(`${resolved}${ext}`)) {
      return `${denolizeFileName(moduleName)}${ext}`;
    }
  }
  return moduleName;
}

export function denolizeFileName(name: string): string {
  return name
    .split("/")
    .map((v) => {
      if (v === "." || v === "..") {
        return v;
      }
      if (v.endsWith(".d.ts")) {
        const n = snakeCase(v.slice(0, v.length - 5));
        return `${n}.d.ts`;
      }
      const p = path.parse(v);
      const n = snakeCase(p.name);
      return p.ext ? n + p.ext : n;
    })
    .join("/")
    .replace(/index.d.ts$/, "types.ts")
    .replace(/index.(m?[j|t]sx?)$/, "mod.$1");
}

/**
 * Convert Node.js format ts.SourceFile object to deno format.
 */
export function denolizeSourceFile(source: ts.SourceFile, {
  imports = {},
}: DenolizeFileOption = {}): ts.SourceFile {
  const distFileName = denolizeFileName(source.fileName);
  const transformer = denoTransformerFactory(distFileName, { imports });
  const result = ts.transform(source, [transformer]);
  result.dispose();
  const printer = ts.createPrinter();
  return ts.createSourceFile(
    distFileName,
    printer.printFile(result.transformed[0]),
    ts.ScriptTarget.ESNext,
  );
}
