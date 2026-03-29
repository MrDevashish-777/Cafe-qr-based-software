"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { isOrderInLocalToday, ordersTodayQueryString } from "../../lib/staffOrderRange";
import { filterKitchenLiveOrders, isKitchenLiveOrder } from "../../lib/staffOrderFilters";
import { maybeNotifyBrowser, playKitchenNewOrder, requestNotificationPermission } from "../../lib/sounds";
import { motion, useReducedMotion } from "framer-motion";
import StaffAlertBanner from "../../components/StaffAlertBanner";
import { StaffShell } from "../../components/StaffShell";
import SoundControl from "../../components/SoundControl";
import { authHeaders } from "../../lib/auth";
import { useClientAuth } from "../../lib/useClientAuth";
import { useMounted } from "../../lib/useMounted";
import { connectCafeSocket } from "../../lib/socket";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Input";
import { AppLoading } from "../../components/AppLoading";

function upsertOrder(list, order) {
  const idx = list.findIndex((x) => x._id === order._id);
  if (idx === -1) return [order, ...list];
  const copy = list.slice();
  copy[idx] = order;
  return copy;
}

function getOrderTotal(order, cafeInfo) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const lineSum = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const hasServerPricing = typeof order?.subtotalAmount === "number" && typeof order?.taxAmount === "number";
  const subtotal = hasServerPricing ? Number(order.subtotalAmount) : Number(order?.totalAmount || lineSum);
  const discount = typeof order?.discountAmount === "number" ? Number(order.discountAmount) : 0;
  const taxRate = Number(cafeInfo?.taxPercent || 0);
  const taxAmount = hasServerPricing ? Number(order.taxAmount || 0) : subtotal * (taxRate / 100);
  return hasServerPricing ? Number(order?.totalAmount || 0) : Math.max(0, subtotal + taxAmount - discount);
}

function createEmptyOrderDraft(defaultStatus = "pending") {
  return {
    tableNumber: "",
    customerName: "",
    phone: "",
    notes: "",
    paymentMode: "cash",
    status: defaultStatus,
    items: [],
  };
}

function buildDraftFromOrder(order) {
  return {
    tableNumber: order?.tableNumber ? String(order.tableNumber) : "",
    customerName: order?.customerName || "",
    phone: order?.phone || "",
    notes: order?.notes || "",
    paymentMode: order?.paymentMode || "cash",
    status: order?.status || "pending",
    items: Array.isArray(order?.items)
      ? order.items
          .map((item) => ({
            menuItemId: item?.menuItemId ? String(item.menuItemId) : "",
            qty: Number(item?.qty || 1),
          }))
          .filter((item) => item.menuItemId)
      : [],
  };
}

