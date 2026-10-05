import "server-only";

type CsvValue = string | number | null;

/** Quotes every cell, and defuses values a spreadsheet would run as a formula (visitors type school and source). */
function cell(value: CsvValue): string {
  const text = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** A CSV download: a header row, then one row per record. */
export function csvResponse(filename: string, header: string[], rows: CsvValue[][]): Response {
  const csv = [header, ...rows].map((cells) => cells.map(cell).join(",")).join("\r\n");
  return new Response(`${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
