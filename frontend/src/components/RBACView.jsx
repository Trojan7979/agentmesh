import React, { useState } from 'react';
import {
  Users, Shield, ShieldCheck, ShieldAlert, Eye, EyeOff,
  Plus, Search, ChevronDown, Check, X, Lock, Unlock,
  Settings, Database, GitMerge, Cpu, MessageSquare,
  BarChart3, UserPlus, Trash2, Edit3
} from 'lucide-react';

const initialUsers = [
  {
    id: 'u-1', name: 'Admin User', email: 'admin@nexuscore.ai', role: 'Super Admin',
    avatar: 'AU', status: 'active', department: 'IT',
    permissions: ['dashboard', 'simulator', 'onboarding', 'workflows', 'agents', 'collab', 'meetings', 'sla', 'chat', 'audit', 'rbac']
  },
  {
    id: 'u-2', name: 'Sarah Chen', email: 'sarah@nexuscore.ai', role: 'VP Engineering',
    avatar: 'SC', status: 'active', department: 'Engineering',
    permissions: ['dashboard', 'simulator', 'workflows', 'agents', 'collab', 'meetings', 'sla', 'chat', 'audit']
  },
  {
    id: 'u-3', name: 'James Rodriguez', email: 'james@nexuscore.ai', role: 'Product Manager',
    avatar: 'JR', status: 'active', department: 'Product',
    permissions: ['dashboard', 'workflows', 'meetings', 'chat']
  },
  {
    id: 'u-4', name: 'Priya Patel', email: 'priya@nexuscore.ai', role: 'UX Designer',
    avatar: 'PP', status: 'active', department: 'Design',
    permissions: ['dashboard', 'meetings', 'chat']
  },
  {
    id: 'u-5', name: 'Alex Kim', email: 'alex@nexuscore.ai', role: 'Backend Lead',
    avatar: 'AK', status: 'active', department: 'Engineering',
    permissions: ['dashboard', 'simulator', 'workflows', 'agents', 'collab', 'sla', 'chat', 'audit']
  },
  {
    id: 'u-6', name: 'Maria Lopez', email: 'maria@nexuscore.ai', role: 'HR Manager',
    avatar: 'ML', status: 'active', department: 'HR',
    permissions: ['dashboard', 'onboarding', 'meetings', 'chat']
  },
  {
    id: 'u-7', name: 'David Brown', email: 'david@nexuscore.ai', role: 'Auditor',
    avatar: 'DB', status: 'inactive', department: 'Compliance',
    permissions: ['dashboard', 'audit']
  },
];

const allModules = [
  { id: 'dashboard', name: 'Command Center', icon: BarChart3, desc: 'View system metrics and status' },
  { id: 'simulator', name: 'Live Simulator', icon: GitMerge, desc: 'Run workflow simulations' },
  { id: 'onboarding', name: 'Onboarding', icon: UserPlus, desc: 'Manage employee onboarding' },
  { id: 'workflows', name: 'Workflows', icon: GitMerge, desc: 'View process orchestration' },
  { id: 'agents', name: 'Swarm Agents', icon: Cpu, desc: 'Monitor AI agent swarm' },
  { id: 'collab', name: 'Agent Collab', icon: Users, desc: 'View agent collaboration' },
  { id: 'meetings', name: 'Meetings', icon: MessageSquare, desc: 'Meeting intelligence & scheduling' },
  { id: 'sla', name: 'SLA Monitor', icon: Shield, desc: 'Track SLA health & bottlenecks' },
  { id: 'chat', name: 'Agent Chat', icon: MessageSquare, desc: 'Chat with AI agents' },
  { id: 'audit', name: 'Audit Trail', icon: ShieldCheck, desc: 'View system audit logs' },
  { id: 'rbac', name: 'Access Control', icon: Lock, desc: 'Manage user permissions' },
];

const roleTemplates = [
  { name: 'Super Admin', permissions: allModules.map(m => m.id) },
  { name: 'Manager', permissions: ['dashboard', 'simulator', 'workflows', 'agents', 'collab', 'meetings', 'sla', 'chat', 'audit'] },
  { name: 'Team Lead', permissions: ['dashboard', 'workflows', 'agents', 'meetings', 'chat', 'audit'] },
  { name: 'Member', permissions: ['dashboard', 'meetings', 'chat'] },
  { name: 'Viewer', permissions: ['dashboard'] },
];

