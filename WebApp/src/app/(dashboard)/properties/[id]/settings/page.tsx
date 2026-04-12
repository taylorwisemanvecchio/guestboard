"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface Settings {
  welcomeTemplate: string;
  showWeather: boolean;
  showRecommendations: boolean;
  showWifi: boolean;
  showCheckout: boolean;
  accentColor: string;
  theme: string;
  backgroundImageUrl: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  welcomeTemplate: "Welcome, {{guestName}}!",
  showWeather: true,
  showRecommendations: true,
  showWifi: true,
  showCheckout: true,
  accentColor: "#0096a6",
  theme: "dark",
  backgroundImageUrl: "",
  logoUrl: "",
};

const ACCENT_COLORS = [
  { value: "#0096a6", label: "Teal" },
  { value: "#2563eb", label: "Blue" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#16a34a", label: "Green" },
  { value: "#ca8a04", label: "Gold" },
  { value: "#475569", label: "Slate" },
];

export default function SettingsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [propertyName, setPropertyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      // Fetch property name
      const propRes = await fetch(`/api/properties/${propertyId}`);
      if (propRes.ok) {
        const propData = await propRes.json();
        setPropertyName(propData.name || "");
      }

      const res = await fetch(
        `/api/properties/${propertyId}/settings`
      );
      if (res.ok) {
        const data = await res.json();
        setSettings({
          welcomeTemplate: data.welcomeTemplate ?? DEFAULT_SETTINGS.welcomeTemplate,
          showWeather: data.showWeather ?? DEFAULT_SETTINGS.showWeather,
          showRecommendations: data.showRecommendations ?? DEFAULT_SETTINGS.showRecommendations,
          showWifi: data.showWifi ?? DEFAULT_SETTINGS.showWifi,
          showCheckout: data.showCheckout ?? DEFAULT_SETTINGS.showCheckout,
          accentColor: data.accentColor ?? DEFAULT_SETTINGS.accentColor,
          theme: data.theme ?? DEFAULT_SETTINGS.theme,
          backgroundImageUrl: data.backgroundImageUrl ?? DEFAULT_SETTINGS.backgroundImageUrl,
          logoUrl: data.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
        });
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      // Save property name
      await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: propertyName }),
      });

      // Save settings
      const res = await fetch(
        `/api/properties/${propertyId}/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }
      );
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  function toggleSetting(key: keyof Settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 text-center text-gray-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Display Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Customize how your property appears on the guest TV screen.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Property Name */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Property Name
          </h3>
          <input
            type="text"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            placeholder="My Beach House"
          />
        </section>

        {/* Welcome Template */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Welcome Message
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Use <code className="rounded bg-gray-100 px-1">{"{{guestName}}"}</code>{" "}
            as a placeholder for the guest&apos;s name.
          </p>
          <input
            type="text"
            value={settings.welcomeTemplate}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                welcomeTemplate: e.target.value,
              }))
            }
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            placeholder="Welcome, {{guestName}}!"
          />
        </section>

        {/* Visibility Toggles */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Guest Screen Sections
          </h3>
          <div className="space-y-4">
            {[
              { key: "showWeather" as const, label: "Weather", desc: "Show current weather conditions" },
              { key: "showRecommendations" as const, label: "Recommendations", desc: "Show local recommendations" },
              { key: "showWifi" as const, label: "WiFi Info", desc: "Show WiFi name and password" },
              { key: "showCheckout" as const, label: "Checkout Info", desc: "Show checkout instructions" },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[item.key] as boolean}
                  onClick={() => toggleSetting(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings[item.key] ? "bg-teal-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                      settings[item.key]
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* TV Background Image */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <ImageUpload
            label="TV Background Image"
            hint="This image is displayed full-screen behind the frosted glass cards on the TV."
            value={settings.backgroundImageUrl}
            onChange={(url) =>
              setSettings((prev) => ({ ...prev, backgroundImageUrl: url }))
            }
          />
        </section>

        {/* Logo */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <ImageUpload
            label="Property Logo"
            hint="Displayed in the top-left corner of the TV screen. Works best with a transparent PNG."
            value={settings.logoUrl}
            onChange={(url) =>
              setSettings((prev) => ({ ...prev, logoUrl: url }))
            }
          />
        </section>

        {/* Appearance */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Appearance
          </h3>

          <div className="space-y-5">
            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        accentColor: color.value,
                      }))
                    }
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      settings.accentColor === color.value
                        ? "border-gray-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="flex gap-3">
                {["dark", "light"].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, theme }))
                    }
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium capitalize transition ${
                      settings.theme === theme
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              Settings saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
