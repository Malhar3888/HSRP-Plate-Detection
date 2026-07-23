import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Shield } from 'lucide-react';

export default function Header() {
  const { profile, signOut } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'officer':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'officer':
        return 'Officer';
      default:
        return 'Viewer';
    }
  };

  return (
    <header className="border-b border-border bg-card px-4 xl:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary lg:hidden" />
          <h1 className="text-lg font-semibold text-foreground lg:hidden">Traffic Control</h1>
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <div className="hidden xl:flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(profile.role)}>
                {getRoleLabel(profile.role)}
              </Badge>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Role:</span>
                  <Badge variant={getRoleBadgeVariant(profile?.role || 'viewer')} className="text-xs">
                    {getRoleLabel(profile?.role || 'viewer')}
                  </Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
