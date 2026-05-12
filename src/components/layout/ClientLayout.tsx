import { Outlet } from "react-router-dom";
import { ClientSidebar } from "@/components/layout/ClientSidebar";

export default function ClientLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <ClientSidebar />
      <main className="flex-1 min-w-0 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
