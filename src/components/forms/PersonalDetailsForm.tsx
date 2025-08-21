import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";
import { CustomFields, type CustomField } from "@/components/CustomFields";

// Custom validation function for date gap
const validateDateGap = (dateOfBirth: string, dateOfJoining: string) => {
  if (!dateOfBirth || !dateOfJoining) return true; // Let individual field validation handle empty values
  
  const birthDate = new Date(dateOfBirth);
  const joiningDate = new Date(dateOfJoining);
  
  const ageAtJoining = joiningDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = joiningDate.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet in the joining year
  if (monthDiff < 0 || (monthDiff === 0 && joiningDate.getDate() < birthDate.getDate())) {
    return ageAtJoining - 1 >= 15;
  }
  
  return ageAtJoining >= 15;
};

const personalDetailsSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  serviceNumber: z
    .string()
    .min(5, "Army number is required")
    .regex(/^[A-Za-z0-9\-\/]+$/, "Army number may contain letters, numbers, - or /"),
  rank: z.string().min(1, "Rank is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z
    .string()
    .min(10, "Valid phone number is required")
    .regex(/^[0-9+\-\s()]{10,}$/, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z
    .string()
    .min(10, "Emergency contact phone is required")
    .regex(/^[0-9+\-\s()]{10,}$/, "Valid emergency contact phone is required"),
  emergencyContactRelation: z.string().min(1, "Emergency contact relation is required"),
}).refine((data) => validateDateGap(data.dateOfBirth, data.dateOfJoining), {
  message: "There must be at least 15 years between date of birth and date of joining",
  path: ["dateOfJoining"], // This will show the error on the dateOfJoining field
});

type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

const ranks = [
  "AV",
  "SEP",
  "L/NK",
  "NK",
  "AAV",
  "N/B SUB",
  "SUB",
  "SUB MAJ",
];

export function PersonalDetailsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [documents, setDocuments] = useState<any>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      fullName: "",
      serviceNumber: "",
      rank: "",
      dateOfJoining: "",
      dateOfBirth: "",
      phoneNumber: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
    },
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const profile = await apiFetch<any>("/api/profile");
      if (profile?.documents?.personal) {
        setDocuments(prev => ({ ...prev, personal: profile.documents.personal }));
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

  // Auto-save functionality (local fallback, namespaced by user)
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (Object.values(data).some((value) => value !== "")) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          try {
            const key = user ? `personalDetails:${user.id}` : "personalDetails";
            localStorage.setItem(key, JSON.stringify(data));
          } catch {
            // ignore storage errors
          }
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, user]);

  // Load saved data from API on mount; fallback to localStorage
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiFetch<any>("/api/profile");
        if (!cancelled && profile?.personalDetails) {
          form.reset(profile.personalDetails);
          setCustomFields(Array.isArray(profile.personalDetails.customFields) ? profile.personalDetails.customFields : []);
          return;
        }
      } catch {}
      try {
        const key = user ? `personalDetails:${user.id}` : "personalDetails";
        const savedData = localStorage.getItem(key);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          form.reset(parsed);
          setCustomFields(Array.isArray(parsed.customFields) ? parsed.customFields : []);
        }
      } catch {}
    }
    load();
    return () => { cancelled = true };
  }, [form, user]);

  const onSubmit = async (data: PersonalDetailsFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/personal", { method: "PUT", body: JSON.stringify({ ...data, customFields }) });
      const key = user ? `personalDetails:${user.id}` : "personalDetails";
      localStorage.setItem(key, JSON.stringify({ ...data, customFields }));
      toast({
        title: "Success",
        description: "Personal details saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save personal details",
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
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personal Details</h1>
          <p className="text-muted-foreground">Manage your personal information and emergency contacts</p>
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
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter your basic personal and contact information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serviceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Army Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter army number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rank</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your rank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ranks.map((rank) => (
                            <SelectItem key={rank} value={rank}>
                              {rank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfJoining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Joining</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter complete address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="bg-accent/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                  <CardDescription>Provide details of someone to contact in case of emergency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="emergencyContactRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Spouse, Parent, Sibling" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <CustomFields
                title="Additional Fields"
                description="Add extra info (e.g., Alternate Phone, Secondary Email)"
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
        section="personal"
        onDocumentUpload={handleDocumentUpload}
        existingDocument={documents.personal}
        onDocumentRemove={handleDocumentRemove}
      />
    </div>
  );
}
