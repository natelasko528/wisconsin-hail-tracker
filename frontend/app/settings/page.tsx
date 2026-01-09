'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Trash2, Eye, EyeOff, TestTube, Plus } from 'lucide-react';

interface APIKey {
  id: string;
  service: string;
  keyName: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  preview: string;
}

const SERVICE_INFO = {
  gemini: {
    name: 'Google Gemini',
    description: 'AI for lead scoring, email generation, and content creation',
    setupLink: '/GEMINI_SETUP.md',
    free: true
  },
  noaa: {
    name: 'NOAA Weather API',
    description: 'Real-time hail event data from Storm Events Database',
    setupLink: 'https://www.ncdc.noaa.gov/cdo-web/token',
    free: true
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Email delivery for campaigns',
    setupLink: 'https://sendgrid.com',
    free: true
  },
  twilio: {
    name: 'Twilio',
    description: 'SMS delivery for campaigns',
    setupLink: 'https://twilio.com',
    free: false
  },
  tloxp: {
    name: 'TLOxp',
    description: 'Skip tracing service for property owner data',
    setupLink: 'https://tloxp.com',
    free: false
  },
  ghl: {
    name: 'GoHighLevel',
    description: 'CRM integration and two-way contact sync',
    setupLink: 'https://highlevel.com',
    free: false
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKey, setNewKey] = useState({
    service: 'gemini',
    keyName: '',
    apiKey: '',
    apiSecret: ''
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchAPIKeys();
  }, [isAuthenticated]);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      const response: any = await api.settings.listAPIKeys();
      setApiKeys(response.apiKeys || []);
    } catch (error: any) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKey.apiKey || !newKey.keyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.settings.addAPIKey(newKey);
      toast.success('API key added successfully');
      setNewKey({ service: 'gemini', keyName: '', apiKey: '', apiSecret: '' });
      setShowNewKeyForm(false);
      fetchAPIKeys();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await api.settings.deleteAPIKey(id);
      toast.success('API key deleted');
      fetchAPIKeys();
    } catch (error: any) {
      toast.error('Failed to delete API key');
    }
  };

  const handleTestKey = async (service: string, apiKey: string) => {
    setTesting(service);

    try {
      const response: any = await api.settings.testAPIKey({ service, apiKey });

      if (response.success) {
        toast.success(response.message || 'API key is valid');
      } else {
        toast.error(response.message || 'API key test failed');
      }
    } catch (error: any) {
      toast.error('Failed to test API key');
    } finally {
      setTesting(null);
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Configuration</h1>
          <p className="text-muted">Manage your API keys and integrations</p>
        </div>

        {/* AI Features Banner */}
        <div className="card p-6 mb-6 border-2 border-primary">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">AI-Powered Features</h2>
              <p className="text-muted mb-4">
                Configure Google Gemini (FREE) to enable AI lead scoring, email generation,
                SMS templates, and more. Get your free API key in 2 minutes!
              </p>
              <a
                href="/GEMINI_SETUP.md"
                target="_blank"
                className="btn btn-primary inline-block"
              >
                📖 Setup Guide
              </a>
            </div>
          </div>
        </div>

        {/* Existing Keys */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your API Keys</h2>
            <button
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add API Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-muted mb-4">No API keys configured yet</p>
              <button
                onClick={() => setShowNewKeyForm(true)}
                className="btn btn-secondary"
              >
                Add Your First API Key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => {
                const info = SERVICE_INFO[key.service as keyof typeof SERVICE_INFO];
                return (
                  <div key={key.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{info?.name || key.service}</h3>
                          {info?.free && (
                            <span className="badge badge-success text-xs">FREE</span>
                          )}
                          {key.isActive ? (
                            <span className="badge badge-success text-xs">Active</span>
                          ) : (
                            <span className="badge badge-muted text-xs">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-muted mb-2">{info?.description}</p>
                        <p className="text-xs text-muted">
                          Key: {key.keyName} • Added {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestKey(key.service, key.preview)}
                          disabled={testing === key.service}
                          className="btn btn-sm flex items-center gap-1"
                          title="Test API key"
                        >
                          <TestTube size={16} />
                          {testing === key.service ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="btn btn-sm btn-danger flex items-center gap-1"
                          title="Delete API key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Key Form */}
        {showNewKeyForm && (
          <div className="card p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Add New API Key</h3>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <select
                  value={newKey.service}
                  onChange={(e) => setNewKey({ ...newKey, service: e.target.value })}
                  className="input w-full"
                >
                  {Object.entries(SERVICE_INFO).map(([value, info]) => (
                    <option key={value} value={value}>
                      {info.name} {info.free && '(FREE)'}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted mt-1">
                  {SERVICE_INFO[newKey.service as keyof typeof SERVICE_INFO]?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKey.keyName}
                  onChange={(e) => setNewKey({ ...newKey, keyName: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Production Key, Development Key"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={newKey.apiKey}
                  onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                  className="input w-full font-mono"
                  placeholder="Paste your API key here"
                  required
                />
                <p className="text-xs text-muted mt-1">
                  Get your key:{' '}
                  <a
                    href={SERVICE_INFO[newKey.service as keyof typeof SERVICE_INFO]?.setupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {SERVICE_INFO[newKey.service as keyof typeof SERVICE_INFO]?.setupLink}
                  </a>
                </p>
              </div>

              {newKey.service === 'twilio' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Auth Token (Secret)
                  </label>
                  <input
                    type="password"
                    value={newKey.apiSecret}
                    onChange={(e) => setNewKey({ ...newKey, apiSecret: e.target.value })}
                    className="input w-full font-mono"
                    placeholder="Twilio Auth Token"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save size={16} />
                  Save API Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewKeyForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Setup Guides */}
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">Setup Guides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/GEMINI_SETUP.md"
              target="_blank"
              className="p-4 border-2 border-border hover:border-primary transition-colors"
            >
              <div className="font-bold mb-1">🤖 Google Gemini Setup</div>
              <div className="text-sm text-muted">Get free AI features in 2 minutes</div>
            </a>
            <a
              href="/SUPABASE_SETUP.md"
              target="_blank"
              className="p-4 border-2 border-border hover:border-primary transition-colors"
            >
              <div className="font-bold mb-1">🗄️ Supabase Database Setup</div>
              <div className="text-sm text-muted">Set up your database in 5 minutes</div>
            </a>
            <a
              href="/DEPLOYMENT.md"
              target="_blank"
              className="p-4 border-2 border-border hover:border-primary transition-colors"
            >
              <div className="font-bold mb-1">🚀 Deployment Guide</div>
              <div className="text-sm text-muted">Deploy to production step-by-step</div>
            </a>
            <a
              href="https://www.ncdc.noaa.gov/cdo-web/token"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border-2 border-border hover:border-primary transition-colors"
            >
              <div className="font-bold mb-1">🌤️ NOAA API Token</div>
              <div className="text-sm text-muted">Get free weather data access</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
