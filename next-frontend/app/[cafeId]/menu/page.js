"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Plus, ShoppingCart, Star, Search, MapPin, Sparkles, Clock } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import CustomerBottomNav from "../../../components/CustomerBottomNav";
import { Input } from "../../../components/ui/Input";

function cartKey(cafeId, tableNumber) {
  return `cart:${cafeId}:table:${tableNumber}`;
}

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const cafeId = params.cafeId;
  const tableNumber = useMemo(() => {
    const t = searchParams.get("table");
    return t ? parseInt(t, 10) : null;
  }, [searchParams]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [cafe, setCafe] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!cafeId || !tableNumber) return;
    try {
      const raw = localStorage.getItem(cartKey(cafeId, tableNumber));
      const parsed = raw ? JSON.parse(raw) : [];
      setCart(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCart([]);
    }
  }, [cafeId, tableNumber]);

  const persistCart = (nextCart) => {
    if (!cafeId || !tableNumber) return;
    localStorage.setItem(cartKey(cafeId, tableNumber), JSON.stringify(nextCart));
  };

  useEffect(() => {
    if (!cafeId || !tableNumber) return;
    localStorage.setItem(cartKey(cafeId, tableNumber), JSON.stringify(cart));
  }, [cart, cafeId, tableNumber]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/menu/${cafeId}`);
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load menu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (cafeId) load();
    return () => {
      cancelled = true;
    };
  }, [cafeId]);

  useEffect(() => {
    let cancelled = false;
    async function loadCafe() {
      try {
        const data = await apiFetch(`/api/cafe/${cafeId}`);
        if (!cancelled) setCafe(data);
      } catch {
        if (!cancelled) setCafe(null);
      }
    }
    if (cafeId) loadCafe();
    return () => {
      cancelled = true;
    };
  }, [cafeId]);

  const add = (item) => {
    setCart((prev) => {
      const found = prev.find((x) => x._id === item._id);
      const next = found
        ? prev.map((x) => (x._id === item._id ? { ...x, qty: x.qty + 1 } : x))
        : [...prev, { _id: item._id, name: item.name, price: item.price, qty: 1 }];
      persistCart(next);
      return next;
    });
  };

  const remove = (item) => {
    setCart((prev) => {
      const next = prev
        .map((x) => (x._id === item._id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0);
      persistCart(next);
      return next;
    });
  };

  const cartCount = cart.reduce((sum, x) => sum + x.qty, 0);
  const total = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((it) => it.category).filter(Boolean)));
    return ["All", ...unique];
  }, [items]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  const filteredByCategory = selectedCategory === "All"
    ? items
    : items.filter((it) => it.category === selectedCategory);
  const filteredByType = typeFilter === "all"
    ? filteredByCategory
    : filteredByCategory.filter((it) => it.type === typeFilter);
  const queryLower = query.trim().toLowerCase();
  const filteredItems = queryLower
    ? filteredByType.filter((it) =>
        [it.name, it.description, it.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(queryLower))
      )
    : filteredByType;
  const specials = items.filter((it) => it.isSpecial);

  const openCart = () => {
    if (!tableNumber) return;
    router.push(`/${cafeId}/cart?table=${tableNumber}`);
  };

  return (
    <main className="min-h-screen customer-shell pb-36">
      <div className="sticky top-0 z-20 border-b border-white/60 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <Button variant="outline" className="h-9 w-9 rounded-full p-0" onClick={() => router.back()}>
            <ArrowLeft size={18} className="text-slate-900" />
          </Button>
          <div className="flex-1 px-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Table</div>
                <div className="text-sm font-semibold text-slate-900">{tableNumber ? `Table ${tableNumber}` : "Table ?"}</div>
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                Live menu
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <MapPin size={12} />
              <span>{cafe?.address || "Freshly brewed, made to order."}</span>
            </div>
          </div>
          <Button variant="outline" className="relative h-9 w-9 rounded-full p-0" onClick={openCart}>
            <ShoppingCart size={18} className="text-slate-900" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pt-3">
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-lg">
          <div
            className="relative h-40 w-full bg-slate-100"
            style={{
              backgroundImage: cafe?.brandImageUrl ? `url(${cafe.brandImageUrl})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/30 bg-white/20">
                  {cafe?.logoUrl ? (
                    <img src={cafe.logoUrl} alt={cafe?.name || "Cafe"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">Q</div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/70">Welcome to</div>
                  <div className="text-lg font-semibold text-white">{cafe?.name || "Cafe"}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                    <Sparkles size={12} />
                    <span>Chef-curated picks for today</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-white/90">
                <span className="rounded-full bg-white/20 px-3 py-1">Popular now</span>
                <span className="rounded-full bg-white/20 px-3 py-1">Table service</span>
                <span className="rounded-full bg-white/20 px-3 py-1 flex items-center gap-1">
                  <Clock size={12} /> Avg 10-12 mins
                </span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes, categories, or ingredients"
                className="pl-9"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <div>{filteredItems.length} items</div>
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                Tap to add instantly
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-orange-500 text-white shadow shadow-orange-500/30"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              typeFilter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("veg")}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
              typeFilter === "veg" ? "bg-emerald-500 text-white" : "bg-white text-emerald-700 border border-emerald-200"
            }`}
          >
            <Leaf size={12} /> Veg
          </button>
          <button
            onClick={() => setTypeFilter("non-veg")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              typeFilter === "non-veg" ? "bg-rose-500 text-white" : "bg-white text-rose-700 border border-rose-200"
            }`}
          >
            Non-veg
          </button>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <div className="h-32 w-full rounded-2xl skeleton" />
                <div className="mt-4 h-4 w-3/4 rounded-full skeleton" />
                <div className="mt-2 h-3 w-1/2 rounded-full skeleton" />
                <div className="mt-4 h-9 w-24 rounded-full skeleton" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 text-sm font-semibold text-red-700">{error}</div>
        ) : (
          <div className="mt-4 space-y-4">
            {specials.length > 0 && (
              <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-700">
                    <Star size={14} /> Today&apos;s Special
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-semibold text-orange-700">
                    Limited
                  </span>
                </div>
                <div className="mt-3 grid gap-3">
                  {specials.map((it) => {
                    const inCart = cart.find((x) => x._id === it._id);
                    return (
                      <div key={it._id} className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white p-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{it.name}</div>
                          <div className="text-xs text-slate-500">{it.description || "Chef recommended today."}</div>
                          <div className="mt-1 text-xs font-semibold text-orange-700">INR {Number(it.price || 0).toFixed(0)}</div>
                        </div>
                        {!inCart ? (
                          <Button onClick={() => add(it)} className="h-8 rounded-full px-4 text-xs">
                            <Plus size={14} className="text-white" /> Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => remove(it)} className="h-7 w-7 rounded-full p-0 text-base font-bold">
                              -
                            </Button>
                            <div className="min-w-6 text-center text-xs font-semibold">{inCart.qty}</div>
                            <Button variant="outline" onClick={() => add(it)} className="h-7 w-7 rounded-full p-0 text-base font-bold">
                              +
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center text-sm text-slate-600 shadow-sm">
                No dishes match your search. Try another keyword or category.
              </div>
            ) : (
              filteredItems.map((it) => {
                const inCart = cart.find((x) => x._id === it._id);
                const available = it.isAvailable !== false;
                const isVeg = it.type === "veg";
                const isNonVeg = it.type === "non-veg";
                return (
                  <Card key={it._id} className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                    <CardContent className="p-0">
                      <div className="relative">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="h-44 w-full object-cover" />
                        ) : (
                          <div className="h-44 w-full bg-gradient-to-br from-orange-100 to-amber-100" />
                        )}
                        {!available && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-xs font-semibold uppercase tracking-widest text-white">
                            Sold out
                          </div>
                        )}
                        <div className="absolute left-3 top-3 flex gap-2">
                          {it.isSpecial && (
                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-orange-700 shadow">
                              Chef pick
                            </span>
                          )}
                          {isVeg && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              Veg
                            </span>
                          )}
                          {isNonVeg && (
                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                              Non-veg
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-900">{it.name}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {it.description || "Fresh, handmade, and served warm."}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-slate-900">INR {Number(it.price || 0).toFixed(0)}</div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">{it.category || "Menu"}</span>
                            {available ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Available</span>
                            ) : (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">Unavailable</span>
                            )}
                          </div>
                          {!inCart ? (
                            <Button onClick={() => add(it)} className="h-9 rounded-full px-4 text-xs" disabled={!available}>
                              <Plus size={16} className="text-white" /> Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={() => remove(it)} className="h-8 w-8 rounded-full p-0 text-lg font-bold">
                                -
                              </Button>
                              <div className="min-w-6 text-center text-sm font-semibold">{inCart.qty}</div>
                              <Button variant="outline" onClick={() => add(it)} className="h-8 w-8 rounded-full p-0 text-lg font-bold">
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 z-20 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">{cartCount} item(s)</div>
              <div className="text-lg font-extrabold text-slate-900">INR {total.toFixed(0)}</div>
            </div>
            <Button onClick={openCart} className="rounded-full px-5">
              View Cart
            </Button>
          </div>
        </div>
      )}
      <CustomerBottomNav cafeId={cafeId} />
    </main>
  );
}
