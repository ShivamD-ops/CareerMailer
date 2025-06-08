import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Trash2, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDate, getStatusBadgeColor, getResponseBadgeColor } from "@/lib/utils";

export default function ApplicationsTable() {
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
  });

  const getResponseStatus = (status: string) => {
    if (status === "replied") return "Replied";
    if (status === "delivered" || status === "opened") return "Pending";
    return "None";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Applications</h2>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No applications yet. Create your first campaign to get started!
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app: any) => (
                  <TableRow key={app.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium">{app.company?.[0] || "?"}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{app.company}</p>
                          <p className="text-sm text-muted-foreground">{app.recruiterName || "Unknown"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{app.position}</p>
                      <p className="text-sm text-muted-foreground">{app.location || "Remote"}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(app.sentAt || app.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(app.status)}>
                        {app.status || "draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getResponseBadgeColor(getResponseStatus(app.status))}>
                        {getResponseStatus(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-gmail-blue" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {applications.length} of {applications.length} applications
          </p>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-gmail-blue text-white h-8 px-3">
              1
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              2
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              3
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
