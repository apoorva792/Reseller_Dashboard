import React from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

const Topbar = () => {
  const { logout } = useAuth();
  
  return (
    <div className="h-16 border-b flex items-center justify-between px-4 bg-white">
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 max-w-md bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        
        <Button variant="outline" size="sm">
          Help Center
        </Button>
        
        <div className="relative">
          <Button size="icon" variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-accent text-accent-foreground p-0">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
