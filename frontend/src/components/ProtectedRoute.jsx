import React from "react";
import { Navigate } from "react-router-dom";
import { useWallet } from "../context/walletContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { address, role, getDashboardPath } = useWallet();

  // 1. Not connected/authenticated at all
  if (!address) {
    return <Navigate to="/login" replace />;
  }

  // 2. Connected, but role is missing or unauthorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Send them immediately to their designated authorized dashboard
    return <Navigate to={getDashboardPath()} replace />;
  }

  // 3. Authorized correctly, render the target component
  return children;
}
