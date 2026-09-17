import { createServerFn } from "@tanstack/react-start";

const DEFAULT_PROPERTY_ID = "443939088";

export type RealtimePayload = {
  configured: boolean;
  demo: boolean;
  activeUsers: number;
  pages: { path: string; users: number }[];
  countries: { name: string; users: number }[];
  devices: { name: string; users: number }[];
  minutes: { minutesAgo: number; users: number }[];
  today: { users: number; views: number; sessions: number };
  updatedAt: string;
  error?: string;
};

function base64url(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google auth failed [${res.status}]: ${text}`);
  return JSON.parse(text).access_token as string;
}

type GaResponse = {
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
};

async function gaCall(
  propertyId: string,
  token: string,
  method: "runRealtimeReport" | "runReport",
  body: unknown,
): Promise<GaResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:${method}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`Analytics request failed [${res.status}]: ${text}`);
  return JSON.parse(text) as GaResponse;
}

function demoPayload(reason?: string): RealtimePayload {
  const seed = Date.now() / 60000;
  const wave = (i: number) => Math.max(0, Math.round(6 + 5 * Math.sin(seed / 3 + i / 4) + (i % 3)));
  const minutes = Array.from({ length: 30 }, (_, i) => ({
    minutesAgo: 29 - i,
    users: wave(i),
  }));
  const active = minutes[minutes.length - 1]!.users + 4;
  return {
    configured: false,
    demo: true,
    activeUsers: active,
    pages: [
      { path: "/", users: Math.max(1, Math.round(active * 0.4)) },
      { path: "/produtos", users: Math.max(1, Math.round(active * 0.25)) },
      { path: "/precos", users: Math.max(1, Math.round(active * 0.2)) },
      { path: "/contato", users: Math.max(1, Math.round(active * 0.1)) },
    ],
    countries: [
      { name: "Brasil", users: Math.max(1, active - 3) },
      { name: "Portugal", users: 2 },
      { name: "Estados Unidos", users: 1 },
    ],
    devices: [
      { name: "mobile", users: Math.max(1, Math.round(active * 0.6)) },
      { name: "desktop", users: Math.max(1, Math.round(active * 0.35)) },
      { name: "tablet", users: 1 },
    ],
    minutes,
    today: { users: 1240, views: 3180, sessions: 1465 },
    updatedAt: new Date().toISOString(),
    ...(reason ? { error: reason } : {}),
  };
}

const num = (v?: string) => Number(v ?? 0) || 0;

export const getRealtime = createServerFn({ method: "GET" }).handler(
  async (): Promise<RealtimePayload> => {
    const raw = process.env["GOOGLE_SERVICE_ACCOUNT_JSON"];
    const propertyId = process.env["GA_PROPERTY_ID"] || DEFAULT_PROPERTY_ID;
    if (!raw) return demoPayload();

    try {
      const creds = JSON.parse(raw) as { client_email: string; private_key: string };
      const token = await getAccessToken(
        creds.client_email,
        creds.private_key.replace(/\\n/g, "\n"),
      );

      const [byPage, byCountry, byDevice, byMinute, today] = await Promise.all([
        gaCall(propertyId, token, "runRealtimeReport", {
          dimensions: [{ name: "unifiedScreenName" }],
          metrics: [{ name: "activeUsers" }],
          limit: 15,
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        }),
        gaCall(propertyId, token, "runRealtimeReport", {
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
          limit: 8,
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        }),
        gaCall(propertyId, token, "runRealtimeReport", {
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "activeUsers" }],
          limit: 5,
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        }),
        gaCall(propertyId, token, "runRealtimeReport", {
          dimensions: [{ name: "minutesAgo" }],
          metrics: [{ name: "activeUsers" }],
          limit: 30,
        }),
        gaCall(propertyId, token, "runReport", {
          dateRanges: [{ startDate: "today", endDate: "today" }],
          metrics: [
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "sessions" },
          ],
        }),
      ]);

      const pages = (byPage.rows ?? []).map((r) => ({
        path: r.dimensionValues?.[0]?.value || "(sem título)",
        users: num(r.metricValues?.[0]?.value),
      }));
      const minuteMap = new Map<number, number>();
      for (const r of byMinute.rows ?? []) {
        minuteMap.set(num(r.dimensionValues?.[0]?.value), num(r.metricValues?.[0]?.value));
      }
      const minutes = Array.from({ length: 30 }, (_, i) => {
        const minutesAgo = 29 - i;
        return { minutesAgo, users: minuteMap.get(minutesAgo) ?? 0 };
      });
      const todayRow = today.rows?.[0]?.metricValues ?? [];

      return {
        configured: true,
        demo: false,
        activeUsers: pages.reduce((s, p) => s + p.users, 0),
        pages,
        countries: (byCountry.rows ?? []).map((r) => ({
          name: r.dimensionValues?.[0]?.value || "—",
          users: num(r.metricValues?.[0]?.value),
        })),
        devices: (byDevice.rows ?? []).map((r) => ({
          name: r.dimensionValues?.[0]?.value || "—",
          users: num(r.metricValues?.[0]?.value),
        })),
        minutes,
        today: {
          users: num(todayRow[0]?.value),
          views: num(todayRow[1]?.value),
          sessions: num(todayRow[2]?.value),
        },
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("GA realtime error", error);
      return demoPayload(error instanceof Error ? error.message : "Erro desconhecido");
    }
  },
);
