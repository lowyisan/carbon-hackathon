import client from "./client";

export async function getBalances() {
  const res = await client.get("/me/balances");
  return res.data;
}

export async function getMyRequests() {
  const res = await client.get("/me/requests");
  return res.data;
}

export async function createRequest(payload) {
  const res = await client.post("/requests", payload);
  return res.data;
}

export async function getReceivedRequests() {
  const res = await client.get("/requests/received");
  return res.data;
}

export async function decideRequest(requestId, decision) {
  const res = await client.post(`/requests/${requestId}/decision`, { decision });
  return res.data;
}

export async function markOverdueViewed(receivedId) {
  const res = await client.post(`/requests/received/${receivedId}/mark-overdue-viewed`);
  return res.data;
}