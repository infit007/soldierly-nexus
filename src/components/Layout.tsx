import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, User, GraduationCap, Users, Calendar, Stethoscope, DollarSign, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Personal Details", href: "/personal-details", icon: User },
    { name: "Education", href: "/education", icon: GraduationCap },
    { name: "Family", href: "/family", icon: Users },
    { name: "Leave", href: "/leave", icon: Calendar },
    { name: "Medical", href: "/medical", icon: Stethoscope },
    { name: "Salary", href: "/salary", icon: DollarSign },
    { name: "Others", href: "/others", icon: Settings },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold">Soldierly Nexus</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r bg-background">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