export default function KitchenPage() {
  const { token, user, ready: authReady } = useClientAuth();
  const role = user?.role || "";
  const mounted = useMounted();
  const reducedMotion = useReducedMotion();

  const [cafeIdOverride, setCafeIdOverride] = useState("");
  const cafeId = useMemo(() => cafeIdOverride || user?.cafeId || "", [cafeIdOverride, user?.cafeId]);

  const [orders, setOrders] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socketState, setSocketState] = useState("disconnected");
  const [cafeInfo, setCafeInfo] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [editorMode, setEditorMode] = useState("create");
  const [editingOrderId, setEditingOrderId] = useState("");
  const [orderDraft, setOrderDraft] = useState(() => createEmptyOrderDraft());
  const [editorSaving, setEditorSaving] = useState(false);

  const stats = useMemo(() => {
    const total = orders.length;
    const queue = orders.filter((o) => ["pending", "accepted"].includes(o.status)).length;
    const preparing = orders.filter((o) => ["preparing", "baking"].includes(o.status)).length;
    const todayTotalOrders = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + getOrderTotal(order, cafeInfo), 0);
    return { total, queue, preparing, todayTotalOrders, todayRevenue };
  }, [orders, todayOrders, cafeInfo]);

  const menuById = useMemo(
    () => new Map(menuItems.map((item) => [String(item._id), item])),
    [menuItems]
  );

  const filteredOrders = useMemo(() => {
    const query = tableFilter.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      const tableValue = String(order?.tableNumber || "");
      const customerValue = String(order?.customerName || "").toLowerCase();
      const phoneValue = String(order?.phone || "").toLowerCase();
      return (
        tableValue.includes(query) ||
        customerValue.includes(query) ||
        phoneValue.includes(query)
      );
    });
  }, [orders, tableFilter]);

  const filteredMenuItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) =>
      [item?.name, item?.category, item?.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [menuItems, menuSearch]);

  const draftEstimate = useMemo(() => {
    const lineSubtotal = orderDraft.items.reduce((sum, line) => {
      const menuItem = menuById.get(String(line.menuItemId));
      return sum + Number(menuItem?.price || 0) * Number(line.qty || 0);
    }, 0);
    const taxPct = Number(cafeInfo?.taxPercent || 0);
    const discountType = cafeInfo?.discountType || "percent";
    const discountValue = Number(cafeInfo?.discountValue || 0);

    let discountAmount = 0;
    let afterDiscount = lineSubtotal;
    if (discountType === "percent") {
      discountAmount = Math.min(lineSubtotal, lineSubtotal * (Math.min(Math.max(discountValue, 0), 100) / 100));
      afterDiscount = lineSubtotal - discountAmount;
    } else {
      discountAmount = Math.min(lineSubtotal, Math.max(discountValue, 0));
      afterDiscount = lineSubtotal - discountAmount;
    }
    const taxAmount = afterDiscount * (taxPct / 100);
    const total = afterDiscount + taxAmount;

    return { subtotal: lineSubtotal, discountAmount, taxAmount, total };
  }, [cafeInfo, menuById, orderDraft.items]);

  const load = useCallback(async () => {
    if (!cafeId) return;
    setLoading(true);
    setError("");
    try {
      const qs = ordersTodayQueryString();
      const list = await apiFetch(`/api/orders/${cafeId}?${qs}`, { headers: { ...(token ? authHeaders() : {}) } });
      const normalizedList = Array.isArray(list) ? list : [];
      setTodayOrders(normalizedList);
      setOrders(filterKitchenLiveOrders(normalizedList));
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [cafeId, token]);

  const loadMenuItems = useCallback(async () => {
    if (!cafeId) {
      setMenuItems([]);
      return;
    }
    setMenuLoading(true);
    setMenuError("");
    try {
      const data = await apiFetch(`/api/menu/${cafeId}`);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setMenuError(e.message || "Failed to load menu items");
    } finally {
      setMenuLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    if (!authReady) return;
    if (!token) {
      window.location.href = "/chef/login";
      return;
    }
    if (role && role !== "kitchen") {
      window.location.href = "/chef/login";
    }
  }, [authReady, token, role]);

  useEffect(() => {
    if (cafeId) load();
  }, [cafeId, load]);

  useEffect(() => {
    if (cafeId) loadMenuItems();
  }, [cafeId, loadMenuItems]);

  useEffect(() => {
    let cancelled = false;
    const loadCafe = async () => {
      if (!cafeId) return;
      try {
        const data = await apiFetch(`/api/cafe/${cafeId}`);
        if (!cancelled) setCafeInfo(data || null);
      } catch {
        if (!cancelled) setCafeInfo(null);
      }
    };
    loadCafe();
    return () => {
      cancelled = true;
    };
  }, [cafeId]);

  useEffect(() => {
    if (!cafeId) return;

    const socket = connectCafeSocket(cafeId);
    setSocketState("connecting");

    socket.on("connect", () => setSocketState("connected"));
    socket.on("disconnect", () => setSocketState("disconnected"));

    const merge = (order) => {
      if (!isOrderInLocalToday(order)) return;
      setTodayOrders((prev) => upsertOrder(prev, order));
      if (!isKitchenLiveOrder(order)) {
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
        return;
      }
      setOrders((prev) => upsertOrder(prev, order));
    };
    const onNewOrder = (order) => {
      if (!isOrderInLocalToday(order)) return;
      if (!isKitchenLiveOrder(order)) return;
      playKitchenNewOrder();
      const line = order?.items?.map((i) => `${i.name}×${i.qty}`).join(", ") || "";
      setAlertMsg(`New order · Table ${order.tableNumber}${line ? ` · ${line.slice(0, 80)}` : ""}`);
      setTimeout(() => setAlertMsg(""), 8000);
      maybeNotifyBrowser("New kitchen order", `Table ${order.tableNumber}`);
      merge(order);
    };
    socket.on("NEW_ORDER", onNewOrder);
    socket.on("ORDER_UPDATED", merge);

    return () => {
      socket.off("NEW_ORDER", onNewOrder);
      socket.off("ORDER_UPDATED", merge);
      socket.disconnect();
    };
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
      setOrders((prev) => {
        const next = prev.map((o) => (o._id === updated._id ? updated : o));
        return filterKitchenLiveOrders(next);
      });
      setTodayOrders((prev) => upsertOrder(prev, updated));
    } catch (e) {
      setError(e.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const openNewOrderEditor = () => {
    setEditorOpen(true);
    setEditorMode("create");
    setMenuSearch("");
    setEditingOrderId("");
    setOrderDraft(createEmptyOrderDraft("pending"));
  };

  const openEditOrderEditor = (order) => {
    setEditorOpen(true);
    setEditorMode("edit");
    setMenuSearch("");
    setEditingOrderId(order?._id || "");
    setOrderDraft(buildDraftFromOrder(order));
  };

  const closeOrderEditor = () => {
    setEditorOpen(false);
    setMenuSearch("");
    setEditorMode("create");
    setEditingOrderId("");
    setOrderDraft(createEmptyOrderDraft("pending"));
  };

  const updateDraftField = (field, value) => {
    setOrderDraft((prev) => ({ ...prev, [field]: value }));
  };

  const addDraftItem = () => {
    const firstMenuItemId = filteredMenuItems[0]?._id
      ? String(filteredMenuItems[0]._id)
      : menuItems[0]?._id
        ? String(menuItems[0]._id)
        : "";
    if (!firstMenuItemId) return;
    setOrderDraft((prev) => ({
      ...prev,
      items: [...prev.items, { menuItemId: firstMenuItemId, qty: 1 }],
    }));
  };

  const updateDraftItem = (index, patch) => {
    setOrderDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return { ...item, ...patch };
      }),
    }));
  };

  const removeDraftItem = (index) => {
    setOrderDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const submitOrderDraft = async (event) => {
    event.preventDefault();
    const parsedTableNumber = Number(orderDraft.tableNumber);
    if (!parsedTableNumber || parsedTableNumber < 1) {
      setError("Table number must be 1 or more");
      return;
    }
    if (!orderDraft.items.length) {
      setError("Add at least one item to the order");
      return;
    }

    setEditorSaving(true);
    setError("");
    try {
      const payload = {
        tableNumber: parsedTableNumber,
        customerName: orderDraft.customerName.trim() || "Walk-in guest",
        phone: orderDraft.phone.trim() || `manual-table-${parsedTableNumber}`,
        notes: orderDraft.notes.trim(),
        paymentMode: orderDraft.paymentMode,
        status: orderDraft.status,
        items: orderDraft.items.map((item) => ({
          menuItemId: item.menuItemId,
          qty: Number(item.qty || 1),
        })),
      };

      const updated =
        editorMode === "edit" && editingOrderId
          ? await apiFetch(`/api/orders/${editingOrderId}`, {
              method: "PUT",
              headers: { ...(token ? authHeaders() : {}) },
              body: JSON.stringify(payload),
            })
          : await apiFetch("/api/orders/staff", {
              method: "POST",
              headers: { ...(token ? authHeaders() : {}) },
              body: JSON.stringify(payload),
            });

      setTodayOrders((prev) => upsertOrder(prev, updated));
      if (isKitchenLiveOrder(updated)) {
        setOrders((prev) => upsertOrder(prev, updated));
      } else {
        setOrders((prev) => prev.filter((order) => order._id !== updated._id));
      }
      closeOrderEditor();
    } catch (e) {
      setError(e.message || "Failed to save order");
    } finally {
      setEditorSaving(false);
    }
  };

  const motionInitial = mounted && !reducedMotion ? { opacity: 0, y: 10 } : false;

  if (!authReady) {
    return (
      <StaffShell title="Kitchen dashboard" subtitle="Loading…">
        <AppLoading label="Authenticating" />
      </StaffShell>
    );
  }

  return (
    <StaffShell
      staffNav={{
        variant: "kitchen",
        onRefresh: load,
        historyHref: "/kitchen/history",
      }}
      badge={
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-700 shadow">
          Kitchen Operations
        </span>
      }
      title="Kitchen dashboard"
      subtitle="Live orders, prep status, and handoff tracking."
      actions={
        <>
          <SoundControl />
        </>
      }
      contentClassName="mx-auto w-full max-w-6xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center shadow-sm">
              <div className="text-xl font-bold text-slate-900">{stats.todayTotalOrders}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Today's Orders</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center shadow-sm">
              <div className="text-xl font-bold text-slate-900">INR {stats.todayRevenue.toFixed(0)}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Today's Revenue</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center shadow-sm">
              <div className="text-xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Active</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center shadow-sm">
              <div className="text-xl font-bold text-slate-900">{stats.queue}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Queue</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center shadow-sm">
              <div className="text-xl font-bold text-slate-900">{stats.preparing}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Preparing</div>
            </div>
          </div>
          <div className="min-w-0 text-sm text-slate-600">
            Socket: <span className="font-semibold">{socketState}</span>
          </div>
          <Button variant="outline" onClick={load} disabled={!cafeId || loading} className="min-w-[110px]">
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-[140px] text-xs sm:text-sm"
            onClick={() => requestNotificationPermission()}
          >
            Enable alerts
          </Button>
          <Link
            href="/kitchen/history"
            className="inline-flex items-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-800 shadow-sm hover:bg-orange-50"
          >
            History
          </Link>
          <Button onClick={openNewOrderEditor} disabled={!cafeId || menuLoading}>
            New manual order
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-sm">
            <Input
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              placeholder="Filter by table, customer, or phone"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
            <span>Prepared = Ready.</span>
            <span>Live queue updates arrive automatically.</span>
            {tableFilter ? <span>Showing {filteredOrders.length} filtered orders.</span> : null}
          </div>
        </div>

        {!user?.cafeId && (
          <Card className="border border-orange-100 shadow-xl">
            <CardContent>
              <div className="font-bold">Cafe scope</div>
              <div className="mt-1 text-sm text-gray-600">Enter a cafeId to view orders.</div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={cafeIdOverride}
                  onChange={(e) => setCafeIdOverride(e.target.value)}
                  placeholder="cafeId (ObjectId)"
                />
                <Button variant="outline" onClick={load} disabled={!cafeIdOverride || loading}>
                  Load
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {alertMsg && <StaffAlertBanner message={alertMsg} variant="warn" />}

        {error && <div className="text-red-700 font-semibold">{error}</div>}
        {menuError && <div className="text-red-700 font-semibold">{menuError}</div>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredOrders.map((o) => (
            <motion.div key={o._id} initial={motionInitial} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Card className="border border-orange-100 shadow-lg">
                <CardContent>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900">Table {o.tableNumber}</div>
                      <div className="break-words text-sm text-gray-600">
                        {o.customerName} - {o.phone}
                      </div>
                    </div>
                    <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase text-orange-700">
                      {o.status === "baking" ? "preparing" : o.status}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-semibold uppercase text-slate-600">
                      {o.source === "manual" ? "manual order" : "qr order"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words">
                          {it.name} x {it.qty}
                        </span>
                        <span className="shrink-0">INR {(it.price * it.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {o.paymentMode && (
                    <div className="mt-2 text-xs font-semibold text-slate-600">
                      Payment: {String(o.paymentMode).toUpperCase()}
                    </div>
                  )}

                  {o.notes ? (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Order note</div>
                      <div className="mt-1 break-words">{o.notes}</div>
                    </div>
                  ) : null}

                  {(() => {
                    const lineSum = o.items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
                    const hasServerPricing = typeof o.subtotalAmount === "number" && typeof o.taxAmount === "number";
                    const subtotal = hasServerPricing ? Number(o.subtotalAmount) : Number(o.totalAmount || lineSum);
                    const discount = typeof o.discountAmount === "number" ? Number(o.discountAmount) : 0;
                    const taxRate = Number(cafeInfo?.taxPercent || 0);
                    const taxAmount = hasServerPricing ? Number(o.taxAmount) : subtotal * (taxRate / 100);
                    const totalFinal = hasServerPricing ? Number(o.totalAmount || 0) : subtotal + taxAmount;
                    return (
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span>INR {subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Discount</span>
                            <span>- INR {discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                          <span>Tax {!hasServerPricing && taxRate ? `(${taxRate}%)` : ""}</span>
                          <span>INR {taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-slate-900">
                          <span>Total</span>
                          <span>INR {totalFinal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      type="button"
                      onClick={() => openEditOrderEditor(o)}
                      disabled={loading || editorSaving}
                    >
                      Edit order
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => setStatus(o._id, "accepted")}
                      disabled={loading}
                    >
                      Accepted
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => setStatus(o._id, "preparing")}
                      disabled={loading}
                    >
                      Preparing
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => setStatus(o._id, "ready")}
                      disabled={loading}
                    >
                      Ready
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full justify-center"
                      onClick={() => setStatus(o._id, "rejected")}
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {!loading && cafeId && filteredOrders.length === 0 && (
          <div className="text-gray-700">
            {tableFilter ? "No orders match this filter." : "No orders yet."}
          </div>
        )}
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close order editor"
            className="flex-1 cursor-default"
            onClick={closeOrderEditor}
          />
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-200/80 bg-white shadow-[-12px_0_40px_-8px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="font-bold text-slate-900">
                  {editorMode === "edit" ? "Edit order" : "Create manual order"}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Add walk-in orders by table or update the items already in the kitchen queue.
                </div>
              </div>
              <Button variant="outline" onClick={closeOrderEditor} disabled={editorSaving}>
                Close
              </Button>
            </div>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitOrderDraft}>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={orderDraft.tableNumber}
                    onChange={(e) => updateDraftField("tableNumber", e.target.value)}
                    placeholder="Table number"
                    type="number"
                    min="1"
                    required
                  />
                  <Input
                    value={orderDraft.customerName}
                    onChange={(e) => updateDraftField("customerName", e.target.value)}
                    placeholder="Customer name"
                  />
                  <Input
                    value={orderDraft.phone}
                    onChange={(e) => updateDraftField("phone", e.target.value)}
                    placeholder="Phone (optional for manual orders)"
                  />
                  <select
                    value={orderDraft.paymentMode}
                    onChange={(e) => updateDraftField("paymentMode", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300/70"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                  </select>
                  <select
                    value={orderDraft.status}
                    onChange={(e) => updateDraftField("status", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300/70"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="served">Served</option>
                  </select>
                </div>

                <Textarea
                  value={orderDraft.notes}
                  onChange={(e) => updateDraftField("notes", e.target.value)}
                  placeholder="Order notes"
                  rows={3}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Order items</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Search the menu, then add items quickly to the order.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDraftItem}
                      disabled={menuLoading || !menuItems.length}
                    >
                      Add item
                    </Button>
                  </div>

                  <div className="mt-3">
                    <Input
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search menu items by name, category, or description"
                    />
                  </div>

                  {menuLoading ? <div className="mt-3 text-sm text-slate-500">Loading menu...</div> : null}
                  {!menuLoading && menuSearch && filteredMenuItems.length === 0 ? (
                    <div className="mt-3 text-sm text-slate-500">No menu items match this search.</div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {orderDraft.items.map((item, index) => {
                      const selectedItem = menuById.get(String(item.menuItemId));
                      return (
                        <div
                          key={`${item.menuItemId}-${index}`}
                          className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1.5fr)_110px_auto]"
                        >
                          <select
                            value={item.menuItemId}
                            onChange={(e) => updateDraftItem(index, { menuItemId: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300/70"
                          >
                            {(menuSearch ? filteredMenuItems : menuItems).map((menuItem) => (
                              <option key={menuItem._id} value={menuItem._id}>
                                {menuItem.name} - {menuItem.category} - INR {Number(menuItem.price || 0).toFixed(0)}
                              </option>
                            ))}
                            {selectedItem && !(menuSearch ? filteredMenuItems : menuItems).some((menuItem) => String(menuItem._id) === String(item.menuItemId)) ? (
                              <option value={item.menuItemId}>
                                {selectedItem.name} - {selectedItem.category} - INR {Number(selectedItem.price || 0).toFixed(0)}
                              </option>
                            ) : null}
                          </select>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 w-11 shrink-0 rounded-full px-0"
                              onClick={() =>
                                updateDraftItem(index, {
                                  qty: Math.max(1, Number(item.qty || 1) - 1),
                                })
                              }
                            >
                              -
                            </Button>
                            <Input
                              value={item.qty}
                              onChange={(e) =>
                                updateDraftItem(index, {
                                  qty: Math.max(1, Number(e.target.value || 1)),
                                })
                              }
                              type="number"
                              min="1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 w-11 shrink-0 rounded-full px-0"
                              onClick={() =>
                                updateDraftItem(index, {
                                  qty: Math.max(1, Number(item.qty || 1) + 1),
                                })
                              }
                            >
                              +
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="min-w-[88px] text-sm font-semibold text-slate-700">
                              INR {(Number(selectedItem?.price || 0) * Number(item.qty || 0)).toFixed(2)}
                            </div>
                            <Button type="button" variant="danger" onClick={() => removeDraftItem(index)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!orderDraft.items.length ? (
                    <div className="mt-3 text-sm text-slate-500">No items added yet.</div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Subtotal</div>
                    <div className="mt-1 font-bold text-slate-900">INR {draftEstimate.subtotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Discount</div>
                    <div className="mt-1 font-bold text-slate-900">INR {draftEstimate.discountAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Tax</div>
                    <div className="mt-1 font-bold text-slate-900">INR {draftEstimate.taxAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Estimated total</div>
                    <div className="mt-1 font-bold text-slate-900">INR {draftEstimate.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={editorSaving || menuLoading || !menuItems.length}>
                    {editorSaving ? "Saving..." : editorMode === "edit" ? "Save order changes" : "Create manual order"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeOrderEditor} disabled={editorSaving}>
                    Cancel
                  </Button>
                  {editorMode === "edit" ? (
                    <Button type="button" variant="outline" onClick={openNewOrderEditor} disabled={editorSaving}>
                      New order instead
                    </Button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </StaffShell>
  );
}
