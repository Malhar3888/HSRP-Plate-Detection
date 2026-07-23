import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Camera,
  CreditCard,
  TrendingUp,
  Video,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  getDashboardStats,
  getViolationsByType,
  getViolationsByDate,
  getCameraActivity,
  getAllViolations,
} from '@/db/api';
import type {
  DashboardStats,
  ViolationsByType,
  ViolationsByDate,
  CameraActivity,
  Violation,
} from '@/types/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [violationsByType, setViolationsByType] = useState<ViolationsByType[]>([]);
  const [violationsByDate, setViolationsByDate] = useState<ViolationsByDate[]>([]);
  const [cameraActivity, setCameraActivity] = useState<CameraActivity[]>([]);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, typeData, dateData, activityData, violationsData] = await Promise.all([
        getDashboardStats(),
        getViolationsByType(),
        getViolationsByDate(7),
        getCameraActivity(),
        getAllViolations({ status: undefined }),
      ]);

      setStats(statsData);
      setViolationsByType(typeData);
      setViolationsByDate(dateData);
      setCameraActivity(activityData.slice(0, 5));
      setRecentViolations(violationsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getViolationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_hsrp: 'No HSRP',
      insurance_expired: 'Insurance Expired',
      puc_expired: 'PUC Expired',
      rc_expired: 'RC Expired',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      notified: { variant: 'default', icon: <AlertTriangle className="w-3 h-3" /> },
      paid: { variant: 'outline', icon: <CheckCircle className="w-3 h-3" /> },
      dismissed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Traffic surveillance system overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViolations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayViolations || 0} detected today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingViolations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting notification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalFines || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.collectedFines || 0)} collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
            <Camera className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeCameras || 0}/{stats?.totalCameras || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Cameras online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Violations by Type</CardTitle>
            <CardDescription>Distribution of violation categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: 'Violations',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="h-[300px]"
            >
                <BarChart data={violationsByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="type"
                    tickFormatter={getViolationTypeLabel}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Violations Trend</CardTitle>
            <CardDescription>Last 7 days activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: 'Violations',
                  color: 'hsl(var(--chart-2))',
                },
              }}
              className="h-[300px]"
            >
                <LineChart data={violationsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Violations</CardTitle>
            <CardDescription>Latest detected violations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentViolations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No violations recorded</p>
              ) : (
                recentViolations.map((violation) => (
                  <div key={violation.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{violation.plate_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {getViolationTypeLabel(violation.violation_type)} • {violation.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(violation.violation_date).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(violation.status)}
                      <span className="text-sm font-semibold">{formatCurrency(violation.fine_amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/violations">View All Violations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camera Activity</CardTitle>
            <CardDescription>Top performing cameras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cameraActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No camera activity</p>
              ) : (
                cameraActivity.map((camera) => (
                  <div key={camera.camera_id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Video className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{camera.camera_name}</p>
                        <p className="text-xs text-muted-foreground">{camera.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {camera.violation_count} violations
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/cameras">Manage Cameras</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/live-feeds">
                <Video className="w-6 h-6" />
                <span>View Live Feeds</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/violations">
                <AlertTriangle className="w-6 h-6" />
                <span>Check Violations</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/vehicles">
                <TrendingUp className="w-6 h-6" />
                <span>Search Vehicles</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link to="/payments">
                <CreditCard className="w-6 h-6" />
                <span>Payment Status</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
