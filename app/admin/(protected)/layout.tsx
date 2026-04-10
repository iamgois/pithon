import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <main className="px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
