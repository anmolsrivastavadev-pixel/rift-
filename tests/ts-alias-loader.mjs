import { access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = process.cwd();

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveTsPath(filePath) {
  if (path.extname(filePath)) {
    return (await fileExists(filePath)) ? pathToFileURL(filePath).href : null;
  }

  for (const candidate of [`${filePath}.ts`, `${filePath}.tsx`, path.join(filePath, "index.ts")]) {
    if (await fileExists(candidate)) return pathToFileURL(candidate).href;
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = await resolveTsPath(path.join(root, specifier.slice(2)));
    if (resolved) return { url: resolved, shortCircuit: true };
  }

  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const parentPath = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : root;
    const rawPath = specifier.startsWith("/")
      ? specifier
      : path.resolve(parentPath, specifier);
    const resolved = await resolveTsPath(rawPath);
    if (resolved) return { url: resolved, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
