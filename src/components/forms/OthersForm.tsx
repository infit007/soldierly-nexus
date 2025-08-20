import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";

const othersSchema = z.object({
  livingStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),
  remarks: z.string().optional(),
});

type OthersFormData = z.infer<typeof othersSchema>;

export function OthersForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const [documents, setDocuments] = useState<any>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<OthersFormData>({
    resolver: zodResolver(othersSchema),
    defaultValues: {
      livingStatus: undefined as unknown as OthersFormData["livingStatus"], // start empty; user must choose
      remarks: "",
    },
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const profile = await apiFetch<any>("/api/profile");
      if (profile?.documents?.others) {
        setDocuments(prev => ({ ...prev, others: profile.documents.others }));
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
    const sub = form.watch((vals) => {
      // autosave when either field has data
      if ((vals as any).livingStatus || vals.remarks !== "") {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          try {
            const key = user ? `otherDetails:${user.id}` : "otherDetails";
            localStorage.setItem(key, JSON.stringify(vals));
          } catch {}
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => sub.unsubscribe();
  }, [form, user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await apiFetch<any>("/api/profile");
        if (!cancelled && profile?.others) {
          form.reset(profile.others);
          return;
        }
      } catch {}
      const key = user ? `otherDetails:${user.id}` : "otherDetails";
      const saved = localStorage.getItem(key);
      if (saved) {
        try { form.reset(JSON.parse(saved)); } catch {}
      }
    }
    load();
    return () => { cancelled = true };
  }, [form, user]);

  const onSubmit = async (data: OthersFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/others", { method: "PUT", body: JSON.stringify(data) });
      const key = user ? `otherDetails:${user.id}` : "otherDetails";
      localStorage.setItem(key, JSON.stringify(data));
      toast({ title: "Success", description: "Details saved successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save details",
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
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Additional Information</h1>
          <p className="text-muted-foreground">Manage additional details and documents</p>
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
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Store any other relevant information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="livingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Living Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your living status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information or remarks"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
        section="others"
        onDocumentUpload={handleDocumentUpload}
        existingDocument={documents.others}
        onDocumentRemove={handleDocumentRemove}
      />
    </div>
  );
}
