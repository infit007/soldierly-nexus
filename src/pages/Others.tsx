import { Settings } from "lucide-react";
import { OthersForm } from "@/components/forms/OthersForm";

const Others = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-primary/10">
        <Settings className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Additional Information</h1>
        <p className="text-muted-foreground">Manage additional information and documents</p>
      </div>
    </div>
    <OthersForm />
  </div>
);

export default Others;
