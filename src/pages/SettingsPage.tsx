import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, getSmsStats } from '@/db/api';
import { Settings } from '@/types/types';
import { 
  Save, 
  Smartphone, 
  Settings as SettingsIcon, 
  Bell, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send
} from 'lucide-react';

export const SettingsPage = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [testSmsStatus, setTestSmsStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [smsStats, setSmsStats] = useState({ sent: 0, pending: 0 });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
        
        const stats = await getSmsStats();
        setSmsStats(stats);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load settings.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!settings) return;
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings({ ...settings, [name]: checked });
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setIsSaving(true);
    setMessage(null);
    try {
      await updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!settings) return;
    setTestSmsStatus('sending');
    setMessage(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: `${settings.sms_country_code}${settings.sms_notification_number}`,
          message: 'This is a test message from the ANPR/HSRP System.',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'sent') {
        setTestSmsStatus('success');
        setMessage({ type: 'success', text: 'Test SMS successfully triggered (Check backend console for Mock output).' });
        // Refresh stats
        getSmsStats().then(setSmsStats).catch(console.error);
      } else {
        setTestSmsStatus('error');
        setMessage({ type: 'error', text: data.message || 'Failed to trigger Test SMS.' });
      }
    } catch (err) {
      setTestSmsStatus('error');
      setMessage({ type: 'error', text: 'Network error or backend not running.' });
    } finally {
      setTimeout(() => setTestSmsStatus('idle'), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">System Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* SMS Settings Panel */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">SMS Notification Settings</h2>
            </div>
            
            {message && (
              <div className={`mb-6 flex items-center gap-2 rounded-lg p-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <p>{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Enable SMS Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Enable SMS Alerts</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically send SMS to vehicle owners upon violation detection.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input 
                    type="checkbox" 
                    name="sms_enabled"
                    checked={settings?.sms_enabled || false}
                    onChange={handleChange}
                    className="peer sr-only" 
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                </label>
              </div>

              {/* Default Mobile Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fallback / Default Notification Number
                </label>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  This number will be used if a vehicle's owner phone is not found in the database.
                </p>
                <div className="flex gap-2">
                  <div className="w-1/4">
                    <select
                      name="sms_country_code"
                      value={settings?.sms_country_code || '+91'}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                    </select>
                  </div>
                  <div className="relative w-3/4">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="sms_notification_number"
                      value={settings?.sms_notification_number || ''}
                      onChange={handleChange}
                      placeholder="e.g. 9960204620"
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={handleSendTestSms}
                  disabled={testSmsStatus === 'sending'}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                >
                  {testSmsStatus === 'sending' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Test SMS
                </button>
                
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <SettingsIcon className="h-5 w-5 text-gray-500" />
              Integration Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-2 text-sm dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Provider API</span>
                <span className="font-medium text-green-600 dark:text-green-400">Connected</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 text-sm dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Total SMS Sent</span>
                <span className="font-medium text-gray-900 dark:text-white">{smsStats.sent}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Pending</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">{smsStats.pending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
