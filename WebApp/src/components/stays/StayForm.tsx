"use client";

import { useState } from "react";

interface Stay {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  welcomeNote: string | null;
  occasion: string | null;
  status: string;
}

interface StayFormProps {
  propertyId: string;
  stay?: Stay | null;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  onSave: () => void;
  onClose: () => void;
}

const OCCASIONS = [
  { value: "", label: "None" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "vacation", label: "Vacation" },
  { value: "business", label: "Business" },
  { value: "family", label: "Family Gathering" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function StayForm({ propertyId, stay, defaultCheckIn, defaultCheckOut, onSave, onClose }: StayFormProps) {
  const isEditing = !!stay;

  const [guestName, setGuestName] = useState(stay?.guestName ?? "");
  const [checkIn, setCheckIn] = useState(
    stay?.checkIn ? stay.checkIn.slice(0, 10) : (defaultCheckIn ?? "")
  );
  const [checkOut, setCheckOut] = useState(
    stay?.checkOut ? stay.checkOut.slice(0, 10) : (defaultCheckOut ?? "")
  );
  const [welcomeNote, setWelcomeNote] = useState(stay?.welcomeNote ?? "");
  const [occasion, setOccasion] = useState(stay?.occasion ?? "");
  const [status, setStatus] = useState(stay?.status ?? "upcoming");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = isEditing
        ? `/api/properties/${propertyId}/stays?stayId=${stay.id}`
        : `/api/properties/${propertyId}/stays`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          welcomeNote: welcomeNote || null,
          occasion: occasion || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save stay");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {isEditing ? "Edit Stay" : "New Stay"}
      </h3>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="guestName"
          className="block text-sm font-medium text-gray-700"
        >
          Guest Name *
        </label>
        <input
          id="guestName"
          type="text"
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
          placeholder="John Smith"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="checkIn"
            className="block text-sm font-medium text-gray-700"
          >
            Check-in *
          </label>
          <input
            id="checkIn"
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="checkOut"
            className="block text-sm font-medium text-gray-700"
          >
            Check-out *
          </label>
          <input
            id="checkOut"
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="welcomeNote"
          className="block text-sm font-medium text-gray-700"
        >
          Welcome Note
        </label>
        <textarea
          id="welcomeNote"
          rows={2}
          value={welcomeNote}
          onChange={(e) => setWelcomeNote(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
          placeholder="A personal welcome message for the guest..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="occasion"
            className="block text-sm font-medium text-gray-700"
          >
            Occasion
          </label>
          <select
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
          >
            {OCCASIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : isEditing ? "Update Stay" : "Create Stay"}
        </button>
      </div>
    </form>
  );
}
