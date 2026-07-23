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
import { Search, Eye, Car, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getAllVehicles } from '@/db/api';
import type { Vehicle, VehicleFilters } from '@/types/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVehicles();
  }, [filters]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getAllVehicles(filters);
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, plateNumber: searchQuery || undefined });
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getExpiryBadge = (date: string | null, label: string) => {
    if (!date) {
      return <Badge variant="secondary">Not Set</Badge>;
    }

    const expired = isExpired(date);
    const daysUntilExpiry = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (expired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" />
          Expired
        </Badge>
      );
    }

    if (daysUntilExpiry <= 30) {
      return (
        <Badge variant="default" className="flex items-center gap-1 w-fit">
          <AlertCircle className="w-3 h-3" />
          Expiring Soon
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <CheckCircle className="w-3 h-3" />
        Valid
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vehicle Database</h1>
        <p className="text-muted-foreground">RTO registered vehicles information</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
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
              value={filters.hasHsrp === undefined ? 'all' : filters.hasHsrp ? 'yes' : 'no'}
              onValueChange={(value) => 
                setFilters({ ...filters, hasHsrp: value === 'all' ? undefined : value === 'yes' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="HSRP Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="yes">HSRP Compliant</SelectItem>
                <SelectItem value="no">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.vehicleType || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, vehicleType: value === 'all' ? undefined : value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Vehicles</CardTitle>
          <CardDescription>
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>HSRP</TableHead>
                    <TableHead>RC Status</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plate_number}</TableCell>
                      <TableCell>{vehicle.owner_name}</TableCell>
                      <TableCell className="capitalize">{vehicle.vehicle_type}</TableCell>
                      <TableCell>
                        <Badge variant={vehicle.has_hsrp ? 'outline' : 'destructive'}>
                          {vehicle.has_hsrp ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getExpiryBadge(vehicle.rc_expiry, 'RC')}</TableCell>
                      <TableCell>{getExpiryBadge(vehicle.insurance_expiry, 'Insurance')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVehicle(vehicle)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Detail Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
            <DialogDescription>
              Complete RTO registration information
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plate Number</p>
                  <p className="font-semibold text-lg">{selectedVehicle.plate_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium capitalize">{selectedVehicle.vehicle_type}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold mb-3">Owner Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Owner Name</p>
                    <p className="font-medium">{selectedVehicle.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-medium">{selectedVehicle.owner_phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold mb-3">Compliance Status</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HSRP Compliance</span>
                    <Badge variant={selectedVehicle.has_hsrp ? 'outline' : 'destructive'}>
                      {selectedVehicle.has_hsrp ? 'Compliant' : 'Non-Compliant'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">RC Registration</span>
                      {selectedVehicle.rc_expiry && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(selectedVehicle.rc_expiry).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    {getExpiryBadge(selectedVehicle.rc_expiry, 'RC')}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">Insurance</span>
                      {selectedVehicle.insurance_expiry && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(selectedVehicle.insurance_expiry).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    {getExpiryBadge(selectedVehicle.insurance_expiry, 'Insurance')}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">PUC Certificate</span>
                      {selectedVehicle.puc_expiry && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(selectedVehicle.puc_expiry).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    {getExpiryBadge(selectedVehicle.puc_expiry, 'PUC')}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">Registered On</p>
                <p className="font-medium">
                  {new Date(selectedVehicle.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
