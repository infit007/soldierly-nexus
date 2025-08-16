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
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

const medicalSchema = z.object({
  bloodGroup: z.string().min(1, "Required"),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  lastCheckupDate: z.string().optional(),
});

type MedicalFormData = z.infer<typeof medicalSchema>;

export function MedicalForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<MedicalFormData>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      bloodGroup: "",
      allergies: "",
      medicalConditions: "",
      lastCheckupDate: "",
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      if (Object.values(values).some((v) => v !== "")) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          const key = user ? `medicalDetails:${user.id}` : "medicalDetails";
          localStorage.setItem(key, JSON.stringify(values));
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
        if (!cancelled && profile?.medical) {
          form.reset(profile.medical);
          return;
        }
      } catch {}
      const key = user ? `medicalDetails:${user.id}` : "medicalDetails";
      const saved = localStorage.getItem(key);
      if (saved) form.reset(JSON.parse(saved));
    }
    load();
    return () => { cancelled = true };
  }, [form, user]);

  const onSubmit = async (data: MedicalFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/medical", { method: "PUT", body: JSON.stringify(data) });
      const key = user ? `medicalDetails:${user.id}` : "medicalDetails";
      localStorage.setItem(key, JSON.stringify(data));
      toast({ title: "Success", description: "Medical details saved" });
    } catch {
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
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Medical Details</CardTitle>
        <CardDescription>Provide your health information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bloodGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Group</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., O+" {...field} />
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
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="medicalConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Conditions</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
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
                  <FormLabel>Last Checkup Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
  );
}

