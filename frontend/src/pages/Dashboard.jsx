import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBalances, getMyRequests, createRequest } from "../api/requests";

export default function Dashboard() {
  const nav = useNavigate();

  const [balances, setBalances] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  const [requestType, setRequestType] = useState("BUY");
  const [requestReason, setRequestReason] = useState("");
  const [carbonUnitPrice, setCarbonUnitPrice] = useState("");
  const [carbonQuantity, setCarbonQuantity] = useState("");

  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const b = await getBalances();
      const r = await getMyRequests();
      setBalances(b);
      setMyRequests(r);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load dashboard");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    nav("/login");
  }

  async function submitRequest(e) {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (requestReason.trim() === "") {
      setError("Request reason is required");
      return;
    }
    const price = Number(carbonUnitPrice);
    const qty = Number(carbonQuantity);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Unit price must be a number > 0");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be a number > 0");
      return;
    }

    try {
      await createRequest({
        requestType,
        requestReason: requestReason.trim(),
        carbonUnitPrice: price,
        carbonQuantity: qty,
      });

      // Clear form
      setRequestReason("");
      setCarbonUnitPrice("");
      setCarbonQuantity("");

      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create request");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Dashboard</h2>
        <div>
          <button onClick={() => nav("/received")} style={{ marginRight: 8 }}>
            Requests Received
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {balances ? (
        <div style={{ padding: 12, border: "1px solid #ddd", marginBottom: 18 }}>
          <div><b>Company:</b> {balances.companyName}</div>
          <div><b>Carbon Balance:</b> {balances.carbonBalance}</div>
          <div><b>Cash Balance:</b> {balances.cashBalance}</div>
        </div>
      ) : (
        <div>Loading balances...</div>
      )}

      <div style={{ padding: 12, border: "1px solid #ddd", marginBottom: 18 }}>
        <h3>Create Request</h3>
        <form onSubmit={submitRequest}>
          <div style={{ marginBottom: 10 }}>
            <label>Type: </label>
            <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Reason</label>
            <input
              style={{ width: "100%", padding: 8 }}
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Unit Price</label>
              <input
                style={{ width: "100%", padding: 8 }}
                value={carbonUnitPrice}
                onChange={(e) => setCarbonUnitPrice(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Quantity</label>
              <input
                style={{ width: "100%", padding: 8 }}
                value={carbonQuantity}
                onChange={(e) => setCarbonQuantity(e.target.value)}
              />
            </div>
          </div>

          <button style={{ padding: 10 }}>Submit</button>
        </form>
      </div>

      <div style={{ padding: 12, border: "1px solid #ddd" }}>
        <h3>My Outstanding Requests</h3>
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th align="left">Date</th>
              <th align="left">Type</th>
              <th align="left">Reason</th>
              <th align="left">Price</th>
              <th align="left">Qty</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{new Date(r.requestDate).toLocaleString()}</td>
                <td>{r.requestType}</td>
                <td>{r.requestReason}</td>
                <td>{r.carbonUnitPrice}</td>
                <td>{r.carbonQuantity}</td>
                <td>{r.status}</td>
              </tr>
            ))}
            {myRequests.length === 0 && (
              <tr>
                <td colSpan="6">No requests yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
