import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PropertySubNav } from "@/components/layout/PropertySubNav";

export default async function PropertyLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });

  if (!property) notFound();

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-6 pt-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          {property.name}
        </h1>
      </div>
      <PropertySubNav propertyId={property.id} />
      <div>{children}</div>
    </div>
  );
}
