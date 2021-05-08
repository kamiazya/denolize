import { path, Command, denolize } from "./deps.ts";

export const command = new Command()
  .name("denolize")
  .version("0.0.7")
  .description("Transpile the package created for Node into the Deno module.")
  .arguments("[rootDir:string] [outDir:string]")
  .action(async (_, rootDir = ".", outDir = "dist") => {
    const encoder = new TextEncoder();
    for await (const source of denolize(rootDir)) {
      const outputPath = path.join(
        outDir,
        path.relative(rootDir, source.fileName),
      );
      await Deno.mkdir(path.dirname(outputPath), { recursive: true });
      await Deno.writeFile(outputPath, encoder.encode(source.text));
    }
  });

if (import.meta.main) {
  await command.parse(Deno.args);
}
