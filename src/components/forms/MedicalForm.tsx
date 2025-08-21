import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Stethoscope } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";
import { CustomFields, type CustomField } from "@/components/CustomFields";

const medicalSchema = z.object({
  bloodGroup: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  emergencyContact: z.string().optional(),
  lastCheckupDate: z.string().optional(),
  notes: z.string().optional(),
});

type MedicalFormData = z.infer<typeof medicalSchema>;

export function MedicalForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const [documents, setDocuments] = useState<any>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<MedicalFormData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      bloodGroup: "",
      height: "",
      weight: "",
      medicalConditions: "",
      allergies: "",
      medications: "",
      emergencyContact: "",
      lastCheckupDate: "",
      notes: "",
    },
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const profile = await apiFetch<any>("/api/profile");
      if (profile?.documents?.medical) {
        setDocuments(prev => ({ ...prev, medical: profile.documents.medical }));
      }
      if (profile?.medical?.customFields) setCustomFields(profile.medical.customFields);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleDocumentUpload = async (file: File, section: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', section);

    await apiFetch("/api/profile/documents", {
      method: "POST",
      body: formData,
      headers: {}, // Let the browser set the content-type for FormData
    });

    // Reload documents after upload
    await loadDocuments();
  };

  const handleDocumentRemove = async (section: string) => {
    await apiFetch(`/api/profile/documents/${section}`, {
      method: "DELETE",
    });

    // Update local state
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[section];
      return newDocs;
    });
  };

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (Object.values(data).some((val) => val !== "")) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          const key = user ? `medicalDetails:${user.id}` : "medicalDetails";
          localStorage.setItem(key, JSON.stringify({ ...data, customFields }));
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, user, customFields]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiFetch<any>("/api/profile");
        if (!cancelled && profile?.medical) {
          form.reset(profile.medical);
          if (profile.medical.customFields) setCustomFields(profile.medical.customFields);
          return;
        }
      } catch {}
      const key = user ? `medicalDetails:${user.id}` : "medicalDetails";
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
        if (parsed.customFields) setCustomFields(parsed.customFields);
      }
    }
    load();
    return () => { cancelled = true };
  }, [form, user]);

  const onSubmit = async (data: MedicalFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/medical", { method: "PUT", body: JSON.stringify({ ...data, customFields }) });
      const key = user ? `medicalDetails:${user.id}` : "medicalDetails";
      localStorage.setItem(key, JSON.stringify({ ...data, customFields }));
      toast({
        title: "Success",
        description: "Medical details saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save medical details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Stethoscope className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Details</h1>
          <p className="text-muted-foreground">Manage your medical information and health records</p>
        </div>
        {autoSaveStatus !== "idle" && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {autoSaveStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {autoSaveStatus === "saved" && <span className="text-success">Auto-saved</span>}
          </div>
        )}
      </div>

      <Card className="shadow-soft">
        <CardHeader className="bg-gradient-card rounded-t-lg">
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>Provide your medical details and health information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A+, B-, O+" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 175" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="medicalConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any medical conditions or chronic illnesses"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any allergies (food, medication, environmental)"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any current medications and dosages"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastCheckupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Medical Checkup</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional medical information or notes"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CustomFields
                title="Additional Medical Fields"
                description="Add extra medical information (e.g., Physician Phone)"
                value={customFields}
                onChange={setCustomFields}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="min-w-32">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Details
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <DocumentUpload
        section="medical"
        onDocumentUpload={handleDocumentUpload}
        existingDocument={documents.medical}
        onDocumentRemove={handleDocumentRemove}
      />
    </div>
  );
}

