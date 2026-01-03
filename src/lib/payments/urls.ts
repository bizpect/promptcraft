const DEFAULT_SUCCESS_PATH = "/app/billing";

function normalizeBaseUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/$/, "");
  }

  return `https://${value.replace(/\/$/, "")}`;
}

export function getAppBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    process.env.VERCEL_URL;

  if (!baseUrl) {
    throw new Error("Missing APP base URL environment variables");
  }

  return normalizeBaseUrl(baseUrl);
}

export function getBillingRedirectUrls(
  planCode: string,
  orderId: string,
  mode: "subscribe" | "update" = "subscribe"
) {
  const baseUrl = getAppBaseUrl();
  const modeParam = mode === "update" ? "&mode=update" : "";
  const successUrl = `${baseUrl}${DEFAULT_SUCCESS_PATH}?result=success&plan=${planCode}&orderId=${orderId}${modeParam}`;
  const failUrl = `${baseUrl}${DEFAULT_SUCCESS_PATH}?result=fail&plan=${planCode}&orderId=${orderId}${modeParam}`;

  return { successUrl, failUrl };
}
