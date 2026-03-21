"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import { connectCafeSocket } from "../../../../lib/socket";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent } from "../../../../components/ui/Card";

const statusSteps = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "baking", label: "Baking" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "served", label: "Served" },
  { key: "paid", label: "Paid" },
];

const statusLabel = (status) => {
  const found = statusSteps.find((s) => s.key === status);
  return found ? found.label : status;
};

export default function OrderStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cafeId = params.cafeId;
  const orderId = params.orderId;
  const tableNumber = useMemo(() => searchParams.get("table"), [searchParams]);

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [socketState, setSocketState] = useState("disconnected");

  const load = async () => {
    try {
      // No GET /api/orders/:id yet in backend; fallback: list and find.
      const list = await apiFetch(`/api/orders/${cafeId}`);
      const found = Array.isArray(list) ? list.find((o) => o._id === orderId) : null;
      setOrder(found || null);
    } catch (e) {
      setError(e.message || "Failed to load order");
    }
  };

  useEffect(() => {
    setError("");
    if (cafeId && orderId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeId, orderId]);

  useEffect(() => {
    if (!cafeId || !orderId) return;

    const socket = connectCafeSocket(cafeId);
    setSocketState("connecting");

    socket.on("connect", () => setSocketState("connected"));
    socket.on("disconnect", () => setSocketState("disconnected"));

    const onOrder = (payload) => {
      if (payload?._id === orderId) setOrder(payload);
    };

    socket.on("ORDER_UPDATED", onOrder);
    socket.on("ORDER_READY", onOrder);
    socket.on("ORDER_PAID", onOrder);

    return () => {
      socket.off("ORDER_UPDATED", onOrder);
      socket.off("ORDER_READY", onOrder);
      socket.off("ORDER_PAID", onOrder);
      socket.disconnect();
    };
  }, [cafeId, orderId]);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand">Order Status</h1>
          <div className="text-sm text-gray-600 mt-1">Table {tableNumber || "?"}</div>
        </div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <div className="mt-3 text-sm text-gray-600">Live updates: <span className="font-semibold">{socketState}</span></div>

      {error ? (
        <div className="mt-6 text-red-700 font-semibold">{error}</div>
      ) : !order ? (
        <div className="mt-6 text-gray-700">Loading…</div>
      ) : (
        <Card className="mt-6">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="font-bold">Order #{order._id.slice(-6)}</div>
              <div className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-semibold">
                {statusLabel(order.status)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statusSteps.map((step, idx) => {
                const activeIndex = statusSteps.findIndex((s) => s.key === order.status);
                const active = idx <= activeIndex;
                return (
                  <div
                    key={step.key}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      active ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {it.name} × {it.qty}
                  </span>
                  <span>₹{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between font-extrabold">
              <span>Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Pay at the counter. Your status updates automatically.
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
