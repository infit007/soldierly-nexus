import { FileText } from "lucide-react";

const Others = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Others</h1>
          <p className="text-muted-foreground">Manage skills, experience, references, and documents</p>
        </div>
      </div>
      <div className="text-center text-muted-foreground">
        Others form coming soon...
      </div>
    </div>
  );
};

export default Others;