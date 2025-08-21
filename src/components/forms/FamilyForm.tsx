import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Users, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";
import { CustomFields, type CustomField } from "@/components/CustomFields";

const familyMemberSchema = z.object({
  Name: z.string().min(2, "Name must be at least 2 characters"),
  DOB: z.string().min(1, "Date of birth is required"),
  relation: z.string().min(1, "Relation is required"),
  Gender: z.string().min(1, "Gender is required"),
});

const familySchema = z.object({
  members: z.array(familyMemberSchema).min(1, "At least one family member is required"),
});

type FamilyFormData = z.infer<typeof familySchema>;

const relation = [
  "Mother", "Father", "Spouse", "Daughter", "Son"
];
const gender=[
  "Male", "Female"
]

export function FamilyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const [documents, setDocuments] = useState<any>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      members: [
        { Name: "", DOB: "", relation: "", Gender: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const profile = await apiFetch<any>("/api/profile");
      if (profile?.documents?.family) {
        setDocuments(prev => ({ ...prev, family: profile.documents.family }));
      }
      if (profile?.family?.customFields) setCustomFields(profile.family.customFields);
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
    const sub = form.watch((values) => {
      if (values.members && values.members.length > 0) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          const key = user ? `familyDetails:${user.id}` : "familyDetails";
          localStorage.setItem(key, JSON.stringify({ ...values, customFields }));
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => sub.unsubscribe();
  }, [form, user, customFields]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiFetch<any>("/api/profile");
        if (!cancelled && profile?.family) {
          form.reset(profile.family);
          if (profile.family.customFields) setCustomFields(profile.family.customFields);
          return;
        }
      } catch {}
      const key = user ? `familyDetails:${user.id}` : "familyDetails";
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

  const onSubmit = async (data: FamilyFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/family", { method: "PUT", body: JSON.stringify({ ...data, customFields }) });
      const key = user ? `familyDetails:${user.id}` : "familyDetails";
      localStorage.setItem(key, JSON.stringify({ ...data, customFields }));
      toast({
        title: "Success",
        description: "Family details saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save family details",
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
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Family Details</h1>
          <p className="text-muted-foreground">Manage your family member information</p>
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
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Add and manage your family member details</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="bg-accent/30">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Family Member {index + 1}</CardTitle>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`members.${index}.Name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`members.${index}.DOB`}
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
                        name={`members.${index}.relation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relation</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {relation.map((rel) => (
                                  <SelectItem key={rel} value={rel}>
                                    {rel}
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
                        name={`members.${index}.Gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {gender.map((gen) => (
                                  <SelectItem key={gen} value={gen}>
                                    {gen}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ Name: "", DOB: "", relation: "", Gender: "" })}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Family Member
              </Button>

              <CustomFields
                title="Additional Family Fields"
                description="Add extra info related to family (e.g., Guardian Phone)"
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
        section="family"
        onDocumentUpload={handleDocumentUpload}
        existingDocument={documents.family}
        onDocumentRemove={handleDocumentRemove}
      />
    </div>
  );
}

