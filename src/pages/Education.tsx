import { GraduationCap } from "lucide-react";
import { EducationForm } from "@/components/forms/EducationForm";

const Education = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-primary/10">
        <GraduationCap className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Education</h1>
        <p className="text-muted-foreground">Manage your academic background and qualifications</p>
      </div>
    </div>
    <EducationForm />
  </div>
);

export default Education;
