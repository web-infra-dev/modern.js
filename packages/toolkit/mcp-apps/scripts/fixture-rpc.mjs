/** Test host proxy: always return JSON, including connection and upstream errors. */
export async function proxyFixtureRpc(endpoint, body, fetchImpl = fetch) {
  try {
    const upstream = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body,
      signal: AbortSignal.timeout(35_000),
    });
    const text = await upstream.text();
    if (upstream.status === 202 && text === '')
      return new Response(null, { status: 202 });
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return Response.json(
        {
          error: {
            message: `MCP endpoint ${endpoint} returned HTTP ${upstream.status}, not JSON: ${text.slice(0, 300)}`,
          },
        },
        { status: 502 },
      );
    }
    return Response.json(payload, { status: upstream.status });
  } catch (error) {
    const reason = error?.cause?.code ?? error?.message ?? String(error);
    return Response.json(
      {
        error: {
          message: `Cannot connect to MCP endpoint ${endpoint}: ${reason}. Keep the MCP server running and check MCP_ENDPOINT.`,
        },
      },
      { status: 502 },
    );
  }
}
