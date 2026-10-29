import React, { useState } from 'react';
import { ShieldCheck, ChefHat, UserCheck, Lock, Mail, ArrowRight, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { UserRole } from '../../types/restaurant';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, quickDemoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      onNavigate('/kitchen');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoSwitch = async (role: UserRole) => {
    setError(null);
    try {
      await quickDemoLogin(role);
      if (role === 'kitchen') {
        onNavigate('/kitchen');
      } else {
        onNavigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#E05A47] text-white flex items-center justify-center mx-auto shadow-sm">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1E1B18]">Staff & Operations Sign In</h1>
          <p className="text-xs text-[#78716C]">
            Authorized access for Kitchen Display and Super Admin Management.
          </p>
        </div>

        {/* Quick Demo Switcher (Instant 1-Click Role Testing) */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-[#1E1B18] uppercase tracking-wider block">
            Instant Demo Role Switching
          </span>
          <p className="text-xs text-[#78716C]">
            Test any authenticated interface with verified roles without typing passwords:
          </p>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <button
              onClick={() => handleDemoSwitch('admin')}
              disabled={isLoading}
              className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D8] hover:border-[#E05A47] hover:bg-[#E05A47]/5 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#E05A47]/10 text-[#E05A47] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#1E1B18] block">Super Admin (Owner)</span>
                  <span className="text-[10px] text-[#78716C]">Full restaurant, menu & financial access</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8A29E]" />
            </button>

            <button
              onClick={() => handleDemoSwitch('kitchen')}
              disabled={isLoading}
              className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D8] hover:border-[#E05A47] hover:bg-[#E05A47]/5 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#1E1B18] block">Kitchen Staff (Chef Vikram)</span>
                  <span className="text-[10px] text-[#78716C]">Live KDS display & prep status controls</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8A29E]" />
            </button>

            <button
              onClick={() => handleDemoSwitch('manager')}
              disabled={isLoading}
              className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D8] hover:border-[#E05A47] hover:bg-[#E05A47]/5 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#1E1B18] block">Floor Manager (Pooja Iyer)</span>
                  <span className="text-[10px] text-[#78716C]">Order overrides, discounts & table setup</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A8A29E]" />
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <span className="text-[11px] font-bold text-[#1E1B18] uppercase tracking-wider block">
            Or Sign In with Email
          </span>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#1E1B18] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@demorestaurant.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1E1B18] block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E2D8] focus:outline-none focus:border-[#E05A47]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#1E1B18] text-white text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
