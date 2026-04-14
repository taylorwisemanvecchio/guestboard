"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface Device {
  id: string;
  name: string;
  lastSeen: string;
  status: string;
  createdAt: string;
}

interface BillingInfo {
  subscription: {
    plan: string;
    deviceLimit: number;
    activeDeviceCount: number;
    status: string;
  } | null;
  activeDeviceCount: number;
}

export default function DevicesPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);

  // Pairing modal state
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [pairingExpiry, setPairingExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  // Wipe state
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState("");

  const fetchDevices = useCallback(async () => {
    try {
      const [devicesRes, billingRes] = await Promise.all([
        fetch(`/api/properties/${propertyId}/devices`),
        fetch(`/api/properties/${propertyId}/billing`),
      ]);
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data);
      }
      if (billingRes.ok) {
        const data = await billingRes.json();
        setBillingInfo(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Countdown timer
  useEffect(() => {
    if (!pairingExpiry) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((pairingExpiry.getTime() - Date.now()) / 1000)
      );
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setShowPairingModal(false);
        setPairingCode("");
        setPairingExpiry(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pairingExpiry]);

  async function handleWipeCredentials() {
    if (!confirm("This will sign out all streaming apps (Netflix, Hulu, etc.) on all paired devices. Continue?")) return;
    setWiping(true);
    setWipeResult("");
    try {
      const res = await fetch(`/api/properties/${propertyId}/wipe`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setWipeResult(`Wipe command sent to ${data.devicesAffected} device(s). It will complete within 30 seconds.`);
        setTimeout(() => setWipeResult(""), 10000);
      } else {
        setWipeResult("Failed to send wipe command.");
      }
    } catch {
      setWipeResult("Failed to send wipe command.");
    } finally {
      setWiping(false);
    }
  }

  async function handleGenerateCode() {
    setGeneratingCode(true);
    try {
      const res = await fetch(`/api/pairing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPairingCode(data.code);
        setPairingExpiry(new Date(data.expiresAt));
        setShowPairingModal(true);
      }
    } catch {
      // silently fail
    } finally {
      setGeneratingCode(false);
    }
  }

  async function handleRename(deviceId: string) {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/devices?deviceId=${deviceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renamingValue }),
        }
      );
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, name: renamingValue } : d
          )
        );
        setRenamingId(null);
        setRenamingValue("");
      }
    } catch {
      // silently fail
    }
  }

  async function handleRevoke(deviceId: string) {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/devices?deviceId=${deviceId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, status: "revoked" } : d
          )
        );
      }
    } catch {
      // silently fail
    }
  }

  function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Devices
          {billingInfo?.subscription
            ? ` (${billingInfo.subscription.activeDeviceCount}/${billingInfo.subscription.deviceLimit})`
            : billingInfo
              ? ` (${billingInfo.activeDeviceCount})`
              : ""}
        </h2>
        {!billingInfo?.subscription ? (
          <Link
            href={`/properties/${propertyId}/billing`}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
          >
            Subscribe to pair devices
          </Link>
        ) : billingInfo.subscription.activeDeviceCount >= billingInfo.subscription.deviceLimit ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-600 font-medium">
              Device limit reached.{" "}
              <Link href={`/properties/${propertyId}/billing`} className="underline hover:text-amber-700">
                Upgrade on the Billing page
              </Link>
              .
            </span>
            <button
              disabled
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              Generate Pairing Code
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerateCode}
            disabled={generatingCode}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {generatingCode ? "Generating..." : "Generate Pairing Code"}
          </button>
        )}
      </div>

      {/* Wipe Credentials */}
      {devices.filter(d => d.status === "active").length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleWipeCredentials}
            disabled={wiping}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
          >
            {wiping ? "Sending wipe..." : "Wipe Streaming Credentials"}
          </button>
          <span className="text-xs text-gray-500">
            Signs out Netflix, Hulu, Disney+, and other streaming apps on all paired devices
          </span>
        </div>
      )}
      {wipeResult && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {wipeResult}
        </div>
      )}

      {/* Pairing Code Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPairingModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-8 shadow-xl mx-4 text-center">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">
              Pairing Code
            </h3>
            <p className="text-5xl font-mono font-bold tracking-[0.3em] text-teal-700">
              {pairingCode}
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Enter this code on the TV app to pair this device.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Expires in {formatCountdown(countdown)}
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowPairingModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">
          Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No devices paired yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Generate a pairing code to connect a TV.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Last Seen
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-3">
                    {renamingId === device.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renamingValue}
                          onChange={(e) => setRenamingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(device.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(device.id)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {device.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatRelativeTime(new Date(device.lastSeen))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        device.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {device.status === "active" && (
                        <>
                          <button
                            onClick={() => {
                              setRenamingId(device.id);
                              setRenamingValue(device.name);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleRevoke(device.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
