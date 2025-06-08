import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Analytics = {
  deliveryRate?: number;
  openRate?: number;
  replyRate?: number;
  interviewRate?: number;
};

export default function AnalyticsChart() {
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  const metrics = [
    {
      label: "Delivery Rate",
      value: analytics?.deliveryRate || 96,
      color: "bg-green-500",
    },
    {
      label: "Open Rate",
      value: analytics?.openRate || 68,
      color: "bg-blue-500",
    },
    {
      label: "Reply Rate",
      value: analytics?.replyRate || 24,
      color: "bg-purple-500",
    },
    {
      label: "Interview Rate",
      value: 8,
      color: "bg-red-500",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Email Performance</h3>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                <span className="text-sm font-bold text-foreground">{metric.value}%</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </div>
        
        {/* Performance by week chart placeholder */}
        <div className="mt-6 h-32 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
            <p className="text-sm text-muted-foreground">Weekly Performance Chart</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
