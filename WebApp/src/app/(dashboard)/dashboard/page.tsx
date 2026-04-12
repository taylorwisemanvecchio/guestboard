import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PropertyCard } from "@/components/properties/PropertyCard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    include: {
      stays: {
        where: { status: "active" },
        select: { guestName: true },
        take: 1,
      },
      _count: {
        select: {
          devices: { where: { status: "active" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Manage your properties and guests in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            id={property.id}
            name={property.name}
            city={property.city}
            state={property.state}
            activeGuest={property.stays[0]?.guestName ?? null}
            deviceCount={property._count.devices}
          />
        ))}

        <Link
          href="/properties/new"
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-400 transition hover:border-teal-400 hover:text-teal-600 min-h-[160px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span className="text-sm font-medium">Add Property</span>
        </Link>
      </div>

      {properties.length === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          You don&apos;t have any properties yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
