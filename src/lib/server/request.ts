import { headers } from "next/headers";

/** Best-effort absolute origin ("https://app.example.com") for the current request. */
export async function requestOrigin() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = headersList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}
