import { Users } from "lucide-react";
import { FamilyForm } from "@/components/forms/FamilyForm";

const Family = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-primary/10">
        <Users className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Family</h1>
        <p className="text-muted-foreground">Manage family member information and dependents</p>
      </div>
    </div>
    <FamilyForm />
  </div>
);

export default Family;
