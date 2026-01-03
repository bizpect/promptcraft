type TossConfig = {
  clientKey: string;
  secretKey: string;
  apiBaseUrl: string;
};

type TossConfirmResponse = {
  orderId?: string;
  paymentKey?: string;
  status?: string;
  totalAmount?: number;
  method?: string;
  requestedAt?: string;
  approvedAt?: string;
  currency?: string;
};

type TossBillingKeyResponse = {
  billingKey?: string;
  customerKey?: string;
  card?: { number?: string } | null;
};

export function getTossConfig(): TossConfig {
  const clientKey = process.env.TOSS_CLIENT_KEY;
  const secretKey = process.env.TOSS_SECRET_KEY;
  const apiBaseUrl =
    process.env.TOSS_API_BASE_URL ?? "https://api.tosspayments.com/v1";

  if (!clientKey || !secretKey) {
    throw new Error("Missing Toss Payments environment variables");
  }

  return {
    clientKey,
    secretKey,
    apiBaseUrl,
  };
}

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const { secretKey, apiBaseUrl } = getTossConfig();
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(`${apiBaseUrl}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount,
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Toss Payments confirm failed";
    const error = new Error(message);
    (error as Error & { payload?: Record<string, unknown> }).payload = data;
    throw error;
  }

  return data as TossConfirmResponse & Record<string, unknown>;
}

export async function issueTossBillingKey(input: {
  authKey: string;
  customerKey: string;
}) {
  const { secretKey, apiBaseUrl } = getTossConfig();
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(
    `${apiBaseUrl}/billing/authorizations/issue`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authKey: input.authKey,
        customerKey: input.customerKey,
      }),
      cache: "no-store",
    }
  );

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Toss billing key issue failed";
    const error = new Error(message);
    (error as Error & { payload?: Record<string, unknown> }).payload = data;
    throw error;
  }

  return data as TossBillingKeyResponse & Record<string, unknown>;
}

export async function chargeTossBillingKey(input: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}) {
  const { secretKey, apiBaseUrl } = getTossConfig();
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(
    `${apiBaseUrl}/billing/${input.billingKey}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerKey: input.customerKey,
        amount: input.amount,
        orderId: input.orderId,
        orderName: input.orderName,
      }),
      cache: "no-store",
    }
  );

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Toss billing charge failed";
    const error = new Error(message);
    (error as Error & { payload?: Record<string, unknown> }).payload = data;
    throw error;
  }

  return data as TossConfirmResponse & Record<string, unknown>;
}

export async function fetchTossPaymentByKey(paymentKey: string) {
  const { secretKey, apiBaseUrl } = getTossConfig();
  const auth = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(`${apiBaseUrl}/payments/${paymentKey}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Toss Payments fetch failed";
    const error = new Error(message);
    (error as Error & { payload?: Record<string, unknown> }).payload = data;
    throw error;
  }

  return data as TossConfirmResponse & Record<string, unknown>;
}

// webhook signature verification removed: Toss webhook secret not available
