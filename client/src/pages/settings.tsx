import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Key,
  Bot,
  Users,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const settingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  apollioApiKey: z.string().optional(),
  gmailAccessToken: z.string().optional(),
  gmailRefreshToken: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showApolloKey, setShowApolloKey] = useState(false);

  type User = {
    name?: string;
    email?: string;
    username?: string;
    gmailConnected?: boolean;
    geminiApiKey?: string;
    apollioApiKey?: string;
  };

  const { user, logout } = useAuth() as { user: User; logout: () => void };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      geminiApiKey: user?.geminiApiKey || "",
      apollioApiKey: user?.apollioApiKey || "",
      gmailAccessToken: "",
      gmailRefreshToken: "",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await apiRequest("PATCH", "/api/user", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your API keys have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showGmailForm, setShowGmailForm] = useState(false);

  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/add/token", {
        accessToken,
        refreshToken,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gmail connected",
        description: "Successfully saved your Gmail credentials.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowGmailForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect Gmail",
        description: error.message || "Could not connect Gmail",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {console.log(user)}
      <div className="min-h-screen bg-muted">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gmail-blue rounded-lg flex items-center justify-center">
                    <Mail className="text-white text-sm" />
                  </div>
                  <span className="text-xl font-bold text-foreground">
                    JobReach Settings
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">{user?.name}</span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Name
                        </label>
                        <p className="text-foreground">{user?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="text-foreground">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Username
                        </label>
                        <p className="text-foreground">{user?.username}</p>
                      </div>
                      {/* <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Gmail Status
                    </label>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={
                          user?.gmailConnected
                            ? "bg-success-green"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {user?.gmailConnected ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                  </div> */}
                      {/* ✅ Gmail Status and Token Inputs (move here) */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Gmail Status
                        </label>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              user?.gmailConnected
                                ? "bg-success-green"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {user?.gmailConnected
                              ? "Connected"
                              : "Not Connected"}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowGmailForm((prev) => !prev)}
                          >
                            {user?.gmailConnected
                              ? "Update Gmail Tokens"
                              : "Connect Gmail"}
                          </Button>
                        </div>

                        {showGmailForm && (
                          <div className="mt-4 space-y-3">
                            <FormField
                              control={form.control}
                              name="gmailAccessToken"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Access Token</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter Gmail access token"
                                      {...field}
                                      disabled={
                                        updateSettingsMutation.isPending
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="gmailRefreshToken"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Refresh Token</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter Gmail refresh token"
                                      {...field}
                                      disabled={
                                        updateSettingsMutation.isPending
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Save button */}
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-gmail-blue text-white hover:bg-blue-600"
                          disabled={updateSettingsMutation.isPending}
                        >
                          {updateSettingsMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>API Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Google Gemini API */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-gmail-blue" />
                        <h3 className="text-lg font-medium">
                          Google Gemini API
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Required for AI-powered job description parsing and
                        cover letter generation.
                      </p>

                      <FormField
                        control={form.control}
                        name="geminiApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showGeminiKey ? "text" : "password"}
                                  placeholder="Enter your Gemini API key"
                                  {...field}
                                  disabled={updateSettingsMutation.isPending}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                  onClick={() =>
                                    setShowGeminiKey(!showGeminiKey)
                                  }
                                >
                                  {showGeminiKey ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Get your API key from Google AI Studio
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Apollo.io API */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        <h3 className="text-lg font-medium">Apollo.io API</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Required for finding recruiter contact information
                        automatically.
                      </p>

                      <FormField
                        control={form.control}
                        name="apollioApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apollo.io API Key</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showApolloKey ? "text" : "password"}
                                  placeholder="Enter your Apollo.io API key"
                                  {...field}
                                  disabled={updateSettingsMutation.isPending}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                  onClick={() =>
                                    setShowApolloKey(!showApolloKey)
                                  }
                                >
                                  {showApolloKey ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Get your API key from Apollo.io dashboard
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-gmail-blue text-white hover:bg-blue-600"
                        disabled={updateSettingsMutation.isPending}
                      >
                        {updateSettingsMutation.isPending ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Settings
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Google Gemini API Setup:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>Visit Google AI Studio</li>
                    <li>Create a new project or select existing one</li>
                    <li>Generate an API key for Gemini</li>
                    <li>Copy and paste the key above</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Apollo.io API Setup:</h4>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>Sign up for Apollo.io account</li>
                    <li>Go to Settings → Integrations</li>
                    <li>Generate an API key</li>
                    <li>Copy and paste the key above</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
