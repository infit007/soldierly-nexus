import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  User,
  GraduationCap,
  Users,
  DollarSign,
  Heart,
  Calendar,
  FileText,
  Shield,
  Menu,
  X
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Personal Details", url: "/", icon: User },
  { title: "Education", url: "/education", icon: GraduationCap },
  { title: "Family", url: "/family", icon: Users },
  { title: "Salary", url: "/salary", icon: DollarSign },
  { title: "Medical", url: "/medical", icon: Heart },
  { title: "Leave", url: "/leave", icon: Calendar },
  { title: "Others", url: "/others", icon: FileText },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start transition-all duration-200 h-12";
    return isActive(path)
      ? `${baseClasses} bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm`
      : `${baseClasses} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;
  };

  return (
    <Sidebar className={`border-r border-sidebar-border ${collapsed ? "w-16" : "w-64"}`}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-sidebar-primary" />
            <span className="font-semibold text-sidebar-foreground">Army UMS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 p-0"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={`text-sidebar-foreground/70 text-xs uppercase tracking-wider font-medium mb-2 ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "Menu" : "Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}