let requestCount = 0;
export async function fetchData() {
  requestCount += 1;
  return { requestCount };
}
