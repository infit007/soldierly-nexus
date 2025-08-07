import { Heart } from "lucide-react";

const Medical = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical</h1>
          <p className="text-muted-foreground">Manage medical records, insurance, and health information</p>
        </div>
      </div>
      <div className="text-center text-muted-foreground">
        Medical form coming soon...
      </div>
    </div>
  );
};

export default Medical;