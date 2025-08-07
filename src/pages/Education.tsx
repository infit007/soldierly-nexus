import { GraduationCap } from "lucide-react";

const Education = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Education</h1>
          <p className="text-muted-foreground">Manage your educational qualifications and certifications</p>
        </div>
      </div>
      <div className="text-center text-muted-foreground">
        Education form coming soon...
      </div>
    </div>
  );
};

export default Education;