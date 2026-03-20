"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { authHeaders, getToken, getUser } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

function upsertOrder(list, order) {
  const idx = list.findIndex((x) => x._id === order._id);
  if (idx === -1) return [order, ...list];
  const copy = list.slice();
  copy[idx] = order;
  return copy;
}

export default function WaiterPage() {
  const token = getToken();
  const user = getUser();
  const role = user?.role || "";

  const [cafeIdOverride, setCafeIdOverride] = useState("");
  const cafeId = useMemo(() => cafeIdOverride || user?.cafeId || "", [cafeIdOverride, user?.cafeId]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const total = orders.length;
    const ready = orders.filter((o) => o.status === "ready").length;
    const served = orders.filter((o) => o.status === "served").length;
    return { total, ready, served };
  }, [orders]);

  useEffect(() => {
    if (!token) {
      window.location.href = "/waiter/login";
      return;
    }
    if (role && role !== "staff") {
      window.location.href = "/waiter/login";
    }
  }, [token, role]);

  const load = async () => {
    if (!cafeId) return;
    setLoading(true);
    setError("");
    try {
      const list = await apiFetch(`/api/orders/${cafeId}`, { headers: { ...(token ? authHeaders() : {}) } });
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cafeId) load();
  }, [cafeId]);

  const setStatus = async (orderId, status) => {
    setLoading(true);
    setError("");
    try {
      const updated = await apiFetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { ...(token ? authHeaders() : {}) },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => upsertOrder(prev, updated));
    } catch (e) {
      setError(e.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-700 shadow">
              Waiter Operations
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">Waiter dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Track ready orders and update service status.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{stats.ready}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Ready</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{stats.served}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Served</div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={load} disabled={!cafeId || loading}>Refresh</Button>
        </div>

        {!user?.cafeId && (
          <Card className="border border-orange-100 shadow-xl">
            <CardContent>
              <div className="font-bold">Cafe scope</div>
              <div className="text-sm text-gray-600 mt-1">Enter a cafeId to view orders.</div>
              <div className="mt-3 flex gap-2">
                <Input value={cafeIdOverride} onChange={(e) => setCafeIdOverride(e.target.value)} placeholder="cafeId (ObjectId)" />
                <Button variant="outline" onClick={load} disabled={!cafeIdOverride || loading}>Load</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <div className="text-red-700 font-semibold">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((o) => (
            <Card key={o._id} className="border border-orange-100 shadow-lg">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900">Table {o.tableNumber}</div>
                    <div className="text-sm text-gray-600">{o.customerName} - {o.phone}</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-semibold text-xs uppercase">
                    {o.status}
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.name} x {it.qty}</span>
                      <span>INR {(it.price * it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>INR {Number(o.totalAmount || 0).toFixed(2)}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setStatus(o._id, "served")} disabled={loading}>Served</Button>
                  <Button variant="outline" onClick={() => setStatus(o._id, "paid")} disabled={loading}>Paid</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && cafeId && orders.length === 0 && (
          <div className="text-gray-700">No orders yet.</div>
        )}
      </div>
    </main>
  );
}
