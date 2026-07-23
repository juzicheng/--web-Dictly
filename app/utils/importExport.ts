import YAML from "yaml";
import type {
  ExportFormat,
  ImportedEntry,
  ImportFormat,
  LocaleCode,
  TranslationEntry,
} from "../types/dictly";

function flattenObject(value: unknown, prefix = "", result: Record<string, string> = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flattenObject(child, prefix ? `${prefix}.${key}` : key, result);
    }
    return result;
  }

  result[prefix] = String(value ?? "");
  return result;
}

function unescapeAppleString(value: string) {
  return value.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeAppleString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((current) => current.some((value) => value.trim()));
}

function parseJsonLike(text: string, format: "json" | "yaml") {
  const value = format === "json" ? JSON.parse(text) : YAML.parse(text);
  return Object.entries(flattenObject(value)).map(([key, entryValue]) => ({
    key,
    value: entryValue,
    group: key.split(".").slice(0, -1).join("."),
  }));
}

function parseAndroidXml(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  return Array.from(doc.querySelectorAll("string"))
    .map((node) => ({
      key: node.getAttribute("name") ?? "",
      value: node.textContent ?? "",
      group: (node.getAttribute("name") ?? "").split(".").slice(0, -1).join("."),
    }))
    .filter((entry) => entry.key);
}

function parseAppleStrings(text: string) {
  const result: ImportedEntry[] = [];
  const pattern = /"((?:\\.|[^"])*)"\s*=\s*"((?:\\.|[^"])*)";/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const key = unescapeAppleString(match[1] ?? "");
    result.push({
      key,
      value: unescapeAppleString(match[2] ?? ""),
      group: key.split(".").slice(0, -1).join("."),
    });
  }

  return result;
}

function parseXcstrings(text: string, locale: LocaleCode) {
  const json = JSON.parse(text) as {
    strings?: Record<
      string,
      { localizations?: Record<string, { stringUnit?: { value?: string } }> }
    >;
  };

  return Object.entries(json.strings ?? {}).map(([key, item]) => {
    const localizations = item.localizations ?? {};
    const value =
      localizations[locale]?.stringUnit?.value ??
      Object.values(localizations)[0]?.stringUnit?.value ??
      "";

    return {
      key,
      value,
      group: key.split(".").slice(0, -1).join("."),
    };
  });
}

function parseCsv(text: string, locale: LocaleCode) {
  const rows = parseCsvRows(text);
  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  const keyIndex = headers.findIndex((header) =>
    ["key", "i18n_key", "词条key"].includes(header.toLowerCase()),
  );
  const valueIndex = headers.findIndex((header) =>
    [locale, "value", "translation", "文案", "译文"].includes(header),
  );
  const groupIndex = headers.findIndex((header) =>
    ["group", "分组"].includes(header.toLowerCase()),
  );
  const notesIndex = headers.findIndex((header) =>
    ["notes", "备注"].includes(header.toLowerCase()),
  );

  return rows
    .slice(1)
    .map((row) => {
      const key = row[keyIndex] ?? "";
      return {
        key,
        value: row[valueIndex] ?? "",
        group: row[groupIndex] || key.split(".").slice(0, -1).join("."),
        notes: row[notesIndex] ?? "",
      };
    })
    .filter((entry) => entry.key);
}

export function parseImportedEntries(
  text: string,
  format: ImportFormat,
  locale: LocaleCode,
): ImportedEntry[] {
  if (format === "json" || format === "yaml") {
    return parseJsonLike(text, format);
  }

  if (format === "android-xml") {
    return parseAndroidXml(text);
  }

  if (format === "ios-strings") {
    return parseAppleStrings(text);
  }

  if (format === "ios-xcstrings") {
    return parseXcstrings(text, locale);
  }

  return parseCsv(text, locale);
}

function exportableValue(entry: TranslationEntry, locale: LocaleCode) {
  return entry.translations[locale] || entry.source || "";
}

function flatEntries(entries: TranslationEntry[], locale: LocaleCode) {
  return Object.fromEntries(
    entries
      .filter((entry) => entry.status !== "deprecated")
      .map((entry) => [entry.key, exportableValue(entry, locale)]),
  );
}

export function serializeEntries(
  entries: TranslationEntry[],
  locale: LocaleCode,
  format: ExportFormat,
) {
  const flat = flatEntries(entries, locale);

  if (format === "json") {
    return JSON.stringify(flat, null, 2);
  }

  if (format === "yaml") {
    return YAML.stringify(flat);
  }

  if (format === "android-xml") {
    const rows = Object.entries(flat)
      .map(([key, value]) => `    <string name="${escapeXml(key)}">${escapeXml(value)}</string>`)
      .join("\n");
    return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${rows}\n</resources>\n`;
  }

  if (format === "ios-strings") {
    return Object.entries(flat)
      .map(([key, value]) => `"${escapeAppleString(key)}" = "${escapeAppleString(value)}";`)
      .join("\n");
  }

  if (format === "ios-xcstrings") {
    const strings = Object.fromEntries(
      Object.entries(flat).map(([key, value]) => [
        key,
        {
          extractionState: "manual",
          localizations: {
            [locale]: {
              stringUnit: {
                state: "translated",
                value,
              },
            },
          },
        },
      ]),
    );

    return JSON.stringify({ sourceLanguage: "zh-CN", strings, version: "1.0" }, null, 2);
  }

  const csvRows = [
    ["key", "group", "status", "tags", "notes", locale],
    ...entries
      .filter((entry) => entry.status !== "deprecated")
      .map((entry) => [
        entry.key,
        entry.group,
        entry.status,
        entry.tags.join("|"),
        entry.notes,
        exportableValue(entry, locale),
      ]),
  ];

  return csvRows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
