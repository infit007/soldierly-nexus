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
  const { toast } = useToast();

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

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (Object.values(data).some((val) => val !== "")) {
        setAutoSaveStatus("saving");
        const timer = setTimeout(() => {
          localStorage.setItem("educationDetails", JSON.stringify(data));
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const saved = localStorage.getItem("educationDetails");
    if (saved) {
      form.reset(JSON.parse(saved));
    }
  }, [form]);

  const onSubmit = async (data: EducationFormData) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      localStorage.setItem("educationDetails", JSON.stringify(data));
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
  );
}
