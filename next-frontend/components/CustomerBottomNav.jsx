"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ShoppingCart, UtensilsCrossed, ClipboardList } from "lucide-react";

export default function CustomerBottomNav({ cafeId, tableNumber, tableToken }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [table, setTable] = useState(() =>
    tableNumber !== undefined && tableNumber !== null && tableNumber !== "" ? String(tableNumber) : ""
  );
  const tokenParam = tableToken ? `&t=${encodeURIComponent(tableToken)}` : "";

  useEffect(() => {
    if (tableNumber !== undefined && tableNumber !== null && tableNumber !== "") {
      setTable(String(tableNumber));
      return;
    }
    const next = searchParams.get("table");
    if (next !== null && next !== undefined) setTable(next);
  }, [searchParams, tableNumber]);

  const links = [
    { key: "menu", label: "Menu", href: `/${cafeId}/menu?table=${table || ""}${tokenParam}`, icon: UtensilsCrossed },
    { key: "orders", label: "Orders", href: `/${cafeId}/orders?table=${table || ""}${tokenParam}`, icon: ClipboardList },
    { key: "cart", label: "Cart", href: `/${cafeId}/cart?table=${table || ""}${tokenParam}`, icon: ShoppingCart },
  ];

  const isActive = (key) => pathname?.includes(`/${key}`);

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-[min(520px,calc(100%-1.5rem))] -translate-x-1/2 pb-4">
      <div className="rounded-2xl border border-white/70 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur">
        <div className="grid grid-cols-3 gap-1 p-2 text-xs font-semibold">
          {links.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key);
            return (
              <a
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition ${
                  active ? "bg-gradient-to-r from-orange-500 via-amber-400 to-amber-300 text-white shadow shadow-orange-500/30" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-white/20" : "bg-slate-100"}`}>
                  <Icon size={16} />
                </span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
