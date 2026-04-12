import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WeatherWidget } from "./WeatherWidget";

export default async function PropertyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
    include: {
      stays: {
        where: { status: { in: ["active", "upcoming"] } },
        orderBy: { checkIn: "asc" },
        take: 2,
      },
      _count: {
        select: {
          devices: { where: { status: "active" } },
          stays: true,
          recommendations: { where: { hidden: false } },
        },
      },
    },
  });

  if (!property) notFound();

  const activeStay = property.stays.find((s) => s.status === "active");
  const nextStay = property.stays.find((s) => s.status === "upcoming");

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Property Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Property
          </h3>
          <p className="mt-2 text-sm text-gray-900">
            {[property.address, property.city, property.state]
              .filter(Boolean)
              .join(", ") || "No address set"}
          </p>
          {property.wifiName && (
            <p className="mt-1 text-xs text-gray-500">
              WiFi: {property.wifiName}
            </p>
          )}
        </div>

        {/* Current Guest */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Current Guest
          </h3>
          {activeStay ? (
            <>
              <p className="mt-2 text-sm font-semibold text-teal-700">
                {activeStay.guestName}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Checkout{" "}
                {new Date(activeStay.checkOut).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No active guest</p>
          )}
        </div>

        {/* Next Guest */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Next Guest
          </h3>
          {nextStay ? (
            <>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {nextStay.guestName}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Arrives{" "}
                {new Date(nextStay.checkIn).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No upcoming stays</p>
          )}
        </div>

        {/* Weather */}
        <WeatherWidget propertyId={id} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {property._count.stays}
          </p>
          <p className="mt-1 text-xs text-gray-500">Total Stays</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {property._count.devices}
          </p>
          <p className="mt-1 text-xs text-gray-500">Active Devices</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {property._count.recommendations}
          </p>
          <p className="mt-1 text-xs text-gray-500">Recommendations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/properties/${id}/calendar`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add Stay
          </Link>
          <Link
            href={`/properties/${id}/devices`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
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
            Pair Device
          </Link>
          <Link
            href={`/properties/${id}/recommendations`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            Manage Recommendations
          </Link>
          <Link
            href={`/properties/${id}/settings`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
