import Link from "next/link";

interface PropertyCardProps {
  id: string;
  name: string;
  city: string;
  state: string;
  activeGuest: string | null;
  deviceCount: number;
}

export function PropertyCard({
  id,
  name,
  city,
  state,
  activeGuest,
  deviceCount,
}: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${id}`}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-teal-200"
    >
      <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
      {(city || state) && (
        <p className="mt-1 text-sm text-gray-500">
          {[city, state].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </span>
          {activeGuest ? (
            <span className="text-teal-700 font-medium">{activeGuest}</span>
          ) : (
            <span className="text-gray-400">No guest</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </span>
          <span className="text-gray-600">
            {deviceCount} {deviceCount === 1 ? "device" : "devices"}
          </span>
        </div>
      </div>
    </Link>
  );
}
