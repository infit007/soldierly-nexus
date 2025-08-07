import { Calendar } from "lucide-react";

const Leave = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave</h1>
          <p className="text-muted-foreground">Manage leave applications, balance, and history</p>
        </div>
      </div>
      <div className="text-center text-muted-foreground">
        Leave form coming soon...
      </div>
    </div>
  );
};

export default Leave;