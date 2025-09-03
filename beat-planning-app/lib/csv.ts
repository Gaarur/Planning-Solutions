export type Row = Record<string, string | number | null | undefined>

export function toCsv(headers: string[], rows: Row[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const head = headers.map(escape).join(",")
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n")
  return [head, body].join("\n")
}

export function downloadAsFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
