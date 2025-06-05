import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, FileText, Check, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
  });

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full bg-gmail-blue text-white hover:bg-blue-600 transition-colors">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
            <Button variant="outline" className="w-full text-gmail-blue border-gmail-blue hover:bg-blue-50">
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Manage Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Integration Status */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gmail Integration</h3>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-success-green rounded-full flex items-center justify-center">
              <Check className="text-white h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Connected</p>
              <p className="text-sm text-muted-foreground">{user?.email || "john.doe@gmail.com"}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gmail-blue">
              <Info className="inline mr-1 h-4 w-4" />
              Daily limit: {analytics?.totalApplications || 18}/25 emails
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
