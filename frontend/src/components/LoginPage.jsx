import React, { useState } from 'react';
import { Hexagon, Eye, EyeOff, Loader, Lock, Mail, ArrowRight } from 'lucide-react';

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoUsers = {
    'admin@nexuscore.ai': { password: 'admin123', name: 'Admin User', role: 'Super Admin' },
    'sarah@nexuscore.ai': { password: 'sarah123', name: 'Sarah Chen', role: 'VP Engineering' },
    'james@nexuscore.ai': { password: 'james123', name: 'James Rodriguez', role: 'Product Manager' },
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = demoUsers[email];
      if (user && user.password === password) {
        onLogin({ email, ...user });
      } else {
        setError('Invalid credentials. Try a demo account below.');
        setLoading(false);
      }
    }, 1500);
  };

  const quickLogin = (email, password) => {
    setEmail(email);
    setPassword(password);
    setLoading(true);
    setError('');
    setTimeout(() => {
      const user = demoUsers[email];
      onLogin({ email, ...user });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-cyan-900/15 blur-[150px]"></div>
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/15 blur-[150px]"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 shadow-2xl shadow-cyan-500/30 mb-6">
            <Hexagon className="h-9 w-9 text-white opacity-90" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold tracking-wide text-white mb-2">NEXUS<span className="font-light text-cyan-400">Core</span></h1>
          <p className="text-zinc-500 text-sm">Agentic AI Enterprise Platform</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-8 border border-zinc-800/80">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-sm text-zinc-500 mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">{error}</div>
            )}

            <button type="submit" disabled={loading || !email || !password}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader className="h-4 w-4 animate-spin" /> Authenticating...</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 glass-panel rounded-2xl p-5 border border-zinc-800/80">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3 text-center">Demo Accounts</p>
          <div className="space-y-2">
            {Object.entries(demoUsers).map(([email, user]) => (
              <button key={email} onClick={() => quickLogin(email, user.password)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-black/30 border border-zinc-800 hover:border-cyan-500/30 transition-all group cursor-pointer">
                <div className="text-left">
                  <p className="text-sm text-white group-hover:text-cyan-400 transition-colors">{user.name}</p>
                  <p className="text-[10px] text-zinc-500">{user.role} • {email}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-cyan-400" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-zinc-700 text-center mt-6">NexusCore v2.0 • Multi-Agent Enterprise Platform</p>
      </div>
    </div>
  );
}
