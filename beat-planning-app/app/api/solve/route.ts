// Note: This runs server-side, so it can call http://localhost:8000 safely.
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const upstream = "https://rotten-spoons-itch.loca.lt/solve_beat_planning"

    const res = await fetch(upstream, {
      method: "POST",
      body: formData,
      headers: {
        "Bypass-Tunnel-Reminder": "1",
        "ngrok-skip-browser-warning": "1",
      } as any,
    })

    const contentType = res.headers.get("content-type") || ""
    const text = await res.text()

    if (contentType.includes("application/json")) {
      return new Response(text, {
        status: res.status,
        headers: { "content-type": "application/json" },
      })
    }

    // Try to parse text as JSON, else return a clear 502 with snippet for debugging
    try {
      const parsed = JSON.parse(text)
      return new Response(JSON.stringify(parsed), {
        status: res.status,
        headers: { "content-type": "application/json" },
      })
    } catch {
      return new Response(
        JSON.stringify({
          error: "Upstream returned non-JSON",
          status: res.status,
          snippet: text?.slice(0, 300),
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      )
    }
  } catch (err: any) {
    // Surface server-side errors to the client for easier debugging
    return new Response(JSON.stringify({ error: "Proxy error", detail: err?.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
