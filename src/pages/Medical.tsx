import { Stethoscope } from "lucide-react";
import { MedicalForm } from "@/components/forms/MedicalForm";

const Medical = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-lg bg-primary/10">
        <Stethoscope className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medical Information</h1>
        <p className="text-muted-foreground">Manage your health information and medical records</p>
      </div>
    </div>
    <MedicalForm />
  </div>
);

export default Medical;
