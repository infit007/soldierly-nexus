import { DollarSign } from "lucide-react";

const Salary = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <DollarSign className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salary</h1>
          <p className="text-muted-foreground">Manage salary details, allowances, and deductions</p>
        </div>
      </div>
      <div className="text-center text-muted-foreground">
        Salary form coming soon...
      </div>
    </div>
  );
};

export default Salary;