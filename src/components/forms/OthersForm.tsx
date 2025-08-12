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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const othersSchema = z.object({
  livingStatus: z.enum(["family", "line"], { required_error: "Please select living status" }),
  remarks: z.string().min(2, "Remarks cannot be empty"),
});

type OthersFormData = z.infer<typeof othersSchema>;

export function OthersForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved">("idle");
  const { toast } = useToast();

  const form = useForm<OthersFormData>({
    resolver: zodResolver(othersSchema),
    defaultValues: {
      livingStatus: undefined as unknown as OthersFormData["livingStatus"], // start empty; user must choose
      remarks: "",
    },
  });

  useEffect(() => {
    const sub = form.watch((vals) => {
      // autosave when either field has data
      if ((vals as any).livingStatus || vals.remarks !== "") {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          try {
            localStorage.setItem("otherDetails", JSON.stringify(vals));
          } catch {}
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  useEffect(() => {
    const saved = localStorage.getItem("otherDetails");
    if (saved) {
      try {
        form.reset(JSON.parse(saved));
      } catch {}
    }
  }, [form]);

  const onSubmit = async (data: OthersFormData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      localStorage.setItem("otherDetails", JSON.stringify(data));
      toast({ title: "Success", description: "Details saved" });
    } catch {
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
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
        <CardDescription>Store any other relevant information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="livingStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Living Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select living status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="family">With Family</SelectItem>
                      <SelectItem value="line">Line Living</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter additional details" {...field} />
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
