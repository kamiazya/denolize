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

type MappingFunction = (distFileName: string) => string;

export type DenolizeFileOption = {
  imports?: {
    [key: string]: string | MappingFunction;
  };
};

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
    const visitor: ts.Visitor =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? importAndExportDeclarationVisitorFactory(
          distFileName,
          option,
        )
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
      return ts.createStringLiteral(
        typeof mapping === "string" ? mapping : mapping(distFileName),
      );
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
  for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
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
      const p = path.parse(v);
      const n = snakeCase(p.name);
      return p.ext ? n + p.ext : n;
    })
    .join("/")
    .replace(/index.([j|t]sx?)$/, "mod.$1");
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
