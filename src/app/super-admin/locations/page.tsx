'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, X, Check, Loader2, 
  MapPin, Building2, Phone, Star, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminContentSkeleton } from '@/components/admin/AdminSkeletons';

interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  tier: number;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

interface ClinicCenter {
  id: string;
  location_id: string;
  name: string;
  slug: string;
  address: string;
  landmark: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  facilities: string[];
  rating: number;
  total_reviews: number;
  is_featured: boolean;
  is_active: boolean;
}

const FACILITIES_OPTIONS = [
  'Parking', 'Wheelchair Access', 'Waiting Lounge', 'Private Rooms',
  'Cafeteria', 'Pharmacy', 'Lab Services', 'X-Ray', 'MRI',
  'Physiotherapy Equipment', 'Hydrotherapy Pool', 'Gym Equipment',
];

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [clinicCenters, setCenters] = useState<ClinicCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  
  // Modal states
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<ClinicCenter | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'center' | 'location'; id: string } | null>(null);
  
  // Center form
  const [centerForm, setCenterForm] = useState({
    location_id: '', name: '', slug: '', address: '', landmark: '', pincode: '',
    phone: '', email: '', facilities: [] as string[], rating: 4.5, is_featured: false, is_active: true,
  });

  // Location form
  const [locationForm, setLocationForm] = useState({
    name: '', city: '', address: '', tier: 1, phone: '', email: '', is_active: true,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, centersRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/clinic-centers')
      ]);
      const locData = await locRes.json();
      const centersData = await centersRes.json();
      if (locData.success) setLocations(locData.data || []);
      if (centersData.success) setCenters(centersData.data.centers || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetCenterForm = () => {
    setCenterForm({
      location_id: '', name: '', slug: '', address: '', landmark: '', pincode: '',
      phone: '', email: '', facilities: [], rating: 4.5, is_featured: false, is_active: true,
    });
    setEditingCenter(null);
  };

  const resetLocationForm = () => {
    setLocationForm({ name: '', city: '', address: '', tier: 1, phone: '', email: '', is_active: true });
    setEditingLocation(null);
  };

  const openCenterModal = (locationId?: string, center?: ClinicCenter) => {
    if (center) {
      setEditingCenter(center);
      setCenterForm({
        location_id: center.location_id, name: center.name, slug: center.slug,
        address: center.address, landmark: center.landmark || '', pincode: center.pincode || '',
        phone: center.phone || '', email: center.email || '', facilities: center.facilities || [],
        rating: center.rating || 4.5, is_featured: center.is_featured, is_active: center.is_active,
      });
    } else {
      resetCenterForm();
      if (locationId) setCenterForm(prev => ({ ...prev, location_id: locationId }));
    }
    setShowCenterModal(true);
  };

  const openLocationModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        name: location.name, city: location.city, address: location.address,
        tier: location.tier, phone: location.phone || '', email: location.email || '', is_active: location.is_active,
      });
    } else {
      resetLocationForm();
    }
    setShowLocationModal(true);
  };

  const handleSaveCenter = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = editingCenter ? `/api/admin/clinic-centers/${editingCenter.id}` : '/api/admin/clinic-centers';
      const response = await fetch(url, {
        method: editingCenter ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(centerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setSuccess(editingCenter ? 'Center updated!' : 'Center created!');
      setShowCenterModal(false);
      resetCenterForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = editingLocation ? `/api/admin/locations/${editingLocation.id}` : '/api/admin/locations';
      const response = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setSuccess(editingLocation ? 'Location updated!' : 'Location created!');
      setShowLocationModal(false);
      resetLocationForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const url = deleteConfirm.type === 'center' 
        ? `/api/admin/clinic-centers/${deleteConfirm.id}`
        : `/api/admin/locations/${deleteConfirm.id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setSuccess('Deleted successfully!');
      setDeleteConfirm(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const toggleFacility = (f: string) => setCenterForm(prev => ({
    ...prev, facilities: prev.facilities.includes(f) ? prev.facilities.filter(x => x !== f) : [...prev.facilities, f]
  }));

  const cities = [...new Set(locations.map(l => l.city))].sort();
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || loc.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (!selectedCity || loc.city === selectedCity);
  });
  const getCentersForLocation = (locationId: string) => clinicCenters.filter(c => c.location_id === locationId);

  if (loading) {
    return <AdminContentSkeleton variant="cards" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Locations & Clinic Centers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage {locations.length} locations and {clinicCenters.length} clinic centers</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => openLocationModal()} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />Add City
          </Button>
          <Button onClick={() => openCenterModal()} className="bg-cyan-600 hover:bg-cyan-700" size="sm">
            <Plus className="h-4 w-4 mr-1" />Add Center
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
          <Check className="h-5 w-5" />{success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />{error}
          <Button size="sm" variant="ghost" onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={selectedCity || ''} onChange={(e) => setSelectedCity(e.target.value || null)} className="px-4 py-2 border rounded-lg bg-white min-w-[150px]">
          <option value="">All Cities</option>
          {cities.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg"><MapPin className="h-5 w-5 text-cyan-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{locations.length}</p><p className="text-sm text-gray-500">Locations</p></div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg"><Building2 className="h-5 w-5 text-teal-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clinicCenters.length}</p><p className="text-sm text-gray-500">Clinic Centers</p></div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Star className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clinicCenters.filter(c => c.is_featured).length}</p><p className="text-sm text-gray-500">Featured</p></div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Check className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{clinicCenters.filter(c => c.is_active).length}</p><p className="text-sm text-gray-500">Active</p></div>
          </div>
        </div>
      </div>

      {/* Locations List */}
      <div className="space-y-4">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No locations found</p>
          </div>
        ) : (
          filteredLocations.map(location => {
            const centers = getCentersForLocation(location.id);
            const isExpanded = expandedLocation === location.id;
            return (
              <div key={location.id} className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedLocation(isExpanded ? null : location.id)}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{location.city}</h3>
                        <Badge className={location.tier === 1 ? 'bg-cyan-500' : 'bg-teal-500'}>Tier {location.tier}</Badge>
                        {!location.is_active && <Badge variant="outline" className="text-red-500 border-red-200">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openLocationModal(location); }}><Edit2 className="h-4 w-4" /></Button>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{centers.length}</p>
                      <p className="text-xs text-gray-500">Centers</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    {centers.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No clinic centers in this location</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {centers.map(center => (
                          <div key={center.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{center.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{center.address}</p>
                              </div>
                              {center.is_featured && <Badge className="bg-amber-100 text-amber-700 border-0">Featured</Badge>}
                            </div>
                            {center.landmark && <p className="text-xs text-gray-400 mb-2">Near: {center.landmark}</p>}
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="h-4 w-4 text-amber-400 fill-current" />
                              <span className="text-sm font-medium">{center.rating?.toFixed(1) || '4.5'}</span>
                              <span className="text-xs text-gray-400">({center.total_reviews || 0} reviews)</span>
                            </div>
                            {center.facilities?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {center.facilities.slice(0, 3).map((f, i) => <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>)}
                                {center.facilities.length > 3 && <Badge variant="outline" className="text-[10px]">+{center.facilities.length - 3}</Badge>}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-3 border-t">
                              <Badge className={center.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {center.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openCenterModal(undefined, center)} className="h-8 w-8 p-0"><Edit2 className="h-4 w-4 text-gray-500" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: 'center', id: center.id })} className="h-8 w-8 p-0 hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="sm" onClick={() => openCenterModal(location.id)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />Add Center to {location.city}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Center Modal */}
      {showCenterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingCenter ? 'Edit Clinic Center' : 'Add New Clinic Center'}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowCenterModal(false); resetCenterForm(); }}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <select value={centerForm.location_id} onChange={(e) => setCenterForm(prev => ({ ...prev, location_id: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Location</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.city} - {loc.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Center Name *</label>
                  <Input value={centerForm.name} onChange={(e) => setCenterForm(prev => ({ ...prev, name: e.target.value, slug: editingCenter ? prev.slug : generateSlug(e.target.value) }))} placeholder="H2H Koramangala Center" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug *</label>
                  <Input value={centerForm.slug} onChange={(e) => setCenterForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="h2h-koramangala" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <Input value={centerForm.address} onChange={(e) => setCenterForm(prev => ({ ...prev, address: e.target.value }))} placeholder="123, Main Road, Area" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Landmark</label><Input value={centerForm.landmark} onChange={(e) => setCenterForm(prev => ({ ...prev, landmark: e.target.value }))} placeholder="Near Metro Station" /></div>
                <div><label className="block text-sm font-medium mb-1">Pincode</label><Input value={centerForm.pincode} onChange={(e) => setCenterForm(prev => ({ ...prev, pincode: e.target.value }))} placeholder="560001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Phone</label><Input value={centerForm.phone} onChange={(e) => setCenterForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 80 1234 5678" /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><Input value={centerForm.email} onChange={(e) => setCenterForm(prev => ({ ...prev, email: e.target.value }))} placeholder="center@healtohealth.in" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facilities</label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES_OPTIONS.map(f => (
                    <Badge key={f} variant={centerForm.facilities.includes(f) ? 'default' : 'outline'} className={`cursor-pointer ${centerForm.facilities.includes(f) ? 'bg-cyan-500' : ''}`} onClick={() => toggleFacility(f)}>{f}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Rating</label><Input type="number" step="0.1" min="1" max="5" value={centerForm.rating} onChange={(e) => setCenterForm(prev => ({ ...prev, rating: parseFloat(e.target.value) }))} /></div>
                <div className="flex items-center gap-2 pt-6"><input type="checkbox" id="is_featured" checked={centerForm.is_featured} onChange={(e) => setCenterForm(prev => ({ ...prev, is_featured: e.target.checked }))} className="h-4 w-4" /><label htmlFor="is_featured" className="text-sm">Featured</label></div>
                <div className="flex items-center gap-2 pt-6"><input type="checkbox" id="is_active" checked={centerForm.is_active} onChange={(e) => setCenterForm(prev => ({ ...prev, is_active: e.target.checked }))} className="h-4 w-4" /><label htmlFor="is_active" className="text-sm">Active</label></div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowCenterModal(false); resetCenterForm(); }}>Cancel</Button>
              <Button onClick={handleSaveCenter} disabled={saving || !centerForm.location_id || !centerForm.name || !centerForm.slug || !centerForm.address} className="bg-cyan-600 hover:bg-cyan-700">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingCenter ? 'Update Center' : 'Create Center'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingLocation ? 'Edit Location' : 'Add New City/Location'}</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowLocationModal(false); resetLocationForm(); }}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">City Name *</label><Input value={locationForm.city} onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Bangalore" required /></div>
                <div><label className="block text-sm font-medium mb-1">Location Name *</label><Input value={locationForm.name} onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))} placeholder="H2H Bangalore" required /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Address *</label><Input value={locationForm.address} onChange={(e) => setLocationForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Indiranagar, Bangalore 560038" required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1">Tier</label><select value={locationForm.tier} onChange={(e) => setLocationForm(prev => ({ ...prev, tier: parseInt(e.target.value) }))} className="w-full px-3 py-2 border rounded-lg"><option value={1}>Tier 1</option><option value={2}>Tier 2</option><option value={3}>Tier 3</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Phone</label><Input value={locationForm.phone} onChange={(e) => setLocationForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 80 1234 5678" /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><Input value={locationForm.email} onChange={(e) => setLocationForm(prev => ({ ...prev, email: e.target.value }))} placeholder="city@healtohealth.in" /></div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" id="loc_active" checked={locationForm.is_active} onChange={(e) => setLocationForm(prev => ({ ...prev, is_active: e.target.checked }))} className="h-4 w-4" /><label htmlFor="loc_active" className="text-sm">Active</label></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowLocationModal(false); resetLocationForm(); }}>Cancel</Button>
              <Button onClick={handleSaveLocation} disabled={saving || !locationForm.city || !locationForm.name || !locationForm.address} className="bg-cyan-600 hover:bg-cyan-700">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingLocation ? 'Update Location' : 'Create Location'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete {deleteConfirm.type === 'center' ? 'Clinic Center' : 'Location'}?</h3>
            <p className="text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
