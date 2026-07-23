import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Circle, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { getAllCameras, getAllViolations } from '@/db/api';
import type { Camera, Violation } from '@/types/types';

export default function LiveFeedsPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Simulate real-time updates
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [camerasData, violationsData] = await Promise.all([
        getAllCameras(),
        getAllViolations({}),
      ]);
      setCameras(camerasData);
      setRecentViolations(violationsData.slice(0, 10));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-success';
      case 'offline':
        return 'text-danger';
      case 'maintenance':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-4 xl:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Live Camera Feeds</h1>
        <p className="text-muted-foreground">Real-time surveillance monitoring</p>
      </div>

      {/* Camera Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        {cameras.map((camera) => (
          <Card key={camera.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{camera.name}</CardTitle>
                </div>
                <Badge variant={camera.status === 'online' ? 'default' : 'secondary'}>
                  <Circle className={`w-2 h-2 mr-1 ${getStatusColor(camera.status)} fill-current`} />
                  {camera.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {camera.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simulated video feed */}
              <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {camera.status === 'online' ? (
                    <div className="text-center">
                      <Video className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Live Feed Active</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        RTSP Stream: {camera.rtsp_url || 'Not configured'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Camera {camera.status}</p>
                    </div>
                  )}
                </div>

                {/* Overlay info */}
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date().toLocaleTimeString('en-IN')}
                  </div>
                </div>

                {camera.status === 'online' && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 bg-danger/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                      <Circle className="w-2 h-2 fill-current animate-pulse" />
                      REC
                    </div>
                  </div>
                )}
              </div>

              {camera.last_active && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last active: {new Date(camera.last_active).toLocaleString('en-IN')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Detections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Detections</CardTitle>
          <CardDescription>Latest violations detected by AI system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentViolations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent detections</p>
            ) : (
              recentViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{violation.plate_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {violation.location} • {new Date(violation.violation_date).toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {violation.violation_type.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI Detection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-success fill-current animate-pulse" />
              <span className="text-sm font-medium">YOLOv8 Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Vehicle detection running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">OCR Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-success fill-current animate-pulse" />
              <span className="text-sm font-medium">EasyOCR Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Plate recognition running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">HSRP Classifier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-success fill-current animate-pulse" />
              <span className="text-sm font-medium">CNN Model Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">HSRP verification running</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
