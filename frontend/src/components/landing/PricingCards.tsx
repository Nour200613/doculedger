"use client";

import React from "react";
import Link from "next/link";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { Check, Sparkles } from "lucide-react";

export function PricingCards() {
  const { locale } = useUIStore();
  const t = translations[locale].pricing;

  const plans = [
    {
      id: "freemium",
      key: "freemium" as const,
      data: t.plans.freemium,
      isFeatured: false,
      href: "/signup",
    },
    {
      id: "individual",
      key: "individual" as const,
      data: t.plans.individual,
      isFeatured: true,
      href: "/signup?plan=individual",
    },
    {
      id: "b2b",
      key: "b2b" as const,
      data: t.plans.b2b,
      isFeatured: false,
      href: "/signup?plan=b2b",
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl flex flex-col justify-between p-7 transition-all ${
                plan.isFeatured
                  ? "bg-white dark:bg-slate-900 border-2 border-navy-800 dark:border-blue-500 shadow-xl relative"
                  : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
              }`}
            >
              {plan.isFeatured && "badge" in plan.data && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-800 text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{"badge" in plan.data ? plan.data.badge : ""}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {plan.data.name}
                  </h3>
                  {!plan.isFeatured && "badge" in plan.data && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {"badge" in plan.data ? plan.data.badge : ""}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {plan.data.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {plan.data.price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {t.monthly}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8 text-xs text-slate-600 dark:text-slate-300">
                  {plan.data.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className={`w-full py-3 px-4 rounded-lg text-xs font-semibold text-center transition-all ${
                  plan.isFeatured
                    ? "bg-navy-800 hover:bg-navy-900 text-white shadow-md hover:shadow-lg"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white"
                }`}
              >
                {plan.data.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
