import client from "./client";

// Login API call
export async function login(email, password) {
  const res = await client.post("/auth/login", { email, password });
  return res.data; // { token }
}

// Register API call
export async function register(companyName, email, password) {
  const res = await client.post("/auth/register", { companyName, email, password });
  return res.data;
}