"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudBase = cloudName
  ? `https://res.cloudinary.com/${cloudName}/image/upload`
  : "https://res.cloudinary.com/demo/image/upload";

const buildImage = (publicId, transforms = "f_auto,q_auto") =>
  `${cloudBase}/${transforms}/${publicId}`;

const steps = [
  {
    title: "Scan & unlock",
    copy: "Scan the QR to instantly open the menu for your table.",
  },
  {
    title: "Pick your cravings",
    copy: "Browse curated menus, add notes, and split items.",
  },
  {
    title: "Track in real time",
    copy: "Watch your order move from kitchen to table.",
  },
];

const stats = [
  { label: "Avg. order time", value: "2.4 min" },
  { label: "Menu items", value: "120+" },
  { label: "Repeat guests", value: "68%" },
];

const menuCategories = ["All", "Breakfast", "Lunch", "Dessert"];

const dishes = [
  {
    id: 1,
    name: "Truffle mushroom toast",
    price: "INR 280",
    category: "Breakfast",
    image: "samples/food/spices",
  },
  {
    id: 2,
    name: "Citrus salmon bowl",
    price: "INR 520",
    category: "Lunch",
    image: "samples/food/fish",
  },
  {
    id: 3,
    name: "Garden pesto pasta",
    price: "INR 420",
    category: "Lunch",
    image: "samples/food/pasta",
  },
  {
    id: 4,
    name: "Berry cloud gelato",
    price: "INR 210",
    category: "Dessert",
    image: "samples/food/dessert",
  },
];

const experienceCards = [
  {
    title: "Smart seating",
    copy: "Auto-detect table and let guests switch seats with one tap.",
  },
  {
    title: "Live offers",
    copy: "Flash happy-hour deals that update instantly on the menu.",
  },
  {
    title: "Unified payments",
    copy: "Split bills and accept UPI, cards, or wallets seamlessly.",
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredDishes = useMemo(() => {
    if (activeCategory === "All") return dishes;
    return dishes.filter((dish) => dish.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl animate-glow" />
      <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-emerald-300/40 blur-3xl animate-glow" />

      <section className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              Q
            </div>
            <div className="text-lg font-semibold text-slate-900">QRDine Universal</div>
          </div>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
            <a href="#how" className="hover:text-emerald-600">How it works</a>
            <a href="#experience" className="hover:text-emerald-600">Experience</a>
            <a href="#menu" className="hover:text-emerald-600">Menu</a>
            <a
              href="/login"
              className="rounded-full bg-slate-900 px-5 py-2 text-white transition hover:-translate-y-0.5"
            >
              Login
            </a>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow">
              Universal cafe pre-scan page
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Make the first impression before the QR is scanned.
            </h1>
            <p className="max-w-xl text-lg text-slate-700">
              A polished home screen that sets the mood, captures table info, and guides guests into
              the perfect ordering flow.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
                Start ordering
              </button>
              <button className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                Explore cafe
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                  <div className="text-xl font-semibold text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass shadow-luxe relative overflow-hidden rounded-[32px] p-6">
              <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-amber-400/60 blur-2xl animate-floaty" />
              <div className="absolute -left-10 bottom-10 h-24 w-24 rounded-full bg-emerald-400/60 blur-2xl animate-floaty" />

              <div className="space-y-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Featured today</div>
                <div className="font-display text-2xl text-slate-900">Golden hour espresso</div>

                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                  <Image
                    src={buildImage("samples/food/coffee", "f_auto,q_auto,c_fill,w_900,h_1100")}
                    alt="Cafe hero"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                  Scan any QR to begin. Your table and preferences stay saved for quick reorders.
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-6 hidden rounded-3xl bg-white/90 p-5 text-sm text-slate-700 shadow-xl lg:block">
              <div className="font-semibold text-slate-900">Live table preview</div>
              <p className="mt-2">Table 12 - 4 guests - Lunch mode</p>
              <p className="mt-1 text-emerald-700">Kitchen ETA: 8 mins</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="glass shadow-luxe rounded-3xl p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">How it works</div>
              <h2 className="font-display text-3xl text-slate-900">Three taps to a perfect order</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                A smooth onboarding flow that mirrors your best in-house service.
              </p>
            </div>
            <button className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700">
              View demo
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl bg-white/80 p-5">
                <div className="text-sm font-semibold text-emerald-600">0{index + 1}</div>
                <div className="mt-3 text-lg font-semibold text-slate-900">{step.title}</div>
                <p className="mt-2 text-sm text-slate-600">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">The experience</div>
            <h2 className="font-display text-3xl text-slate-900">Designed for both guests and staff</h2>
            <p className="text-sm text-slate-600">
              Let customers explore on their own while your team focuses on hospitality. Every screen
              is crafted to feel like a premium in-cafe interaction.
            </p>
            <div className="grid gap-4">
              {experienceCards.map((card) => (
                <div key={card.title} className="glass rounded-2xl p-4">
                  <div className="font-semibold text-slate-900">{card.title}</div>
                  <p className="mt-2 text-sm text-slate-600">{card.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-slate-900">
            <div className="absolute inset-0">
              <Image
                src={buildImage("samples/food/kitchen", "f_auto,q_auto,c_fill,w_1200,h_900")}
                alt="Cafe interior"
                fill
                className="object-cover opacity-80"
              />
            </div>
            <div className="relative space-y-6 p-8 text-white">
              <div className="text-sm uppercase tracking-wide text-white/70">Live dashboard</div>
              <h3 className="font-display text-2xl">Kitchen sync + guest delight</h3>
              <p className="text-sm text-white/80">
                Every new order instantly appears for the kitchen, while guests see realtime status
                updates without asking staff.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs">Auto-print tickets</span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs">Smart routing</span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-xs">Table merging</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Featured menu</div>
            <h2 className="font-display text-3xl text-slate-900">Seasonal highlights</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Showcase signature dishes before the QR scan to build appetite.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {menuCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === category
                    ? "bg-emerald-600 text-white"
                    : "bg-white/80 text-slate-700 hover:bg-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filteredDishes.map((dish) => (
            <article key={dish.id} className="glass shadow-luxe overflow-hidden rounded-3xl">
              <div className="relative h-56">
                <Image
                  src={buildImage(dish.image, "f_auto,q_auto,c_fill,w_900,h_600")}
                  alt={dish.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-slate-900">{dish.name}</div>
                  <div className="text-sm font-semibold text-emerald-600">{dish.price}</div>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Crafted for your cafe&apos;s signature vibe, ready to add instantly.
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-3xl bg-slate-900 p-8 text-white md:flex-row md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Ready to serve</div>
            <h3 className="font-display text-2xl">Let guests scan and order in seconds</h3>
            <p className="mt-2 text-sm text-white/70">
              Cloudinary-powered media, fast menus, and a premium first impression.
            </p>
          </div>
          <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">
            Launch QR flow
          </button>
        </div>
      </section>
    </main>
  );
}
