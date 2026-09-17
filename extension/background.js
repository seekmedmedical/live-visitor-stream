const DEFAULT_ENDPOINT =
  "https://project--7b7132f2-9098-4998-bcdc-85280f1c6b29.lovable.app/api/public/realtime";

async function getEndpoint() {
  const { endpoint } = await chrome.storage.local.get("endpoint");
  return endpoint || DEFAULT_ENDPOINT;
}

async function refresh() {
  try {
    const res = await fetch(await getEndpoint(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await chrome.storage.local.set({ data, fetchedAt: Date.now(), error: null });
    const n = Number(data.activeUsers) || 0;
    await chrome.action.setBadgeBackgroundColor({ color: "#12b981" });
    await chrome.action.setBadgeText({ text: n > 999 ? "999+" : String(n) });
  } catch (err) {
    await chrome.storage.local.set({ error: String(err && err.message) });
    await chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" });
    await chrome.action.setBadgeText({ text: "!" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("refresh", { periodInMinutes: 0.5 });
  refresh();
});
chrome.runtime.onStartup.addListener(refresh);
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "refresh") refresh();
});
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg === "refresh") refresh().then(() => sendResponse(true));
  return true;
});
