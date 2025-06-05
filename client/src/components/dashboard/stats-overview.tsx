import { Card, CardContent } from "@/components/ui/card";
import { Send, Reply, Calendar, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function StatsOverview() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const stats = [
    {
      title: "Total Applications",
      value: analytics?.totalApplications || 0,
      icon: Send,
      color: "text-gmail-blue",
      bgColor: "bg-blue-100",
      trend: "+12% from last week",
      trendIcon: TrendingUp,
      trendColor: "text-success",
    },
    {
      title: "Response Rate",
      value: `${analytics?.responseRate || 0}%`,
      icon: Reply,
      color: "text-success",
      bgColor: "bg-green-100",
      trend: "+3% from last week",
      trendIcon: TrendingUp,
      trendColor: "text-success",
    },
    {
      title: "Interviews",
      value: analytics?.interviewCount || 0,
      icon: Calendar,
      color: "text-warning",
      bgColor: "bg-red-100",
      trend: "+2 this week",
      trendIcon: TrendingUp,
      trendColor: "text-success",
    },
    {
      title: "Templates",
      value: 15,
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      trend: "5 active templates",
      trendIcon: null,
      trendColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.color} h-6 w-6`} />
              </div>
            </div>
            <p className={`text-sm mt-2 ${stat.trendColor}`}>
              {stat.trendIcon && <stat.trendIcon className="inline mr-1 h-4 w-4" />}
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
