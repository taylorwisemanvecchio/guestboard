"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PropertySubNav } from "@/components/layout/PropertySubNav";

interface SubscriptionData {
  plan: string;
  planName: string;
  status: string;
  deviceLimit: number;
  activeDeviceCount: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
}

interface BillingData {
  subscription: SubscriptionData | null;
  activeDeviceCount: number;
}

const PLAN_FEATURES = {
  tv: {
    key: "tv",
    name: "Guestboard TV",
    price: 6.99,
    limit: "Up to 4 screens",
    features: [
      "Custom welcome messages",
      "Guest name personalization",
      "Wi-Fi & checkout info display",
      "Weather widget",
    ],
  },
  tv_pro: {
    key: "tv_pro",
    name: "Guestboard TV Pro",
    price: 10.99,
    limit: "Up to 10 screens",
    recommended: true,
    features: [
      "Everything in TV plan",
      "Up to 10 screens per property",
      "Local recommendations",
      "Custom branding & themes",
      "Priority support",
    ],
  },
};

export default function BillingPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchBilling() {
      try {
        // If returning from checkout success, sync subscription from Stripe
        if (searchParams.get("success") === "true") {
          // Retry sync a few times — Stripe may take a moment
          for (let attempt = 0; attempt < 3; attempt++) {
            const syncRes = await fetch("/api/stripe/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ propertyId }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.synced) break;
            }
            // Wait before retrying
            await new Promise((r) => setTimeout(r, 2000));
          }
        }

        const res = await fetch(`/api/properties/${propertyId}/billing`);
        if (res.ok) {
          const data = await res.json();
          setBilling(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [propertyId, searchParams]);

  async function handleSubscribe(plan: string) {
    setActionLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, plan }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const sub = billing?.subscription;
  const isActive = sub?.status === "active";
  const isPastDue = sub?.status === "past_due";
  const isCanceled = sub?.status === "canceled";

  return (
    <>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing</h2>

        {/* Success Toast */}
        {showSuccess && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            Subscription activated successfully! You can now pair devices.
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading billing info...</div>
        ) : !sub || isCanceled ? (
          /* No subscription / canceled - show plan cards */
          <div>
            {isCanceled && (
              <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                Your subscription has been canceled. Choose a plan below to resubscribe.
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Choose a plan to start pairing TV screens to your property.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(PLAN_FEATURES).map((plan) => (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border-2 bg-white p-6 transition ${
                    "recommended" in plan && plan.recommended
                      ? "border-teal-600 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {"recommended" in plan && plan.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-medium text-white">
                      Recommended
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-teal-700">{plan.limit}</p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={actionLoading === plan.key}
                    className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                      "recommended" in plan && plan.recommended
                        ? "bg-teal-600 text-white hover:bg-teal-700"
                        : "bg-white text-teal-600 border border-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    {actionLoading === plan.key ? "Redirecting..." : "Subscribe"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active or past_due subscription */
          <div className="space-y-6">
            {/* Cancel at period end banner */}
            {sub.cancelAtPeriodEnd && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                Your subscription will end on {formatDate(sub.currentPeriodEnd)}.
                Manage your billing to reactivate.
              </div>
            )}

            {/* Past due banner */}
            {isPastDue && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                Your payment is past due. Please update your payment method to avoid service interruption.
              </div>
            )}

            {/* Current plan card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <h3 className="text-xl font-semibold text-gray-900 mt-1">{sub.planName}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${sub.price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {sub.status}
                </span>
              </div>

              {/* Device usage bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Screen usage</span>
                  <span className="font-medium text-gray-900">
                    {sub.activeDeviceCount} of {sub.deviceLimit} screens
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-teal-600 transition-all"
                    style={{
                      width: `${Math.min(100, (sub.activeDeviceCount / sub.deviceLimit) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Next billing date */}
              {!sub.cancelAtPeriodEnd && (
                <p className="mt-4 text-sm text-gray-500">
                  Next billing date: {formatDate(sub.currentPeriodEnd)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleManageBilling}
                disabled={actionLoading === "portal"}
                className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {actionLoading === "portal" ? "Redirecting..." : "Manage Billing"}
              </button>

              {sub.plan === "tv" && !sub.cancelAtPeriodEnd && (
                <button
                  onClick={() => handleSubscribe("tv_pro")}
                  disabled={actionLoading === "tv_pro"}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {actionLoading === "tv_pro" ? "Redirecting..." : "Upgrade to TV Pro"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
