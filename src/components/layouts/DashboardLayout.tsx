import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Video,
  Scan,
  AlertTriangle,
  Car,
  Camera,
  CreditCard,
  Settings,
  Shield,
  Menu,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Live Feeds',
    path: '/live-feeds',
    icon: <Video className="w-5 h-5" />,
  },
  {
    name: 'Live HSRP Detection',
    path: '/live-detection',
    icon: <Scan className="w-5 h-5" />,
  },
  {
    name: 'Violations',
    path: '/violations',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    name: 'Vehicles',
    path: '/vehicles',
    icon: <Car className="w-5 h-5" />,
  },
  {
    name: 'Cameras',
    path: '/cameras',
    icon: <Camera className="w-5 h-5" />,
    roles: ['admin', 'officer'],
  },
  {
    name: 'Payments',
    path: '/payments',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin', 'officer'],
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin'],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { profile } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return profile?.role && item.roles.includes(profile.role);
  });

  return (
    <nav className="space-y-1">
      {filteredNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 border-r border-border bg-card shrink-0">
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Traffic Control</h2>
              <p className="text-xs text-muted-foreground">HSRP Monitoring</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <NavLinks />
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>© 2026 Traffic Surveillance</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Traffic Control</h2>
                <p className="text-xs text-muted-foreground">HSRP Monitoring</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <NavLinks onNavigate={() => {
              // Close sheet on navigation
              document.querySelector('[data-state="open"]')?.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Escape' })
              );
            }} />
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-4 xl:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
