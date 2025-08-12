import { Calendar } from "lucide-react";
import { LeaveForm } from "@/components/forms/LeaveForm";

const Leave = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-primary/10">
        <Calendar className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
        <p className="text-muted-foreground">Manage your leave requests and vacation details</p>
      </div>
    </div>
    <LeaveForm />
  </div>
);

export default Leave;
