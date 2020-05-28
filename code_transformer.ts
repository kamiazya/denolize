import {
  path,
  ts,
} from "./deps.ts";

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

function denoTransformer(
  context: ts.TransformationContext,
): ts.Transformer<ts.SourceFile> {
  return (rootNode: ts.SourceFile): ts.SourceFile => {
    const sourceFileName = rootNode.getSourceFile().fileName;
    return ts.visitNode(rootNode, nodeVisitorFactory(sourceFileName, context));
  };
}

function nodeVisitorFactory(
  sourceFileName: string,
  context: ts.TransformationContext,
): ts.Visitor {
  return (node: ts.Node): ts.VisitResult<ts.Node> => {
    const visitor: ts.Visitor =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? importAndExportDeclarationVisitorFactory(sourceFileName)
        : nodeVisitorFactory(sourceFileName, context);

    return ts.visitEachChild(node, visitor, context);
  };
}

function importAndExportDeclarationVisitorFactory(file: string): ts.Visitor {
  return (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (!ts.isStringLiteral(node)) {
      return node;
    }
    const name = node.text;
    const dir = path.dirname(file);
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
  if (isFile(`${resolved}.ts`)) {
    // resolved
    return `${denolizeFileName(moduleName)}.ts`;
  }
  return moduleName;
}

function denolizeFileName(name: string): string {
  return name.replace(/-/g, "_").replace(/\/index.ts$/, "/mod.ts");
}

export function denolizeSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
  const result = ts.transform(sourceFile, [denoTransformer]);
  result.dispose();
  const printer = ts.createPrinter();
  return ts.createSourceFile(
    denolizeFileName(sourceFile.fileName),
    printer.printFile(result.transformed[0]),
    ts.ScriptTarget.ESNext,
  );
}
