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

const salarySchema = z.object({
  basicPay: z.coerce.number().min(0, "Enter valid amount"),
  allowances: z.coerce.number().min(0, "Enter valid amount"),
  deductions: z.coerce.number().min(0, "Enter valid amount"),
});

type SalaryFormData = z.infer<typeof salarySchema>;

export function SalaryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      basicPay: 0,
      allowances: 0,
      deductions: 0,
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      const anyFilled =
        values.basicPay !== 0 || values.allowances !== 0 || values.deductions !== 0;
      if (anyFilled) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          const key = user ? `salaryDetails:${user.id}` : "salaryDetails";
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
        if (!cancelled && profile?.salary) {
          form.reset(profile.salary);
          return;
        }
      } catch {}
      const key = user ? `salaryDetails:${user.id}` : "salaryDetails";
      const saved = localStorage.getItem(key);
      if (saved) form.reset(JSON.parse(saved));
    }
    load();
    return () => { cancelled = true };
  }, [form, user]);

  const onSubmit = async (data: SalaryFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/api/profile/salary", { method: "PUT", body: JSON.stringify(data) });
      const key = user ? `salaryDetails:${user.id}` : "salaryDetails";
      localStorage.setItem(key, JSON.stringify(data));
      toast({ title: "Success", description: "Salary details saved" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save salary details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Salary Details</CardTitle>
        <CardDescription>Enter salary and allowance information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="basicPay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basic Pay</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowances"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowances</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deductions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deductions</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
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

