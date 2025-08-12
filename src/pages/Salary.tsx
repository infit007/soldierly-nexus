import { DollarSign } from "lucide-react";
import { SalaryForm } from "@/components/forms/SalaryForm";

const Salary = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-primary/10">
        <DollarSign className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Salary & Benefits</h1>
        <p className="text-muted-foreground">Manage your compensation and benefits details</p>
      </div>
    </div>
    <SalaryForm />
  </div>
);

export default Salary;
