import { Navigate } from "react-router-dom";

// Simple route guard that checks token exists
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  return children;
}
