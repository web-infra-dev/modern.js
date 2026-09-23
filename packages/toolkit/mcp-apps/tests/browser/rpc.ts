export async function readRpcResponse(response: Response) {
  const text = await response.text();
  if (response.status === 202 && text === '') return undefined;
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `Test host returned HTTP ${response.status}, not JSON: ${text.slice(0, 300)}`,
    );
  }
  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ?? `Test host returned HTTP ${response.status}`,
    );
  }
  return payload.result;
}
