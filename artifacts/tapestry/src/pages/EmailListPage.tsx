import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useLists } from "@/hooks/use-lists";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send } from "lucide-react";

export default function EmailListPage() {
  const params = useParams<{ workspaceSlug: string; listSlug: string }>();
  const [, setLocation] = useLocation();
  const { data: lists, isLoading: listsLoading } = useLists();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const list = lists?.find(
    (l) => l.slug === params.listSlug || String(l.id) === params.listSlug
  );

  const form = useForm({
    defaultValues: {
      email: "",
      subject: "",
      summary: "",
    },
  });

  useEffect(() => {
    if (list) {
      form.reset({
        email: form.getValues("email"),
        subject: `${list.name} - Designer List`,
        summary: list.summary || "",
      });
    }
  }, [list, form]);

  const onSubmit = async (values: {
    email: string;
    subject: string;
    summary: string;
  }) => {
    if (!list) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lists/${list.id}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "List has been emailed successfully",
      });
      setLocation(`/${params.workspaceSlug}/lists/${params.listSlug}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (listsLoading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 pt-20 pb-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 pt-20 pb-8">
          <p className="text-muted-foreground">List not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation(`/${params.workspaceSlug}/lists/${params.listSlug}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Email List</h1>
          <p className="text-muted-foreground">Send "{list.name}" via email</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      rules={{ required: "Email is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              placeholder="Enter recipient's email address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      rules={{ required: "Subject is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Email subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              className="resize-none min-h-[120px]"
                              {...field}
                              placeholder="Add a personal message or summary..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Email
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-muted-foreground mb-3">{list.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {list.designers?.length || 0} designer{(list.designers?.length || 0) !== 1 ? 's' : ''} in this list
                  </p>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                  {list.designers?.map(({ designer, notes }) => (
                    <div
                      key={designer.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={designer.photoUrl || ""} />
                        <AvatarFallback>
                          {designer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{designer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {designer.title}
                          {designer.company && ` at ${designer.company}`}
                        </p>
                        {notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(!list.designers || list.designers.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No designers in this list
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
