import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, GraduationCap, Users, Calendar, Stethoscope, DollarSign, Settings, Home, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth()
  const showSidebar = user?.role !== 'MANAGER'

  const navigation = [
    { name: "Home", href: "/", icon: Home, role: 'USER' },
    { name: "Personal Details", href: "/personal-details", icon: User, role: 'USER' },
    { name: "Education", href: "/education", icon: GraduationCap, role: 'USER' },
    { name: "Family", href: "/family", icon: Users, role: 'USER' },
    { name: "Leave", href: "/leave", icon: Calendar, role: 'USER' },
    { name: "Medical", href: "/medical", icon: Stethoscope, role: 'USER' },
    { name: "Salary", href: "/salary", icon: DollarSign, role: 'USER' },
    { name: "Others", href: "/others", icon: Settings, role: 'USER' },
    { name: "Manager", href: "/manager", icon: Users, role: 'MANAGER' },
  ].filter(item => !user || user.role === item.role || item.role === 'USER')

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-6 border-b justify-between">
        <Logo size="md" linkTo="/" />
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Link to="/admin-dashboard" className="text-xs text-primary flex items-center gap-1"><Shield className="h-3 w-3"/> Admin</Link>
          )}
          <ThemeToggle />
        </div>
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
        {user ? (
          <Link
            to="/logout"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        ) : (
          <Link
            to="/login"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LogOut className="h-4 w-4" />
            Login
          </Link>
        )}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {showSidebar && (
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
      )}

      {showSidebar && (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow border-r bg-background">
            <Sidebar />
          </div>
        </div>
      )}

      {!showSidebar && (
        <div className="flex h-14 items-center justify-between px-4 border-b bg-background">
          <Logo size="sm" linkTo="/" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/logout"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Link>
          </div>
        </div>
      )}

      <div className={cn({ 'md:pl-64': showSidebar })}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
