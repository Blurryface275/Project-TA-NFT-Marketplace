const { pathToFileURL } = require('node:url');
const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    const normalized = sourceText
      .replace(
        /\b(?:const|let|var)\s+require\s*=\s*createRequire\s*\([^)]*\)\s*;?/g,
        '',
      )
      .replace(
        /\bimport\.meta\.url\b/g,
        JSON.stringify(pathToFileURL(sourcePath).href),
      );
    const { outputText } = ts.transpileModule(normalized, {
      fileName: sourcePath,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        allowJs: true,
        esModuleInterop: true,
      },
    });
    return { code: outputText };
  },
};
