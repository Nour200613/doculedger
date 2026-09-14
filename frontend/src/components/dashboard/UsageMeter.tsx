"use client";

import React, { useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useUIStore } from "@/store/uiStore";
import { translations } from "@/lib/translations";
import { Gauge, ArrowUpRight, Zap, ExternalLink, Check, X, ShieldCheck } from "lucide-react";

export function UsageMeter() {
  const { subscription } = useDashboardStore();
  const { locale } = useUIStore();
  const t = translations[locale].dashboard.quota;

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const percentage = Math.min(
    Math.round((subscription.invoicesUsed / subscription.monthlyLimit) * 100),
    100
  );

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const token = localStorage.getItem("docu_token") || "";
      const res = await fetch("http://localhost:8000/api/v1/payments/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.portal_url) {
          window.location.href = data.portal_url;
          return;
        }
      }
      alert("Opening Stripe Customer Portal...");
    } catch {
      alert("Stripe Sandbox portal initialized in test mode.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const token = localStorage.getItem("docu_token") || "";
      const res = await fetch("http://localhost:8000/api/v1/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
      }
      alert(`Stripe Checkout initialized for plan: ${planId}`);
    } catch {
      alert("Failed to initialize checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-navy-800 dark:text-blue-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.title}
              </h3>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {subscription.planName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {subscription.batchUploadAvailable && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                <Zap className="w-3 h-3" />
                {t.batchUploadEnabled}
              </span>
            )}

            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <span>{portalLoading ? "Opening..." : "Billing Portal"}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-900 text-white shadow-sm transition-all cursor-pointer"
            >
              <span>{t.upgradeBtn}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Progress Counter */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
              {subscription.invoicesUsed}
            </strong>{" "}
            / <span className="font-mono">{subscription.monthlyLimit}</span> {t.usedText}
          </div>
          <span className="font-mono text-xs font-bold text-navy-800 dark:text-blue-400">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              percentage > 85 ? "bg-amber-500" : "bg-navy-800 dark:bg-blue-500"
            }`}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>
            {t.renewsOn} {subscription.periodEnd}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {Math.max(0, subscription.monthlyLimit - subscription.invoicesUsed)} conversions remaining
          </span>
        </div>
      </div>

      {/* Upgrade & Tier Selection Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 end-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-navy-800 dark:text-blue-400 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Stripe Verified Checkout</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Upgrade Your Conversion Quota
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Automated credit provisioning, deterministic math auditing, and cancel anytime self-service.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Starter Tier */}
              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-navy-800 dark:hover:border-blue-500 transition-all flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Individual Accountant
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">$29</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span><strong>100 conversions</strong> / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Deterministic Math Audit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Clean Excel & CSV Exports</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout("starter_monthly")}
                  disabled={checkoutLoading === "starter_monthly"}
                  className="w-full py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center"
                >
                  {checkoutLoading === "starter_monthly" ? "Redirecting to Stripe..." : "Upgrade to Individual ($29/mo)"}
                </button>
              </div>

              {/* B2B Enterprise Tier */}
              <div className="p-4 rounded-xl border-2 border-navy-800 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 end-0 bg-navy-800 text-white text-[9px] font-bold px-3 py-0.5 rounded-es-lg uppercase">
                  Popular
                </div>
                <div>
                  <div className="text-xs font-bold text-navy-800 dark:text-blue-400 uppercase tracking-wider mb-1">
                    B2B Enterprise Pro
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">$99</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span><strong>1000 conversions</strong> / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Batch Async Queue Uploading</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Circuit Breaker Priority</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>SOC2 & GDPR Auto-Delete</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout("b2b_pro_monthly")}
                  disabled={checkoutLoading === "b2b_pro_monthly"}
                  className="w-full py-2 rounded-lg bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer text-center"
                >
                  {checkoutLoading === "b2b_pro_monthly" ? "Redirecting to Stripe..." : "Upgrade to Pro ($99/mo)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
