'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { AdminContentSkeleton } from '@/components/admin/AdminSkeletons';

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  online_available: boolean;
  offline_available: boolean;
  home_visit_available: boolean;
  is_active: boolean;
}

const CATEGORIES = [
  { value: 'pain_relief_physiotherapy', label: 'Pain Relief & Physiotherapy Care' },
  { value: 'advanced_rehabilitation', label: 'Advanced Rehabilitation & Recovery' },
  { value: 'massage_recovery', label: 'Massage & Recovery' },
  { value: 'nutrition_lifestyle', label: 'Nutrition & Lifestyle Care' },
  { value: 'mental_wellness', label: 'Mental Wellness & Performance Care' },
  { value: 'therapeutic_yoga', label: 'Therapeutic Yoga & Wellness' },
  { value: 'sports_performance', label: 'Sports Performance & Athlete Development' },
  { value: 'digital_health', label: 'Digital Health & Web Solutions' },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: 'pain_relief_physiotherapy',
    description: '',
    online_available: true,
    offline_available: true,
    home_visit_available: false,
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingService(null);
    setForm({
      name: '',
      slug: '',
      category: 'pain_relief_physiotherapy',
      description: '',
      online_available: true,
      offline_available: true,
      home_visit_available: false,
      is_active: true,
    });
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setForm({
      name: service.name,
      slug: service.slug,
      category: service.category,
      description: service.description || '',
      online_available: service.online_available,
      offline_available: service.offline_available,
      home_visit_available: service.home_visit_available,
      is_active: service.is_active,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService ? { id: editingService.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchServices();
      } else {
        alert(data.error || 'Failed to save service');
      }
    } catch (error) {
      alert('Failed to save service');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      } else {
        alert(data.error || 'Failed to delete service');
      }
    } catch (error) {
      alert('Failed to delete service');
    }
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  if (loading) {
    return <AdminContentSkeleton variant="table" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm shrink-0"
        >
          <Plus size={18} className="mr-1.5" />
          Add Service
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No services yet. Click "Add Service" to create one.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {CATEGORIES.find(c => c.value === service.category)?.label || service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {service.online_available && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">Online</span>}
                      {service.offline_available && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">Offline</span>}
                      {service.home_visit_available && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">Home Visit</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      service.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openEditModal(service)} className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={form.online_available} onChange={(e) => setForm({ ...form, online_available: e.target.checked })} className="rounded text-orange-500" />
                  <span className="text-sm text-gray-700">Online Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={form.offline_available} onChange={(e) => setForm({ ...form, offline_available: e.target.checked })} className="rounded text-orange-500" />
                  <span className="text-sm text-gray-700">Offline Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={form.home_visit_available} onChange={(e) => setForm({ ...form, home_visit_available: e.target.checked })} className="rounded text-orange-500" />
                  <span className="text-sm text-gray-700">Home Visit Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded text-orange-500" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  {saving ? 'Saving...' : (editingService ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