export function RBACView({ currentUser }) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Member', department: '' });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePermission = (userId, moduleId) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const has = u.permissions.includes(moduleId);
      return {
        ...u,
        permissions: has ? u.permissions.filter(p => p !== moduleId) : [...u.permissions, moduleId]
      };
    }));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => {
        const has = prev.permissions.includes(moduleId);
        return { ...prev, permissions: has ? prev.permissions.filter(p => p !== moduleId) : [...prev.permissions, moduleId] };
      });
    }
  };

  const applyTemplate = (userId, templateName) => {
    const template = roleTemplates.find(t => t.name === templateName);
    if (!template) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: templateName, permissions: [...template.permissions] } : u));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, role: templateName, permissions: [...template.permissions] }));
    }
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    const template = roleTemplates.find(t => t.name === newUser.role) || roleTemplates[3];
    const user = {
      id: `u-new-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      status: 'active',
      department: newUser.department || 'General',
      permissions: [...template.permissions]
    };
    setUsers(prev => [...prev, user]);
    setShowAddUser(false);
    setNewUser({ name: '', email: '', role: 'Member', department: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-light text-white">Access <span className="font-bold text-cyan-400">Control</span></h1>
        <button onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Total Users</p>
          <p className="text-3xl font-bold text-white">{users.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Active</p>
          <p className="text-3xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Roles</p>
          <p className="text-3xl font-bold text-purple-400">{new Set(users.map(u => u.role)).size}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Modules</p>
          <p className="text-3xl font-bold text-cyan-400">{allModules.length}</p>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowAddUser(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New User</h2>
              <button onClick={() => setShowAddUser(false)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Full Name</label>
                <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@nexuscore.ai" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Department</label>
                <input type="text" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Engineering" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Role Template</label>
                <div className="flex flex-wrap gap-2">
                  {roleTemplates.map(t => (
                    <button key={t.name} onClick={() => setNewUser({ ...newUser, role: t.name })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        newUser.role === t.name ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-800 border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}>{t.name}</button>
                  ))}
                </div>
              </div>
              <button onClick={addUser} disabled={!newUser.name || !newUser.email}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-sm font-bold text-white disabled:opacity-30">
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* User List */}
        <div className="w-80 flex-shrink-0">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredUsers.map(user => (
              <button key={user.id} onClick={() => setSelectedUser(user)}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all text-left ${
                  selectedUser?.id === user.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'glass-panel hover:border-zinc-600'
                }`}>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-white text-xs font-bold border border-zinc-700 flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">{user.name}</h4>
                  <p className="text-[10px] text-zinc-500">{user.role}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`h-2 w-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-zinc-600'}`}></span>
                  <span className="text-[10px] text-zinc-600">{user.permissions.length}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="flex-1">
          {selectedUser ? (
            <div className="glass-panel p-6 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold border border-zinc-700">
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                    <p className="text-sm text-zinc-500">{selectedUser.email} • {selectedUser.department}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedUser.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-zinc-700/50 text-zinc-400'
                }`}>{selectedUser.status}</span>
              </div>

              {/* Role Templates */}
              <div className="mb-6">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Role Template</p>
                <div className="flex flex-wrap gap-2">
                  {roleTemplates.map(t => (
                    <button key={t.name} onClick={() => applyTemplate(selectedUser.id, t.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedUser.role === t.name ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-zinc-800 border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}>{t.name} ({t.permissions.length})</button>
                  ))}
                </div>
              </div>

              {/* Module Permissions */}
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Module Access ({selectedUser.permissions.length}/{allModules.length})</p>
                <div className="space-y-2">
                  {allModules.map(mod => {
                    const hasAccess = selectedUser.permissions.includes(mod.id);
                    return (
                      <div key={mod.id}
                        onClick={() => togglePermission(selectedUser.id, mod.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          hasAccess ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            hasAccess ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-600'
                          }`}>
                            <mod.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-medium ${hasAccess ? 'text-white' : 'text-zinc-500'}`}>{mod.name}</h4>
                            <p className="text-[10px] text-zinc-600">{mod.desc}</p>
                          </div>
                        </div>
                        <div className={`h-6 w-11 rounded-full flex items-center transition-all ${hasAccess ? 'bg-green-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                          <div className="h-5 w-5 bg-white rounded-full mx-0.5 shadow-sm"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center">
              <Shield className="h-16 w-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-bold text-zinc-500 mb-2">Select a User</h3>
              <p className="text-sm text-zinc-600">Choose a user from the list to view and manage their module permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
