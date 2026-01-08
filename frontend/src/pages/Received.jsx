import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReceivedRequests, decideRequest, markOverdueViewed } from "../api/requests";

export default function Received() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await getReceivedRequests();
      setItems(data);

      // Show overdue popup for first overdue item not viewed yet
      const overdueUnseen = data.find((x) => x.overdue && !x.overdueAlertViewed);
      if (overdueUnseen) {
        alert("You have overdue requests to respond to.");
        await markOverdueViewed(overdueUnseen.receivedId);
        const updated = await getReceivedRequests();
        setItems(updated);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load received requests");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDecision(requestId, decision) {
    setError("");
    try {
      await decideRequest(requestId, decision);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to apply decision");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Requests Received</h2>
        <button onClick={() => nav("/")}>Back</button>
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th align="left">Date</th>
            <th align="left">Type</th>
            <th align="left">Reason</th>
            <th align="left">Price</th>
            <th align="left">Qty</th>
            <th align="left">Overdue</th>
            <th align="left">Status</th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.receivedId} style={{ borderTop: "1px solid #eee" }}>
              <td>{new Date(r.requestDate).toLocaleString()}</td>
              <td>{r.requestType}</td>
              <td>{r.requestReason}</td>
              <td>{r.carbonUnitPrice}</td>
              <td>{r.carbonQuantity}</td>
              <td>{r.overdue ? "YES" : "NO"}</td>
              <td>{r.status}</td>
              <td>
                {r.status === "PENDING" ? (
                  <>
                    <button onClick={() => onDecision(r.requestId, "ACCEPT")} style={{ marginRight: 6 }}>
                      Accept
                    </button>
                    <button onClick={() => onDecision(r.requestId, "REJECT")}>Reject</button>
                  </>
                ) : (
                  "Decided"
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="8">No received requests</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
