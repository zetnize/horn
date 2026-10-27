// Test-only loader: resolve Next aliases and its server-only marker in Node.
import { registerHooks } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier.startsWith("@/"))
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".ts")) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      return {
        format: "module", shortCircuit: true,
        source: ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
          fileName: pathToFileURL(fileURLToPath(url)).href,
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});
