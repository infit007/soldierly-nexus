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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";

const yearSchema = z
  .string()
  .regex(/^[0-9]{4}$/, { message: "Enter a valid year" })
  .optional()
  .or(z.literal(""));

const optionalString = z.string().optional().or(z.literal(""));

const educationSchema = z.object({
  // Highest education (all optional now)
  qualification: optionalString,
  fieldOfStudy: optionalString,
  institution: optionalString,
  graduationYear: yearSchema,
  certifications: optionalString,

  // 10th (Secondary)
  tenthBoard: optionalString,
  tenthSchool: optionalString,
  tenthYear: yearSchema,
  tenthPercentageOrGPA: optionalString,

  // 12th (Higher Secondary)
  twelfthBoard: optionalString,
  twelfthSchool: optionalString,
  twelfthStream: optionalString, // e.g., Science/Commerce/Arts
  twelfthYear: yearSchema,
  twelfthPercentageOrGPA: optionalString,
});

type EducationFormData = z.infer<typeof educationSchema>;

export function EducationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const [documents, setDocuments] = useState<any>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      qualification: "",
      fieldOfStudy: "",
      institution: "",
      graduationYear: "",
      certifications: "",

      tenthBoard: "",
      tenthSchool: "",
      tenthYear: "",
      tenthPercentageOrGPA: "",

      twelfthBoard: "",
      twelfthSchool: "",
      twelfthStream: "",
      twelfthYear: "",
      twelfthPercentageOrGPA: "",
    },
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const profile = await apiFetch<any>("/api/profile");
      if (profile?.documents?.education) {
        setDocuments(prev => ({ ...prev, education: profile.documents.education }));
      }
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
          const key = user ? `educationDetails:${user.id}` : "educationDetails";
          localStorage.setItem(key, JSON.stringify(data));
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiFetch<any>("/api/profile");
        if (!cancelled && profile?.education) {
          form.reset(profile.education);
          return;
        }
      } catch {}
      const key = user ? `educationDetails:${user.id}` : "educationDetails";
      const saved = localStorage.getItem(key);
      if (saved) form.reset(JSON.parse(saved));
    }
    load();
    return () => { cancelled = true };
  }, [form, user]);

  const onSubmit = async (data: EducationFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/education", { method: "PUT", body: JSON.stringify(data) });
      const key = user ? `educationDetails:${user.id}` : "educationDetails";
      localStorage.setItem(key, JSON.stringify(data));
      toast({
        title: "Success",
        description: "Education details saved",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save education details",
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
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Education Details</h1>
          <p className="text-muted-foreground">Manage your educational qualifications and certificates</p>
        </div>
        {autoSaveStatus !== "idle" && (
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {autoSaveStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
            {autoSaveStatus === "saved" && <span className="text-success">Auto-saved</span>}
          </div>
        )}
      </div>

      <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Education Details</CardTitle>
        <CardDescription>
          Enter your academic qualifications and certifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Highest Education */}
            <section className="space-y-6">
              <h3 className="text-base font-semibold">Highest Education</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Highest Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bachelor's" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input placeholder="University/College" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="graduationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Graduation</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <FormControl>
                      <Input placeholder="Comma separated certifications" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* 10th (Secondary) */}
            <section className="space-y-6">
              <h3 className="text-base font-semibold">10th (Secondary)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tenthBoard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CBSE/ICSE/State Board" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenthSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <FormControl>
                        <Input placeholder="School name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Passing</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenthPercentageOrGPA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage/GPA</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 89% or 9.2 CGPA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* 12th (Higher Secondary) */}
            <section className="space-y-6">
              <h3 className="text-base font-semibold">12th (Higher Secondary)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="twelfthBoard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CBSE/ICSE/State Board" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twelfthSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School/College</FormLabel>
                      <FormControl>
                        <Input placeholder="Institution name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twelfthStream"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Science/Commerce/Arts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twelfthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Passing</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twelfthPercentageOrGPA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage/GPA</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 92% or 9.5 CGPA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {autoSaveStatus === "saving" && "Saving..."}
                {autoSaveStatus === "saved" && "Saved"}
              </div>
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
      section="education"
      onDocumentUpload={handleDocumentUpload}
      existingDocument={documents.education}
      onDocumentRemove={handleDocumentRemove}
    />
  </div>
);
}
