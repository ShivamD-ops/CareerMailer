import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Edit } from "lucide-react";

export default function EmailCalendar() {
  const scheduledEmails = [
    {
      id: 1,
      title: "Software Engineer @ TechFlow",
      time: "Today, 2:00 PM",
      color: "bg-blue-500",
    },
    {
      id: 2,
      title: "React Developer @ AppLab",
      time: "Tomorrow, 10:00 AM",
      color: "bg-green-500",
    },
    {
      id: 3,
      title: "Full Stack @ DataCorp",
      time: "Dec 18, 9:00 AM",
      color: "bg-yellow-500",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Scheduled Emails</h3>
        <div className="space-y-3">
          {scheduledEmails.map((email) => (
            <div
              key={email.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 ${email.color} rounded-full`}></div>
                <div>
                  <p className="font-medium text-foreground">{email.title}</p>
                  <p className="text-sm text-muted-foreground">{email.time}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        
        <Button className="w-full mt-4 text-gmail-blue border-gmail-blue hover:bg-blue-50" variant="outline">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Schedule New Email
        </Button>
      </CardContent>
    </Card>
  );
}
