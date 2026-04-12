"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface Recommendation {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string;
  hidden: boolean;
  custom: boolean;
  placeId: string | null;
  photoUrl: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
  hostNote: string | null;
  sortOrder: number;
}

interface AutocompleteResult {
  placeId: string;
  name: string;
  address: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  description: string;
}

const CATEGORIES = [
  "restaurant",
  "bar",
  "coffee",
  "park",
  "things_to_do",
  "shopping",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "Restaurants",
  bar: "Bars",
  coffee: "Coffee",
  park: "Parks",
  things_to_do: "Things to Do",
  shopping: "Shopping",
};

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "🍽",
  bar: "🍸",
  coffee: "☕",
  park: "🌳",
  things_to_do: "🎯",
  shopping: "🛍",
};

export default function RecommendationsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyLat, setPropertyLat] = useState<number | null>(null);
  const [propertyLng, setPropertyLng] = useState<number | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("restaurant");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AutocompleteResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Confirmation step state
  const [confirmPlace, setConfirmPlace] = useState<PlaceDetails | null>(null);
  const [hostNote, setHostNote] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manual add state
  const [addMode, setAddMode] = useState<"search" | "manual">("search");
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualPhotoUrl, setManualPhotoUrl] = useState("");
  const [manualHostNote, setManualHostNote] = useState("");

  // Edit host note state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch property coordinates
  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          setPropertyLat(data.latitude ?? null);
          setPropertyLng(data.longitude ?? null);
        }
      } catch {
        // silently fail
      }
    }
    fetchProperty();
  }, [propertyId]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/recommendations?includeHidden=true`
      );
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim() || propertyLat == null || propertyLng == null) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          lat: String(propertyLat),
          lng: String(propertyLng),
          category: selectedCategory,
        });
        const res = await fetch(`/api/places/autocomplete?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        // silently fail
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCategory, propertyLat, propertyLng]);

  async function handleAddPlace(result: AutocompleteResult) {
    setLoadingDetails(true);
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(result.placeId)}`
      );
      if (res.ok) {
        const details: PlaceDetails = await res.json();
        setConfirmPlace(details);
        setHostNote("");
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleConfirmAdd() {
    if (!confirmPlace) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: confirmPlace.name,
            category: selectedCategory,
            address: confirmPlace.address,
            description: confirmPlace.description,
            placeId: confirmPlace.placeId,
            photoUrl: confirmPlace.photoUrl,
            rating: confirmPlace.rating,
            latitude: confirmPlace.latitude,
            longitude: confirmPlace.longitude,
            hostNote: hostNote.trim() || null,
            custom: false,
          }),
        }
      );
      if (res.ok) {
        setConfirmPlace(null);
        setHostNote("");
        setSearchQuery("");
        setSearchResults([]);
        setShowAddModal(false);
        await fetchRecommendations();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleManualAdd() {
    if (!manualName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: manualName.trim(),
            category: selectedCategory,
            address: manualAddress.trim(),
            description: manualDescription.trim(),
            photoUrl: manualPhotoUrl || null,
            hostNote: manualHostNote.trim() || null,
            custom: true,
          }),
        }
      );
      if (res.ok) {
        closeModal();
        await fetchRecommendations();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisibility(rec: Recommendation) {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/recommendations?recommendationId=${rec.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hidden: !rec.hidden }),
        }
      );
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === rec.id ? { ...r, hidden: !r.hidden } : r
          )
        );
      }
    } catch {
      // silently fail
    }
  }

  async function handleDelete(rec: Recommendation) {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/recommendations?recommendationId=${rec.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
      }
    } catch {
      // silently fail
    }
  }

  async function handleSaveNote(rec: Recommendation) {
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/recommendations?recommendationId=${rec.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostNote: editNote.trim() || null }),
        }
      );
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === rec.id
              ? { ...r, hostNote: editNote.trim() || null }
              : r
          )
        );
        setEditingId(null);
        setEditNote("");
      }
    } catch {
      // silently fail
    }
  }

  function openModal() {
    setShowAddModal(true);
    setAddMode("search");
    setSelectedCategory("restaurant");
    setSearchQuery("");
    setSearchResults([]);
    setConfirmPlace(null);
    setHostNote("");
    setManualName("");
    setManualAddress("");
    setManualDescription("");
    setManualPhotoUrl("");
    setManualHostNote("");
  }

  function closeModal() {
    setShowAddModal(false);
    setConfirmPlace(null);
    setSearchQuery("");
    setSearchResults([]);
    setHostNote("");
    setManualName("");
    setManualAddress("");
    setManualDescription("");
    setManualPhotoUrl("");
    setManualHostNote("");
  }

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const items = recommendations.filter((r) => r.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<string, Recommendation[]>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recommendations
        </h2>
        <button
          onClick={openModal}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
        >
          + Add Recommendation
        </button>
      </div>

      {/* Add Recommendation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl mx-4 max-h-[85vh] overflow-y-auto">
            {!confirmPlace ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Recommendation
                </h3>

                {/* Mode toggle */}
                <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setAddMode("search")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      addMode === "search"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Search Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("manual")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      addMode === "manual"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Add Manually
                  </button>
                </div>

                {/* Category select */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>

                {addMode === "search" ? (
                  <>
                    {/* Search input */}
                    <div className="mb-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Places
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        placeholder={`Search for ${CATEGORY_LABELS[selectedCategory]?.toLowerCase() || "places"}...`}
                      />
                      {propertyLat == null && (
                        <p className="text-xs text-amber-600 mt-1">
                          Set property coordinates to enable location-based search.
                        </p>
                      )}
                    </div>

                    {/* Search results */}
                    {searching && (
                      <div className="text-sm text-gray-400 py-3 text-center">
                        Searching...
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4 max-h-64 overflow-y-auto">
                        {searchResults.map((result) => (
                          <div
                            key={result.placeId}
                            className="flex items-center justify-between p-3 hover:bg-gray-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {result.address}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddPlace(result)}
                              disabled={loadingDetails}
                              className="ml-3 shrink-0 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim() &&
                      !searching &&
                      searchResults.length === 0 && (
                        <div className="text-sm text-gray-400 py-3 text-center">
                          No results found.
                        </div>
                      )}
                  </>
                ) : (
                  /* Manual add form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        placeholder="e.g. Joe's Pizza"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                        placeholder="A short description..."
                      />
                    </div>
                    <ImageUpload
                      label="Photo (optional)"
                      value={manualPhotoUrl}
                      onChange={setManualPhotoUrl}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Host Note (optional)
                      </label>
                      <input
                        type="text"
                        value={manualHostNote}
                        onChange={(e) => setManualHostNote(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        placeholder="e.g. Best pizza in town!"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleManualAdd}
                        disabled={saving || !manualName.trim()}
                        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
                      >
                        {saving ? "Adding..." : "Add Recommendation"}
                      </button>
                    </div>
                  </div>
                )}

                {addMode === "search" && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Confirmation step */
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Confirm Recommendation
                </h3>

                <div className="flex gap-4 mb-4">
                  {confirmPlace.photoUrl && (
                    <img
                      src={confirmPlace.photoUrl}
                      alt={confirmPlace.name}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {confirmPlace.name}
                    </p>
                    {confirmPlace.rating != null && (
                      <p className="text-sm text-amber-600 mt-0.5">
                        {confirmPlace.rating} ★
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {confirmPlace.address}
                    </p>
                    {confirmPlace.description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {confirmPlace.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host Note (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={hostNote}
                    onChange={(e) => setHostNote(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                    placeholder="e.g. Best for brunch on weekends..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmPlace(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAdd}
                    disabled={saving}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition"
                  >
                    {saving ? "Adding..." : "Add Recommendation"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recommendations list */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">
          Loading recommendations...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          No recommendations yet. Click &quot;+ Add Recommendation&quot; to
          search and add places.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700 mb-3 flex items-center gap-2">
                <span>{CATEGORY_ICONS[category] || ""}</span>
                {CATEGORY_LABELS[category] || category}
                <span className="text-xs font-normal text-gray-400">
                  ({items.length})
                </span>
              </h3>
              <div className="space-y-2">
                {items.map((rec) => (
                  <div
                    key={rec.id}
                    className={`flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition ${
                      rec.hidden ? "opacity-50" : ""
                    }`}
                  >
                    {/* Photo thumbnail */}
                    {rec.photoUrl ? (
                      <img
                        src={rec.photoUrl}
                        alt={rec.name}
                        className="w-20 h-20 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-2xl">
                          {CATEGORY_ICONS[rec.category] || "📍"}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm font-medium text-gray-900 ${
                              rec.hidden ? "line-through" : ""
                            }`}
                          >
                            {rec.name}
                          </p>
                          {rec.rating != null && (
                            <span className="text-xs text-amber-600">
                              {rec.rating} ★
                            </span>
                          )}
                        </div>
                        {rec.custom && (
                          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                            Custom
                          </span>
                        )}
                      </div>
                      {rec.address && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {rec.address}
                        </p>
                      )}
                      {rec.description && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {rec.description}
                        </p>
                      )}

                      {/* Host note display/edit */}
                      {editingId === rec.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                            placeholder="Add a host note..."
                          />
                          <button
                            onClick={() => handleSaveNote(rec)}
                            className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditNote("");
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : rec.hostNote ? (
                        <p
                          className="mt-1 text-xs text-teal-700 italic cursor-pointer hover:underline"
                          onClick={() => {
                            setEditingId(rec.id);
                            setEditNote(rec.hostNote || "");
                          }}
                        >
                          Host: {rec.hostNote}
                        </p>
                      ) : null}

                      {/* Actions */}
                      <div className="mt-2 flex gap-2">
                        {editingId !== rec.id && (
                          <button
                            onClick={() => {
                              setEditingId(rec.id);
                              setEditNote(rec.hostNote || "");
                            }}
                            className="text-xs text-gray-500 hover:text-teal-600 transition"
                          >
                            {rec.hostNote ? "Edit note" : "Add note"}
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleVisibility(rec)}
                          className="text-xs text-gray-500 hover:text-teal-600 transition"
                        >
                          {rec.hidden ? "Show" : "Hide"}
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="text-xs text-gray-500 hover:text-red-600 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
