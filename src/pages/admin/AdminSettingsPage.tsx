import React, { useEffect, useState } from 'react';
import {
  Save,
  Check,
  Database,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { RestaurantSettings } from '../../types/restaurant';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth';

export const AdminSettingsPage: React.FC = () => {
  const { refreshSettings } = useCart();
  const { user } = useAuth();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [sett, supa] = await Promise.all([
        api.getSettings(),
        api.getSupabaseStatus()
      ]);
      setSettings(sett);
      setSupabaseStatus(supa);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateSettings(settings, user?.full_name);
      setSettings(updated);
      await refreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMigrationScript = () => {
    const sqlScript = `-- Demo Restaurant: Complete Supabase PostgreSQL Schema & RLS Policies
-- Execute in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role_type AS ENUM ('admin', 'manager', 'kitchen');
CREATE TYPE order_status_type AS ENUM ('new', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled');
CREATE TYPE payment_status_type AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE payment_method_type AS ENUM ('pay_at_counter', 'cash', 'upi', 'card');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Refer to /supabase/migrations/20261029000000_init_restaurant_schema.sql for all tables and RLS policies!`;

    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (loading || !settings) {
    return (
      <div className="py-24 text-center text-xs text-[#78716C]">
        Loading restaurant configuration...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E05A47] block">
            System Preferences
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Restaurant Profile & Integrations</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#E05A47] hover:bg-[#cf4e3b] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 self-start sm:self-auto"
        >
          {saving ? (
            <span>Saving Changes...</span>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Restaurant Settings</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Supabase Connection Status Card */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E05A47]" />
            <span>Supabase Database & Realtime Status</span>
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            supabaseStatus?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {supabaseStatus?.configured ? 'Connected to External Supabase' : 'Internal Engine Active (Ready for Supabase)'}
          </span>
        </div>

        <p className="text-xs text-[#78716C] leading-relaxed">
          {supabaseStatus?.notes}
        </p>

        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs space-y-2">
          <span className="font-bold text-[#1E1B18] block">How to connect external Supabase:</span>
          <ol className="list-decimal list-inside space-y-1 text-[#78716C]">
            <li>Open your Supabase Project dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#E05A47] hover:underline">supabase.com</a>.</li>
            <li>Go to <strong>Project Settings → API</strong> and copy your Project URL, anon key, and service role key.</li>
            <li>Set <code className="font-mono text-[#E05A47]">VITE_SUPABASE_URL</code> and <code className="font-mono text-[#E05A47]">VITE_SUPABASE_ANON_KEY</code> in your environment variables.</li>
            <li>Run the generated SQL schema migration file located at <code className="font-mono text-[#E05A47]">/supabase/migrations/20261029000000_init_restaurant_schema.sql</code> in your Supabase SQL editor.</li>
          </ol>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleCopyMigrationScript}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E2D8] font-semibold text-xs text-[#1E1B18] hover:bg-[#F3EFEA] flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSql ? 'Copied Reference!' : 'Copy SQL Migration Reference'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Restaurant Identity */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-[#E05A47]" />
            <span>Brand Identity & Contact</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Restaurant Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Public Story & Description</label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold block mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Email Concierge</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Ordering */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E05A47]" />
            <span>Operating Hours & Kitchen Dispatch</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold block mb-1">Opening Time</label>
              <input
                type="text"
                value={settings.opening_time}
                onChange={(e) => setSettings({ ...settings, opening_time: e.target.value })}
                placeholder="11:00 AM"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Closing Time</label>
              <input
                type="text"
                value={settings.closing_time}
                onChange={(e) => setSettings({ ...settings, closing_time: e.target.value })}
                placeholder="11:00 PM"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Default Prep Time (mins)</label>
              <input
                type="number"
                value={settings.default_prep_time_minutes}
                onChange={(e) => setSettings({ ...settings, default_prep_time_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.order_acceptance_enabled}
                onChange={(e) => setSettings({ ...settings, order_acceptance_enabled: e.target.checked })}
              />
              <span className="font-semibold text-[#1E1B18]">
                Kitchen Order Acceptance Active (Turn off to stop all incoming orders)
              </span>
            </label>
          </div>
        </div>

        {/* Financial & Tax Configuration */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-[#1E1B18] uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#E05A47]" />
            <span>Currency & Taxes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="font-semibold block mb-1">Currency Code</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8] uppercase"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currency_symbol}
                onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Tax Rate (GST %)</label>
              <input
                type="number"
                step="0.01"
                value={settings.tax_rate_percent}
                onChange={(e) => setSettings({ ...settings, tax_rate_percent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Service Charge %</label>
              <input
                type="number"
                step="0.01"
                value={settings.service_charge_percent}
                onChange={(e) => setSettings({ ...settings, service_charge_percent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Pay-At-Counter Customer Instructions</label>
            <textarea
              value={settings.pay_at_counter_instructions}
              onChange={(e) => setSettings({ ...settings, pay_at_counter_instructions: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E2D8]"
            />
          </div>
        </div>

      </form>

    </div>
  );
};
