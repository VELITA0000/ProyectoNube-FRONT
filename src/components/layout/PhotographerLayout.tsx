import { Outlet } from "react-router-dom";
import { PhotographerSidebar } from "@/components/layout/PhotographerSidebar";

export default function PhotographerLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <PhotographerSidebar />
      <main className="flex-1 min-w-0 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
