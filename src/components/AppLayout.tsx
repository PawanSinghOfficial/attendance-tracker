import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <div className="ml-20">
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
