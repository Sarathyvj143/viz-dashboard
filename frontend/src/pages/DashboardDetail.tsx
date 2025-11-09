import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from 'react-grid-layout';
import { ShareIcon, LinkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import DashboardBuilder from '../components/dashboard/DashboardBuilder';
import { dashboardsApi } from '../api/dashboards';
import { Dashboard, DashboardCreate, DashboardUpdate } from '../types/dashboard';
import { useToastStore } from '../store/toastStore';
import { getErrorMessage } from '../utils/errors';

const dashboardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
});

type DashboardFormData = z.infer<typeof dashboardSchema>;

export default function DashboardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { showToast } = useToastStore();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DashboardFormData>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: '',
      description: '',
      is_public: false,
    },
  });

  useEffect(() => {
    if (!isNew && id) {
      fetchDashboard();
    }
  }, [id, isNew]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardsApi.getById(Number(id));
      setDashboard(data);
      reset({
        name: data.name,
        description: data.description || '',
        is_public: data.is_public,
      });

      // Load layout from dashboard
      if (data.layout && typeof data.layout === 'object' && 'items' in data.layout) {
        setLayout(data.layout.items as Layout[]);
      } else {
        setLayout([]);
      }

      // Set share URL if public
      if (data.public_token) {
        setShareUrl(`${window.location.origin}/public/${data.public_token}`);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to load dashboard. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DashboardFormData) => {
    try {
      setSaving(true);
      setError(null);

      if (isNew) {
        // Create new dashboard
        const newDashboard: DashboardCreate = {
          name: data.name,
          description: data.description,
          layout: {},  // Empty layout initially
          is_public: data.is_public || false,
        };
        const created = await dashboardsApi.create(newDashboard);
        navigate(`/dashboards/${created.id}`);
      } else {
        // Update existing dashboard
        const updateData: DashboardUpdate = {
          name: data.name,
          description: data.description,
          is_public: data.is_public,
        };
        const updated = await dashboardsApi.update(Number(id), updateData);
        setDashboard(updated);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to save dashboard. Please try again.');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLayoutSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save layout to backend
      const updateData: DashboardUpdate = {
        layout: { items: layout },
      };
      const updated = await dashboardsApi.update(Number(id), updateData);
      setDashboard(updated);

      showToast('Layout saved successfully!', 'success');
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to save layout. Please try again.');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      setGenerating(true);
      const updated = await dashboardsApi.generateShareToken(Number(id), 30);
      setDashboard(updated);
      if (updated.public_token) {
        setShareUrl(`${window.location.origin}/public/${updated.public_token}`);
      }
    } catch (err) {
      showToast('Failed to generate share link. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!window.confirm('Are you sure you want to revoke the share link? The current link will stop working.')) {
      return;
    }

    try {
      setGenerating(true);
      await dashboardsApi.revokeShareToken(Number(id));
      setShareUrl(null);
      setDashboard({ ...dashboard!, public_token: null, is_public: false });
    } catch (err) {
      showToast('Failed to revoke share link. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div>
        <Header
          title="Loading..."
          subtitle="Please wait"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div>
        <Header
          title="Error"
          subtitle="Failed to load dashboard"
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={fetchDashboard}>Retry</Button>
              <Button onClick={() => navigate('/dashboards')} variant="secondary">
                Back to Dashboards
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={isNew ? 'Create Dashboard' : dashboard?.name || 'Dashboard'}
        subtitle={isNew ? 'Create a new dashboard' : 'Edit dashboard configuration'}
        actions={
          <div className="flex gap-2">
            {!isNew && dashboard && (
              <Button
                onClick={() => setShowShareModal(true)}
                variant="secondary"
              >
                <ShareIcon className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
            <Button onClick={() => navigate('/dashboards')} variant="secondary">
              Cancel
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Dashboard Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter dashboard name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dashboard description (optional)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                {...register('is_public')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                Make this dashboard public (can be shared via link)
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Dashboard' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboards')}
            >
              Cancel
            </Button>
          </div>
        </form>

        {!isNew && dashboard && (
          <div className="mt-8">
            <DashboardBuilder
              initialLayout={layout}
              onLayoutChange={setLayout}
              onSave={handleLayoutSave}
              saving={saving}
            />
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Dashboard</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {shareUrl ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <Button onClick={copyShareLink} variant="secondary">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Anyone with this link can view this dashboard.
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleRevokeShareLink}
                    disabled={generating}
                    variant="secondary"
                    className="flex-1"
                  >
                    {generating ? 'Revoking...' : 'Revoke Link'}
                  </Button>
                  <Button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Generate a public link that allows anyone to view this dashboard without logging in.
                  The link will expire after 30 days.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateShareLink}
                    disabled={generating}
                    className="flex-1"
                  >
                    {generating ? 'Generating...' : 'Generate Share Link'}
                  </Button>
                  <Button
                    onClick={() => setShowShareModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
