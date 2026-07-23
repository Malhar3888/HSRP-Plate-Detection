import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllVehicles, createViolation, updateViolation, getSettings, createSmsAttempt } from '@/db/api';
import {
  Camera,
  Video,
  VideoOff,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Maximize2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetectionResult {
  id: string;
  timestamp: Date;
  plateNumber: string;
  hsrpStatus: 'valid' | 'invalid' | 'unknown';
  confidence: number;
  features?: {
    blue_strip?: boolean;
    ind_text?: boolean;
    hologram?: boolean;
  };
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshot?: string;
  plateImage?: string;
}

export default function LiveHSRPDetectionPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [currentDetection, setCurrentDetection] = useState<DetectionResult | null>(null);
  const [fps, setFps] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoMode, setDemoMode] = useState(false); 

  // Multi-frame confirmation tracking
  // Store the worst detection (highest confidence of being invalid)
  const plateHistoryRef = useRef<Record<string, { count: number, worstFrame: DetectionResult }>>({});
  const lastViolationRef = useRef<Record<string, number>>({});
  const lastFrameRef = useRef<string | null>(null);
  const allVehiclesRef = useRef<any[]>([]);

  useEffect(() => {
    // Pre-load vehicles for fast OCR fuzzy matching
    import('@/db/api').then(({ getAllVehicles }) => {
      getAllVehicles().then(v => allVehiclesRef.current = v);
    });
  }, []);

  // Levenshtein distance for OCR correction
  const getEditDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i += 1) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j += 1) { matrix[j][0] = j; }
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[b.length][a.length];
  };

  // Helper to downscale image for DB to prevent 400 Payload Too Large
  const getDownscaledImage = (base64Img: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Img) return resolve('');
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5)); // High compression
      };
      img.src = base64Img;
    });
  };

  // Keep a buffer of recent frames to synchronize with backend results
  const pendingFramesRef = useRef<Record<string, string>>({});

  // Process video frame and send to backend
  const processVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || isProcessing) return;
    
    if (wsRef.current.readyState !== WebSocket.OPEN) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Compress image to reduce payload size
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.6);
    lastFrameRef.current = imageDataUrl;
    
    const frameData = imageDataUrl.split(',')[1];
    
    // Synchronize frame with backend
    const frameId = Date.now().toString() + Math.random().toString().slice(2, 6);
    pendingFramesRef.current[frameId] = imageDataUrl;
    
    // Cleanup old frames to prevent memory leaks
    const keys = Object.keys(pendingFramesRef.current);
    if (keys.length > 20) {
      delete pendingFramesRef.current[keys[0]];
    }

    wsRef.current.send(JSON.stringify({ frame: frameData, frame_id: frameId }));
  };
  const handleDownloadPDF = async (detection: DetectionResult) => {
    try {
      toast({ title: 'Generating...', description: `Creating PDF report for ${detection.plateNumber}...` });
      const vehicles = await getAllVehicles();
      const vMatch = vehicles.find(v => v.plate_number === detection.plateNumber);
      
      const safeImageUrl = detection.screenshot 
        ? await getDownscaledImage(detection.screenshot) 
        : undefined;

      const pdfRes = await fetch('http://localhost:8000/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: detection.plateNumber,
          violation_date: detection.timestamp.toISOString(),
          image_base64: safeImageUrl || '',
          fine_amount: 500,
          recipient_phone: vMatch?.owner_phone || 'Unknown'
        })
      });
      const pdfData = await pdfRes.json();
      if (pdfRes.ok && pdfData.pdf_url) {
        const fileRes = await fetch(pdfData.pdf_url);
        const blob = await fileRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${detection.plateNumber}_Violation_Report.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        toast({ title: 'Success', description: 'PDF report downloaded successfully.' });
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({ title: 'Error', description: 'Failed to generate PDF report.', variant: 'destructive' });
    }
  };

  const triggerViolation = useCallback(async (plate: string, finalWorstFrame: DetectionResult) => {
    try {
      const vehicles = await getAllVehicles();
      const vMatch = vehicles.find(v => v.plate_number === plate);
      
      const safeImageUrl = finalWorstFrame.screenshot 
        ? await getDownscaledImage(finalWorstFrame.screenshot) 
        : undefined;
      
      const newVio = await createViolation({
        plate_number: plate,
        camera_id: null as any,
        violation_type: 'no_hsrp',
        violation_date: new Date().toISOString(),
        location: 'Live Camera Feed',
        image_url: safeImageUrl,
        fine_amount: 500,
        description: `Automatically detected missing or invalid HSRP in live feed. AI Confidence of violation: ${finalWorstFrame.confidence.toFixed(1)}%`,
      } as any);

      toast({
        title: "🚨 Violation Recorded!",
        description: `Vehicle ${plate} flagged for invalid HSRP.`,
        variant: "destructive",
        duration: 5000,
      });

      if (newVio) {
        // PDF will now be generated manually via the "Download PDF" button in the UI
        
        const settings = await getSettings();
        if (settings.sms_enabled) {
          let recipient = settings.sms_notification_number;
          if (vMatch && vMatch.owner_phone) {
            recipient = vMatch.owner_phone;
          } else {
            recipient = `${settings.sms_country_code}${settings.sms_notification_number}`;
          }

          try {
            const res = await fetch('http://localhost:8000/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone_number: recipient,
                message: `TRAFFIC NOTICE: The number plate for vehicle ${plate} has been detected as invalid or non-compliant (Non-HSRP). Please verify your registration plates and ensure compliance to avoid penalties.`,
              }),
            });
            const data = await res.json();
            
            if (res.ok && data.status === 'sent') {
              await updateViolation(newVio.id, {
                sms_status: 'sent',
                sms_recipient: recipient,
                sms_sent_at: new Date().toISOString(),
                sms_message_id: data.message_id
              });
            }
          } catch (e: any) {
            console.error("Failed to send SMS:", e);
          }
        }
      }
    } catch (e) {
      console.error("Error recording violation:", e);
    }
  }, [toast]);

  // Handle detection result from backend
  const handleDetectionResult = useCallback(async (result: any) => {
    const now = Date.now();
    const lastVio = lastViolationRef.current;
    
    if (result.type === 'hsrp_result') {
      // For both valid and invalid plates, 85% is a good responsive threshold.
      let isHighConfidence = false;
      if (result.hsrp_status === 'valid') {
        isHighConfidence = result.confidence >= 95.0;
      } else if (result.hsrp_status === 'invalid') {
        isHighConfidence = result.confidence >= 95.0;
      }
      
      const finalStatus = isHighConfidence ? result.hsrp_status : 'checking';

      setDetections(prev => prev.map(d => 
        d.id === result.id 
          ? { ...d, hsrpStatus: finalStatus, confidence: result.confidence, features: result.features } 
          : d
      ));
      setCurrentDetection(prev => prev?.id === result.id ? { ...prev, hsrpStatus: finalStatus, confidence: result.confidence, features: result.features } : prev);
      setIsProcessing(false);
      
      const plate = result.plate_number;
      if (plate && finalStatus === 'invalid') {
        const isGlobalCoolingDown = lastVio['global'] && (now - lastVio['global'] < 5000);
        const isPlateCoolingDown = lastVio[plate] && (now - lastVio[plate] < 300000);
        const isCoolingDown = isGlobalCoolingDown || isPlateCoolingDown;

        const history = plateHistoryRef.current;
        
        if (history[plate] && !isCoolingDown) {
          history[plate].count += 1;
          
          if (history[plate].worstFrame) {
             history[plate].worstFrame.hsrpStatus = 'invalid';
             history[plate].worstFrame.confidence = result.confidence;
          }
          
          if (history[plate].count >= 2) {
             const finalWorstFrame = history[plate].worstFrame;
             lastVio[plate] = now;
             lastVio['global'] = now;
             history[plate] = { count: 0, worstFrame: finalWorstFrame, totalSeen: 0 };
             triggerViolation(plate, finalWorstFrame);
          }
        }
      }
      return;
    }

    const data = result.type === 'plate_detected' ? result.detection : result;
    let plate = data.plate_number;
    if (!plate || plate === 'Unknown') return;

    // Require at least 6 characters
    if (plate.replace(/\s+/g, '').length < 6) return;

    // Cooldown check (60 seconds) with fuzzy matching
    // This prevents the same physical plate from being logged multiple times if the OCR misreads a single character
    let isFuzzyCoolingDown = false;
    for (const key in lastVio) {
      if (key.startsWith('log_')) {
        const loggedPlate = key.replace('log_', '');
        // If the edit distance is 2 or less, consider it the same plate
        if (getEditDistance(plate.replace(/\s+/g, '').toUpperCase(), loggedPlate.replace(/\s+/g, '').toUpperCase()) <= 2) {
           if (now - lastVio[key] < 60000) {
             isFuzzyCoolingDown = true;
             break;
           }
        }
      }
    }
    
    if (isFuzzyCoolingDown) {
      return;
    }
    lastVio[`log_${plate}`] = now;

    const vehicles = allVehiclesRef.current;
    let finalHsrpStatus = data.hsrp_status || 'checking';
    
    if (vehicles.length > 0) {
      let bestMatch = plate;
      let matchedVehicle = null;
      let minDistance = 3;
      
      for (const v of vehicles) {
        const vPlate = v.plate_number.replace(/\s+/g, '').toUpperCase();
        const pPlate = plate.replace(/\s+/g, '').toUpperCase();
        const dist = getEditDistance(pPlate, vPlate);
        
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = v.plate_number;
          matchedVehicle = v;
        }
      }
      plate = bestMatch;
      
      if (matchedVehicle) {
        if (matchedVehicle.has_hsrp) {
          finalHsrpStatus = 'valid';
        } else {
          finalHsrpStatus = 'invalid';
        }
      }
    }

    // Sync frame
    const frameId = result.frame_id;
    const syncedScreenshot = frameId && pendingFramesRef.current[frameId] 
      ? pendingFramesRef.current[frameId] 
      : lastFrameRef.current;

    const detection: DetectionResult = {
      id: data.id || Date.now().toString(),
      timestamp: new Date(),
      plateNumber: plate,
      hsrpStatus: finalHsrpStatus,
      confidence: data.confidence || 0,
      features: data.features,
      boundingBox: data.bounding_box,
      screenshot: syncedScreenshot || undefined,
      plateImage: data.plate_image,
    };

    setCurrentDetection(detection);
    setDetections(prev => [detection, ...prev].slice(0, 20));
    setIsProcessing(true);

    const history = plateHistoryRef.current;
    if (!history[plate]) {
      history[plate] = { count: 0, worstFrame: detection, totalSeen: 0 };
    }
    
    history[plate].totalSeen += 1;

    if (detection.hsrpStatus === 'invalid') {
      history[plate].count += 1;
      if (detection.confidence > history[plate].worstFrame.confidence || history[plate].worstFrame.hsrpStatus !== 'invalid') {
        history[plate].worstFrame = detection;
      }
    }

    const isCoolingDown = lastVio[plate] && (now - lastVio[plate] < 300000);

    if (!isCoolingDown && history[plate].count >= 2) {
      const finalWorstFrame = history[plate].worstFrame;
      lastVio[plate] = now;
      lastVio['global'] = now;
      history[plate] = { count: 0, worstFrame: detection, totalSeen: 0 }; // Reset
      triggerViolation(plate, finalWorstFrame);
    }
    setTimeout(() => {
      setCurrentDetection(null);
      setIsProcessing(false);
    }, 2000);
  }, [triggerViolation]);

  // Capture and send frames to backend
  const startFrameCapture = useCallback(() => {
    const captureFrame = () => {
      if (!videoRef.current || !canvasRef.current || !wsRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(captureFrame);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 and send to backend
      const frameData = canvas.toDataURL('image/jpeg', 0.8);
      lastFrameRef.current = frameData;
      
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ frame: frameData }));
      }

      // Capture at a lower ~2 FPS to prevent lagging the CPU backend AI
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(captureFrame);
      }, 500); // 500ms between frames = 2 FPS
    };

    captureFrame();
  }, []);

  // Connect to WebSocket backend
  const connectWebSocket = useCallback(() => {
    try {
      // Replace with your backend WebSocket URL
      const ws = new WebSocket('ws://localhost:8000/ws/detect');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        startFrameCapture();
      };

      ws.onmessage = (event) => {
        const result = JSON.parse(event.data);
        handleDetectionResult(result);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Backend connection failed. Please ensure the Python server is running.');
        setDemoMode(true);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setError('Backend not available. Please ensure the Python server is running.');
      setDemoMode(true);
    }
  }, [startFrameCapture, handleDetectionResult]);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);

        // Start frame processing
        connectWebSocket();
      }
    } catch (err) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    }
  }, [connectWebSocket]);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsStreaming(false);
    setCurrentDetection(null);
  }, []);

  // Capture screenshot
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw detection overlay if present
    if (currentDetection?.boundingBox) {
      const box = currentDetection.boundingBox;
      ctx.strokeStyle = currentDetection.hsrpStatus === 'valid' ? '#22C55E' : '#EF4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        box.x * canvas.width,
        box.y * canvas.height,
        box.width * canvas.width,
        box.height * canvas.height
      );
    }

    // Download screenshot
    const link = document.createElement('a');
    link.download = `hsrp-detection-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }, [currentDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-danger" />;
      default:
        return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary'; label: string }> = {
      valid: { variant: 'default', label: '✅ HSRP Valid' },
      invalid: { variant: 'destructive', label: '❌ Non-HSRP' },
      unknown: { variant: 'secondary', label: '⚠️ Unknown' },
    };
    const config = variants[status] || variants.unknown;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Live HSRP Detection</h1>
        <p className="text-muted-foreground">Real-time number plate detection using laptop camera</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {demoMode && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Running in demo mode without backend processing.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Camera View */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Camera Feed</CardTitle>
                  <CardDescription>Point camera at vehicle number plate</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isProcessing && (
                    <Badge variant="default" className="animate-pulse">
                      <Activity className="w-3 h-3 mr-1" />
                      Processing
                    </Badge>
                  )}
                  {isStreaming && (
                    <Badge variant="outline">
                      {fps} FPS
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Detection Overlay */}
                {currentDetection && currentDetection.boundingBox && (
                  <div
                    className="absolute border-4 rounded"
                    style={{
                      left: `${currentDetection.boundingBox.x * 100}%`,
                      top: `${currentDetection.boundingBox.y * 100}%`,
                      width: `${currentDetection.boundingBox.width * 100}%`,
                      height: `${currentDetection.boundingBox.height * 100}%`,
                      borderColor: currentDetection.hsrpStatus === 'valid' ? '#22C55E' : '#EF4444',
                    }}
                  >
                    <div className="absolute -top-20 left-0 bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border min-w-[200px]">
                      <p className="font-bold text-lg mb-1">{currentDetection.plateNumber}</p>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(currentDetection.hsrpStatus)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {currentDetection.confidence.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Camera not active</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {!isStreaming ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Video className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="destructive" className="flex-1">
                    <VideoOff className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                )}
                <Button
                  onClick={captureScreenshot}
                  variant="outline"
                  disabled={!isStreaming}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Screenshot
                </Button>
                <Button variant="outline" disabled={!isStreaming}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detection Log */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Detection Log</CardTitle>
              <CardDescription>Recent detections</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {detections.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No detections yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start camera to begin detection
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detections.map((detection) => (
                      <div
                        key={detection.id}
                        className="border border-border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(detection.hsrpStatus)}
                            <span className="font-bold">{detection.plateNumber}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {detection.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center justify-between">
                            {getStatusBadge(detection.hsrpStatus)}
                            <span className="text-sm font-medium">
                              Confidence: {detection.confidence.toFixed(1)}%
                            </span>
                          </div>
                          {detection.features && (
                            <div className="flex items-center gap-2 text-xs mt-1 bg-muted p-2 rounded">
                              <span className="font-semibold">Features:</span>
                              <Badge variant={detection.features.blue_strip ? 'default' : 'destructive'} className="text-[10px] h-4">
                                {detection.features.blue_strip ? 'IND Blue Strip' : 'No Blue Strip'}
                              </Badge>
                            </div>
                          )}
                          {detection.plateImage && (
                            <div className="mt-2 rounded overflow-hidden border border-border">
                              <img src={detection.plateImage} alt="Plate crop" className="w-full object-contain bg-black max-h-24" />
                            </div>
                          )}
                          {detection.hsrpStatus === 'invalid' && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="mt-2 w-full text-xs" 
                              onClick={() => handleDownloadPDF(detection)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download Fine PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>AI pipeline and backend connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="flex items-center justify-between border border-border rounded-lg p-3">
              <span className="text-sm">Camera</span>
              <Badge variant={isStreaming ? 'default' : 'secondary'}>
                {isStreaming ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between border border-border rounded-lg p-3">
              <span className="text-sm">YOLOv8</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between border border-border rounded-lg p-3">
              <span className="text-sm">OCR Engine</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between border border-border rounded-lg p-3">
              <span className="text-sm">HSRP CNN</span>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
