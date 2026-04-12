"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/ImageUpload";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    timezone: "America/New_York",
    photoUrl: "",
    wifiName: "",
    wifiPassword: "",
    checkoutInstructions: "",
    houseRules: "",
    hostName: "",
    hostPhone: "",
    hostEmail: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create property");
      }

      const property = await res.json();
      router.push(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Property</h1>
        <p className="mt-1 text-gray-500">
          Add a new property to your Guestboard account.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Property Details */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Property Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Property Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="Beach House, Mountain Cabin, etc."
              />
            </div>

            <div>
              <ImageUpload
                label="Property Photo"
                hint="This photo is shown on the property dashboard and as a fallback TV background."
                value={form.photoUrl}
                onChange={(url) => update("photoUrl", url)}
              />
            </div>

            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Host Contact */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Host Contact
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="hostName"
                className="block text-sm font-medium text-gray-700"
              >
                Host Name
              </label>
              <input
                id="hostName"
                type="text"
                value={form.hostName}
                onChange={(e) => update("hostName", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label
                htmlFor="hostPhone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                id="hostPhone"
                type="tel"
                value={form.hostPhone}
                onChange={(e) => update("hostPhone", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label
                htmlFor="hostEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="hostEmail"
                type="email"
                value={form.hostEmail}
                onChange={(e) => update("hostEmail", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="host@example.com"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Location
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Street Address
              </label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="Nashville"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700"
                >
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="TN"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="zip"
                  className="block text-sm font-medium text-gray-700"
                >
                  ZIP Code
                </label>
                <input
                  id="zip"
                  type="text"
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="37201"
                />
              </div>
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700"
                >
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="US"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Guest Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Guest Information
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="houseRules"
                className="block text-sm font-medium text-gray-700"
              >
                House Rules
              </label>
              <textarea
                id="houseRules"
                rows={4}
                value={form.houseRules}
                onChange={(e) => update("houseRules", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                placeholder="No smoking, quiet hours after 10pm, etc."
              />
            </div>

            <div>
              <label
                htmlFor="checkoutInstructions"
                className="block text-sm font-medium text-gray-700"
              >
                Checkout Instructions
              </label>
              <textarea
                id="checkoutInstructions"
                rows={4}
                value={form.checkoutInstructions}
                onChange={(e) => update("checkoutInstructions", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                placeholder="Please strip the beds, start the dishwasher, and lock the door."
              />
            </div>
          </div>
        </section>

        {/* WiFi & Instructions */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            WiFi & Instructions
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="wifiName"
                  className="block text-sm font-medium text-gray-700"
                >
                  WiFi Network Name
                </label>
                <input
                  id="wifiName"
                  type="text"
                  value={form.wifiName}
                  onChange={(e) => update("wifiName", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="MyWiFi"
                />
              </div>
              <div>
                <label
                  htmlFor="wifiPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  WiFi Password
                </label>
                <input
                  id="wifiPassword"
                  type="text"
                  value={form.wifiPassword}
                  onChange={(e) => update("wifiPassword", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  placeholder="password123"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {saving ? "Creating..." : "Create Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
