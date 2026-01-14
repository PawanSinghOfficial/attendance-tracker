import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <div className="md:ml-20 ml-0">
        <main className="p-6 lg:p-8 pb-24 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
