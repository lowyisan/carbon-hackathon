import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";

export default function Login() {
  const nav = useNavigate();

  const [mode, setMode] = useState("login");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register" && !companyName.trim()) {
      setError("Company name is required");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      if (mode === "register") {
        await register(companyName.trim(), email.trim(), password);
      }

      const res = await login(email.trim(), password);
      localStorage.setItem("token", res.token);
      nav("/");
    } catch (e) {
      setError(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow rounded-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold mb-4">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          )}

          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 text-blue-600 text-sm"
        >
          {mode === "login" ? "Create an account" : "Back to login"}
        </button>
      </div>
    </div>
  );
}
