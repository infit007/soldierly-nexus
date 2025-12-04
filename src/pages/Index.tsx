import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, User, GraduationCap, Users, Calendar, Stethoscope, DollarSign, Settings } from "lucide-react";

const Index = () => {
  const menuItems = [
    { title: "Personal Details", description: "Basic information and contact details", icon: User, path: "/personal-details" },
    { title: "Education", description: "Academic background and qualifications", icon: GraduationCap, path: "/education" },
    { title: "Family", description: "Family member information and dependents", icon: Users, path: "/family" },
    { title: "Leave", description: "Leave requests and vacation details", icon: Calendar, path: "/leave" },
    { title: "Medical", description: "Health information and medical records", icon: Stethoscope, path: "/medical" },
    { title: "Salary", description: "Compensation and benefits details", icon: DollarSign, path: "/salary" },
    { title: "Others", description: "Additional information and documents", icon: Settings, path: "/others" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Home className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Soldierly Nexus</h1>
          <p className="text-muted-foreground">Manage your employee information and records</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card key={item.path} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to={item.path}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
