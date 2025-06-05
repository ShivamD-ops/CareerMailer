import { Mail, Bell, Settings, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gmail-blue rounded-lg flex items-center justify-center">
                <Mail className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-foreground">JobReach</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gmail-blue border-b-2 border-gmail-blue font-medium px-1 pb-4">
                Dashboard
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors px-1 pb-4">
                Templates
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors px-1 pb-4">
                Analytics
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors px-1 pb-4">
                Settings
              </a>
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground h-4 w-4 flex items-center justify-center text-xs p-0">
                3
              </Badge>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{user?.name || "User"}</span>
              <div className="w-8 h-8 bg-gmail-blue rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
