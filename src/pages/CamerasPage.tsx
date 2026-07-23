import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Camera, MapPin, Circle, Activity } from 'lucide-react';
import { getAllCameras } from '@/db/api';
import type { Camera as CameraType } from '@/types/types';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const data = await getAllCameras();
      setCameras(data);
    } catch (error) {
      console.error('Failed to load cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; color: string }> = {
      online: { variant: 'default', color: 'text-success' },
      offline: { variant: 'destructive', color: 'text-danger' },
      maintenance: { variant: 'secondary', color: 'text-warning' },
    };
    const config = variants[status] || variants.offline;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Circle className={`w-2 h-2 ${config.color} fill-current`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const onlineCameras = cameras.filter(c => c.status === 'online').length;
  const offlineCameras = cameras.filter(c => c.status === 'offline').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Camera Management</h1>
        <p className="text-muted-foreground">Monitor and manage surveillance cameras</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
            <Camera className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cameras.length}</div>
            <p className="text-xs text-muted-foreground">Registered cameras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{onlineCameras}</div>
            <p className="text-xs text-muted-foreground">Active cameras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <Activity className="w-4 h-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{offlineCameras}</div>
            <p className="text-xs text-muted-foreground">Inactive cameras</p>
          </CardContent>
        </Card>
      </div>

      {/* Cameras Table */}
      <Card>
        <CardHeader>
          <CardTitle>Camera List</CardTitle>
          <CardDescription>All registered surveillance cameras</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cameras registered</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Camera Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>RTSP URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cameras.map((camera) => (
                    <TableRow key={camera.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-primary" />
                          {camera.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {camera.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {camera.latitude && camera.longitude
                          ? `${camera.latitude.toFixed(4)}, ${camera.longitude.toFixed(4)}`
                          : 'Not set'}
                      </TableCell>
                      <TableCell>{getStatusBadge(camera.status)}</TableCell>
                      <TableCell className="text-sm">
                        {camera.last_active
                          ? new Date(camera.last_active).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {camera.rtsp_url || 'Not configured'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Map View */}
      <Card>
        <CardHeader>
          <CardTitle>Camera Locations</CardTitle>
          <CardDescription>Geographic distribution of cameras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Map view placeholder</p>
              <p className="text-xs text-muted-foreground mt-1">
                Integration with mapping service required
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
