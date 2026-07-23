import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Download, Smartphone, Send, MessageCircle, FileText } from 'lucide-react';
import { getAllViolations, updateViolation, getSettings, getViolationImage } from '@/db/api';
import type { Violation, ViolationFilters } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [filters, setFilters] = useState<ViolationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingSms, setRetryingSms] = useState<string | null>(null);
  const [selectedViolationImage, setSelectedViolationImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    if (selectedViolation) {
      if (selectedViolation.image_path && selectedViolation.image_path.startsWith('data:image')) {
        setSelectedViolationImage(selectedViolation.image_path);
        setIsLoadingImage(false);
      } else {
        setIsLoadingImage(true);
        getViolationImage(selectedViolation.id)
          .then(url => setSelectedViolationImage(url))
          .catch(err => console.error("Failed to load violation image", err))
          .finally(() => setIsLoadingImage(false));
      }
    } else {
      setSelectedViolationImage(null);
    }
  }, [selectedViolation]);

  const canManage = profile?.role === 'admin' || profile?.role === 'officer';

  const handleDownloadReport = async (violation: Violation) => {
    try {
      setIsGeneratingReport(violation.id);
      const imgUrl = await getViolationImage(violation.id);
      if (!imgUrl) {
          toast({ title: 'Error', description: 'Could not load evidence image.', variant: 'destructive' });
          return;
      }
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const settings = await getSettings();
      let recipient = violation.vehicle?.owner_phone || settings.sms_notification_number;
      if (!recipient.startsWith('+')) recipient = `${settings.sms_country_code}${recipient}`;
      
      toast({ title: 'Generating...', description: 'Creating PDF report...' });
      const res = await fetch('http://localhost:8000/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: violation.plate_number,
          violation_date: new Date(violation.violation_date).toISOString(),
          image_base64: base64,
          fine_amount: violation.fine_amount,
          recipient_phone: recipient
        })
      });
      
      const data = await res.json();
      if (res.ok && data.pdf_url) {
        window.open(data.pdf_url, '_blank');
        toast({ title: 'Success', description: 'PDF report downloaded.' });
      } else {
        throw new Error(data.detail || 'Failed to generate report');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingReport(null);
    }
  };

  const handleSendWhatsApp = async (violation: Violation) => {
    try {
      setIsGeneratingReport(violation.id);
      const imgUrl = await getViolationImage(violation.id);
      if (!imgUrl) {
          toast({ title: 'Error', description: 'Could not load evidence image.', variant: 'destructive' });
          return;
      }
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const settings = await getSettings();
      let recipient = violation.vehicle?.owner_phone || settings.sms_notification_number;
      if (!recipient.startsWith('+')) recipient = `${settings.sms_country_code}${recipient}`;
      
      toast({ title: 'Sending...', description: 'Opening WhatsApp to send report...' });
      const res = await fetch('http://localhost:8000/api/whatsapp/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: violation.plate_number,
          violation_date: new Date(violation.violation_date).toISOString(),
          image_base64: base64,
          fine_amount: violation.fine_amount,
          recipient_phone: recipient
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to trigger WhatsApp message');
      }
      toast({ title: 'Success', description: 'WhatsApp triggered successfully.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingReport(null);
    }
  };

  useEffect(() => {
    loadViolations();
  }, [filters]);

  const loadViolations = async () => {
    try {
      setLoading(true);
      const data = await getAllViolations(filters);
      setViolations(data);
    } catch (error) {
      console.error('Failed to load violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, plateNumber: searchQuery || undefined });
  };

  const handleStatusChange = async (violationId: string, newStatus: string) => {
    try {
      await updateViolation(violationId, { status: newStatus as any });
      loadViolations();
    } catch (error) {
      console.error('Failed to update violation status:', error);
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
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSmsStatusBadge = (status?: string | null) => {
    if (!status) return <Badge variant="outline" className="text-gray-500">Not Configured</Badge>;
    
    const config: Record<string, { color: string; label: string }> = {
      sent: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', label: 'Sent' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Failed' },
      pending: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800', label: 'Pending' },
      disabled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700', label: 'Disabled' },
      not_configured: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700', label: 'Not Configured' },
      retrying: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'Retrying' }
    };
    
    const c = config[status] || config['not_configured'];
    
    return (
      <Badge variant="outline" className={`font-medium ${c.color}`}>
        {c.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Plate Number', 'Type', 'Location', 'Date', 'Fine Amount', 'Status', 'SMS Recipient', 'SMS Status', 'SMS Date'];
    const rows = violations.map(v => [
      v.plate_number,
      getViolationTypeLabel(v.violation_type),
      v.location,
      new Date(v.violation_date).toLocaleString('en-IN'),
      v.fine_amount,
      v.status,
      v.sms_recipient || 'N/A',
      v.sms_status || 'N/A',
      v.sms_sent_at ? new Date(v.sms_sent_at).toLocaleString('en-IN') : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Violations</h1>
          <p className="text-muted-foreground">Manage and track traffic violations</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-5">
            <div className="xl:col-span-2 flex gap-2">
              <Input
                placeholder="Search by plate number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="notified">Notified</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="no_hsrp">No HSRP</SelectItem>
                <SelectItem value="insurance_expired">Insurance Expired</SelectItem>
                <SelectItem value="puc_expired">PUC Expired</SelectItem>
                <SelectItem value="rc_expired">RC Expired</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Violation Records</CardTitle>
          <CardDescription>
            {violations.length} violation{violations.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No violations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Fine Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SMS Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-medium">{violation.plate_number}</TableCell>
                      <TableCell>{getViolationTypeLabel(violation.violation_type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{violation.location}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(violation.violation_date).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(violation.fine_amount)}</TableCell>
                      <TableCell>{getStatusBadge(violation.status)}</TableCell>
                      <TableCell>{getSmsStatusBadge(violation.sms_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedViolation(violation)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(violation)}
                            title="Download Report"
                            disabled={isGeneratingReport === violation.id}
                          >
                            <Download className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendWhatsApp(violation)}
                            title="Send to WhatsApp"
                            disabled={isGeneratingReport === violation.id}
                          >
                            <MessageCircle className="w-4 h-4 text-green-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Detail Dialog */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
            <DialogDescription>
              Complete information about the violation
            </DialogDescription>
          </DialogHeader>

          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plate Number</p>
                  <p className="font-semibold text-lg">{selectedViolation.plate_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedViolation.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Violation Type</p>
                  <p className="font-medium">{getViolationTypeLabel(selectedViolation.violation_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fine Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedViolation.fine_amount)}</p>
                </div>
              </div>

              {(selectedViolationImage || isLoadingImage) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Detection Evidence</p>
                  <div className="border rounded-md overflow-hidden bg-muted flex items-center justify-center min-h-[100px]">
                    {isLoadingImage ? (
                      <span className="text-muted-foreground text-sm py-8">Loading image...</span>
                    ) : selectedViolationImage ? (
                      <img src={selectedViolationImage} alt="Violation Evidence" className="w-full object-contain max-h-[250px]" />
                    ) : null}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{selectedViolation.location}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {new Date(selectedViolation.violation_date).toLocaleString('en-IN')}
                </p>
              </div>

              {selectedViolation.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedViolation.description}</p>
                </div>
              )}

              {selectedViolation.vehicle && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold mb-2">Vehicle Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Name</p>
                      <p className="font-medium">{selectedViolation.vehicle.owner_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Phone</p>
                      <p className="font-medium">{selectedViolation.vehicle.owner_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Type</p>
                      <p className="font-medium capitalize">{selectedViolation.vehicle.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">HSRP Status</p>
                      <Badge variant={selectedViolation.vehicle.has_hsrp ? 'outline' : 'destructive'}>
                        {selectedViolation.vehicle.has_hsrp ? 'Compliant' : 'Non-Compliant'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  SMS Notification Details
                </p>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getSmsStatusBadge(selectedViolation.sms_status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200 mt-1">{selectedViolation.sms_recipient || 'Not Configured'}</p>
                  </div>
                  {selectedViolation.sms_sent_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sent At</p>
                      <p className="font-medium text-gray-900 dark:text-gray-200 mt-1">{new Date(selectedViolation.sms_sent_at).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {selectedViolation.sms_error && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Error Details</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                        {selectedViolation.sms_error}
                      </p>
                    </div>
                  )}
                  
                  {canManage && (!selectedViolation.sms_status || selectedViolation.sms_status === 'failed' || selectedViolation.sms_status === 'disabled' || selectedViolation.sms_status === 'not_configured') && (
                    <div className="col-span-2 mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={retryingSms === selectedViolation.id}
                        onClick={async () => {
                          if (!selectedViolation) return;
                          setRetryingSms(selectedViolation.id);
                          
                          try {
                            const settings = await getSettings();
                            let recipient = selectedViolation.sms_recipient || settings.sms_notification_number;
                            if (!recipient.startsWith('+')) recipient = `${settings.sms_country_code}${recipient}`;
                            
                            await updateViolation(selectedViolation.id, { sms_status: 'retrying' });
                            setSelectedViolation({ ...selectedViolation, sms_status: 'retrying' });
                            
                            const res = await fetch('http://localhost:8000/api/sms/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                phone_number: recipient,
                                message: `TRAFFIC NOTICE: The number plate for vehicle ${selectedViolation.plate_number} has been detected as invalid or non-compliant (Non-HSRP). Please verify your registration plates and ensure compliance to avoid penalties.`,
                              })
                            });
                            
                            const data = await res.json();
                            
                            let updatePayload: any = {};
                            if (res.ok && data.status === 'sent') {
                              updatePayload = {
                                sms_status: 'sent',
                                sms_recipient: recipient,
                                sms_sent_at: new Date().toISOString(),
                                sms_message_id: data.message_id,
                                sms_error: null
                              };
                            } else {
                              updatePayload = {
                                sms_status: 'failed',
                                sms_recipient: recipient,
                                sms_error: data.message || 'Retry failed'
                              };
                            }
                            
                            const updated = await updateViolation(selectedViolation.id, updatePayload);
                            setSelectedViolation(updated!);
                            loadViolations();
                            
                          } catch (err) {
                            console.error(err);
                            const updated = await updateViolation(selectedViolation.id, {
                                sms_status: 'failed',
                                sms_error: 'Network error during retry'
                            });
                            setSelectedViolation(updated!);
                            loadViolations();
                          } finally {
                            setRetryingSms(null);
                          }
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {retryingSms === selectedViolation.id ? 'Retrying...' : 'Retry SMS Notification'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold mb-2">Report Actions</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleDownloadReport(selectedViolation)}
                      disabled={isGeneratingReport === selectedViolation.id}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF Report
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleSendWhatsApp(selectedViolation)}
                      disabled={isGeneratingReport === selectedViolation.id}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send via WhatsApp
                    </Button>
                  </div>
                </div>
              )}

              {canManage && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold mb-2">Update Status</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedViolation.id, 'notified')}
                      disabled={selectedViolation.status === 'notified'}
                    >
                      Mark Notified
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedViolation.id, 'paid')}
                      disabled={selectedViolation.status === 'paid'}
                    >
                      Mark Paid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedViolation.id, 'dismissed')}
                      disabled={selectedViolation.status === 'dismissed'}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
