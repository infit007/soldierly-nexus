import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const familyMemberSchema = z.object({
  Name: z.string().optional(),
  DOB: z.string().optional(),
  relation: z.string().optional(),
  Gender: z.string().optional(),
});

const familySchema = z.object({
  members: z.array(familyMemberSchema),
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
  const { toast } = useToast();

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

  useEffect(() => {
    const sub = form.watch((values) => {
      if (values.members && values.members.length > 0) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          localStorage.setItem("familyDetails", JSON.stringify(values));
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  useEffect(() => {
    const saved = localStorage.getItem("familyDetails");
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: FamilyFormData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      localStorage.setItem("familyDetails", JSON.stringify(data));
      toast({ title: "Success", description: "Family details saved" });
    } catch {
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
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Family Details</CardTitle>
        <CardDescription>
          Provide information about your family members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {fields.map((field, idx) => (
              <div key={field.id} className="border rounded-lg p-4 mb-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`members.${idx}.Name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`members.${idx}.DOB`}
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
                    name={`members.${idx}.relation`}
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
                    name={`members.${idx}.Gender`}
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
                            {gender.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => remove(idx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ Name: "", DOB: "", relation: "", Gender: "" })}
            >
              Add Family Member
            </Button>
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

