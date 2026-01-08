import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { getBalances, getMyRequests, createRequest } from "../api/requests";

export default function Dashboard() {
  const nav = useNavigate();
  const [balances, setBalances] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    requestType: "BUY",
    requestReason: "",
    carbonUnitPrice: "",
    carbonQuantity: "",
  });

  async function load() {
    try {
      setBalances(await getBalances());
      setRequests(await getMyRequests());
    } catch {
      setError("Failed to load dashboard");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    nav("/login");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.requestReason.trim()) {
      setError("Reason required");
      return;
    }

    await createRequest({
      ...form,
      carbonUnitPrice: Number(form.carbonUnitPrice),
      carbonQuantity: Number(form.carbonQuantity),
    });

    setForm({
      requestType: "BUY",
      requestReason: "",
      carbonUnitPrice: "",
      carbonQuantity: "",
    });

    load();
  }

  return (
    <PageLayout
      title="Dashboard"
      actions={
        <>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => nav("/received")}
          >
            Requests Received
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded"
            onClick={logout}
          >
            Logout
          </button>
        </>
      }
    >
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {balances && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Company" value={balances.companyName} />
          <Stat label="Carbon Balance" value={balances.carbonBalance} />
          <Stat label="Cash Balance" value={balances.cashBalance} />
        </div>
      )}

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-3">Create Request</h3>
        <form onSubmit={submit} className="grid grid-cols-4 gap-4">
          <select
            className="border rounded px-2 py-1"
            value={form.requestType}
            onChange={(e) => setForm({ ...form, requestType: e.target.value })}
          >
            <option>BUY</option>
            <option>SELL</option>
          </select>

          <input
            className="border rounded px-2 py-1"
            placeholder="Reason"
            value={form.requestReason}
            onChange={(e) => setForm({ ...form, requestReason: e.target.value })}
          />

          <input
            className="border rounded px-2 py-1"
            placeholder="Unit Price"
            value={form.carbonUnitPrice}
            onChange={(e) => setForm({ ...form, carbonUnitPrice: e.target.value })}
          />

          <input
            className="border rounded px-2 py-1"
            placeholder="Quantity"
            value={form.carbonQuantity}
            onChange={(e) => setForm({ ...form, carbonQuantity: e.target.value })}
          />

          <button className="col-span-4 bg-blue-600 text-white py-2 rounded">
            Submit
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Reason</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.requestDate).toLocaleString()}</td>
                <td className="p-2">{r.requestType}</td>
                <td className="p-2">{r.requestReason}</td>
                <td className="p-2">{r.carbonUnitPrice}</td>
                <td className="p-2">{r.carbonQuantity}</td>
                <td className="p-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
