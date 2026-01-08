import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";

// Basic email check
function isValidEmail(email) {
  return typeof email === "string" && email.includes("@");
}

export default function Login() {
  const nav = useNavigate();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (mode === "register" && companyName.trim() === "") {
      setError("Company name is required");
      return;
    }
    if (!isValidEmail(email)) {
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

      const data = await login(email.trim(), password);
      localStorage.setItem("token", data.token);

      nav("/");
    } catch (err) {
      // Backend will send {error: "..."}
      const msg = err?.response?.data?.error || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>

      <form onSubmit={onSubmit}>
        {mode === "register" && (
          <div style={{ marginBottom: 12 }}>
            <label>Company Name</label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            style={{ width: "100%", padding: 8 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            style={{ width: "100%", padding: 8 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

        <button disabled={loading} style={{ padding: 10, width: "100%" }}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register + Login"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        {mode === "login" ? (
          <button onClick={() => setMode("register")} style={{ padding: 8, width: "100%" }}>
            Switch to Register
          </button>
        ) : (
          <button onClick={() => setMode("login")} style={{ padding: 8, width: "100%" }}>
            Switch to Login
          </button>
        )}
      </div>
    </div>
  );
}
