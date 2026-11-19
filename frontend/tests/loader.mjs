import fs from "node:fs";
import path from "node:path";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const frontendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const srcRoot = path.join(frontendRoot, "src");

const STUBS = {
  "server-only": "export {};\n",
  "next/headers": `
    const cookieMap = globalThis.__testCookieStore ?? (globalThis.__testCookieStore = new Map());
    export async function cookies() {
      return {
        get(name) {
          const val = cookieMap.get(name);
          return val === undefined ? undefined : { name, value: val };
        },
        set(name, value) {
          cookieMap.set(name, value);
        },
        delete(name) {
          cookieMap.delete(name);
        },
      };
    }
  `,
  "next/navigation": `
    export function redirect(url) {
      const err = new Error("NEXT_REDIRECT:" + url);
      err.digest = "NEXT_REDIRECT;replace;" + url + ";307;";
      throw err;
    }
    export function notFound() {
      throw new Error("NEXT_NOT_FOUND");
    }
  `,
};

function resolveTsFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in STUBS) {
      return {
        shortCircuit: true,
        url: `test-stub:///${specifier}`,
      };
    }

    if (specifier.startsWith("@/")) {
      const target = path.join(srcRoot, specifier.slice(2));
      const resolvedUrl = resolveTsFile(target);
      if (resolvedUrl) {
        return { shortCircuit: true, url: resolvedUrl };
      }
    }

    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file://") &&
      !context.parentURL.includes("/node_modules/")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const target = path.resolve(parentDir, specifier);
      const resolvedUrl = resolveTsFile(target);
      if (resolvedUrl) {
        return { shortCircuit: true, url: resolvedUrl };
      }
    }

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (url.startsWith("test-stub:///")) {
      const name = url.slice("test-stub:///".length);
      return {
        shortCircuit: true,
        format: "module",
        source: STUBS[name],
      };
    }

    if (url.startsWith("file://") && url.endsWith(".ts")) {
      const filePath = fileURLToPath(url);
      const source = fs.readFileSync(filePath, "utf8");
      const stripped = stripTypeScriptTypes(source, {
        mode: "strip",
        sourceUrl: url,
      });
      return {
        shortCircuit: true,
        format: "module",
        source: stripped,
      };
    }

    return nextLoad(url, context);
  },
});
