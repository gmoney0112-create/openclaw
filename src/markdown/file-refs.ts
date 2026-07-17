/**
 * File extensions that double as country-code/generic TLDs and commonly
 * appear in code/documentation (e.g. `README.md`, `config.js`). Channels
 * wrap these in <code> rather than let messaging clients auto-link them as
 * bare domains (`README.md` -> `http://README.md`).
 *
 * Deliberately excludes extensions that are popular *intentional* domain
 * TLDs (.ai, .io, .tv, .fm) even though they also see some use as file
 * extensions, since suppressing those would break real links like
 * vercel.io or github.io.
 */
export const FILE_REF_EXTENSIONS_WITH_TLD: ReadonlySet<string> = new Set([
  "md",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "cpp",
  "cc",
  "h",
  "hpp",
  "cs",
  "php",
  "sh",
  "bash",
  "zsh",
  "json",
  "yml",
  "yaml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "env",
  "lock",
  "css",
  "scss",
  "sql",
  "log",
  "csv",
  "txt",
]);

/**
 * True when a markdown auto-link is just a plain file reference (`href` is
 * literally `http://<label>` and `label` ends with a recognized file
 * extension), so channels can suppress the spurious auto-generated link.
 */
export function isAutoLinkedFileRef(href: string, label: string): boolean {
  if (!href || !label || href !== `http://${label}`) {
    return false;
  }
  const dotIndex = label.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === label.length - 1) {
    return false;
  }
  const extension = label.slice(dotIndex + 1).toLowerCase();
  return FILE_REF_EXTENSIONS_WITH_TLD.has(extension);
}
