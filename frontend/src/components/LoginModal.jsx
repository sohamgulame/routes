import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  Building2, 
  Truck, 
  UserCheck, 
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Assam');
  const [district, setDistrict] = useState('Kamrup Metropolitan');
  const [role, setRole] = useState('ROLE_CITIZEN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Role verification state
  const [roleSecurityCode, setRoleSecurityCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fleetLicenseOrGstin, setFleetLicenseOrGstin] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(loginUsername, loginPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Bad credentials');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      username,
      password,
      fullName,
      email,
      phone,
      role,
      state,
      district,
      roleSecurityCode: roleSecurityCode ? roleSecurityCode.trim() : null,
      companyName: companyName ? companyName.trim() : null,
      fleetLicenseOrGstin: fleetLicenseOrGstin ? fleetLicenseOrGstin.trim() : null,
    };

    const res = await register(payload);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Registration failed. Please check required credentials.');
    }
  };

  const isGovRole = ['ROLE_ADMIN', 'ROLE_DISASTER_OFFICER', 'ROLE_FIELD_ENGINEER'].includes(role);
  const isTransporterRole = role === 'ROLE_TRANSPORTER';

  const getCodePlaceholder = () => {
    if (role === 'ROLE_ADMIN') return 'Enter official MDoNER State Admin Key';
    if (role === 'ROLE_DISASTER_OFFICER') return 'Enter official SDMA Authorization PIN';
    if (role === 'ROLE_FIELD_ENGINEER') return 'Enter official BRO / Field Engineer PIN';
    return 'Enter Departmental Security Code';
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b162c] w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-[#183158] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.1)] relative max-h-[90vh] overflow-y-auto">
        {/* Header with Title & Icon */}
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-400 text-slate-950 shadow-md">
            <Lock className="w-5 h-5 font-bold stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              {tab === 'login' ? 'Government & Stakeholder Sign In' : 'Government & Stakeholder Sign Up'}
            </h3>
            <p className="text-xs text-slate-400">AURA-NER Authenticated Access Portal</p>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex p-1 bg-[#050c1a] rounded-xl border border-[#14294a] mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              tab === 'login'
                ? 'bg-[#0f2347] text-white border border-[#234b82] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Official Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              tab === 'signup'
                ? 'bg-[#0f2347] text-white border border-[#234b82] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Create New Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#2d0b13] border border-[#581423] text-rose-300 text-xs flex items-center space-x-2.5 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* -------------------- TAB 1: SIGN IN -------------------- */}
        {tab === 'login' ? (
          <div className="space-y-4 text-xs">
            <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Username / Official ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Enter your registered username"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl pl-10 pr-3.5 py-3 text-white text-sm focus:outline-none focus:border-teal-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl pl-10 pr-3.5 py-3 text-white text-sm focus:outline-none focus:border-teal-400 transition"
                />
              </div>
            </div>

            <div className="flex justify-end items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-transparent hover:bg-[#14294a]/40 rounded-xl text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 text-xs flex items-center space-x-2 transition"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
        ) : (
          /* -------------------- TAB 2: SIGN UP -------------------- */
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Your Official Role</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setError(null);
                }}
                className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-teal-400 text-xs"
              >
                <option value="ROLE_CITIZEN">👤 Public Citizen / Road User</option>
                <option value="ROLE_TRANSPORTER">🚚 Commercial Transporter & Fleet Lead</option>
                <option value="ROLE_DISASTER_OFFICER">🚨 Disaster Management Officer (SDMA / NDRF)</option>
                <option value="ROLE_FIELD_ENGINEER">👷 Field Engineer & BRO (Border Roads)</option>
                <option value="ROLE_ADMIN">🛡️ State Command Admin (MDoNER)</option>
              </select>
            </div>

            {/* Dynamic Verification Field for Government Officials */}
            {isGovRole && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Departmental Authorization Secret Code (Required)</span>
                </label>
                <input
                  type="password"
                  required
                  value={roleSecurityCode}
                  onChange={(e) => setRoleSecurityCode(e.target.value)}
                  placeholder={getCodePlaceholder()}
                  className="w-full bg-[#071326] border border-purple-500/60 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-purple-400 text-xs"
                />
                <p className="text-[10px] text-purple-400">
                  * Official government key issued by MDoNER / SDMA State Headquarters.
                </p>
              </div>
            )}

            {/* Dynamic Verification Fields for Transporters */}
            {isTransporterRole && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 animate-in fade-in duration-150">
                <p className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Transport Enterprise & Fleet Verification (Required)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-0.5">Company Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Brahmaputra Logistics"
                      className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-1.5 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-0.5">GSTIN / Fleet License No.</label>
                    <input
                      type="text"
                      required
                      value={fleetLicenseOrGstin}
                      onChange={(e) => setFleetLicenseOrGstin(e.target.value)}
                      placeholder="e.g. 18AABCN1234F1Z5"
                      className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Personal Details */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kalita"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.gov.in"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="Assam">Assam</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">District / Jurisdiction</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. East Khasi Hills"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>

            {/* Account Credentials */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Choose Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="unique_username"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Choose Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#071326] border border-[#183158] rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#14294a]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent hover:bg-[#14294a]/40 rounded-xl text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 text-xs flex items-center space-x-2 transition"
              >
                <span>{loading ? 'Registering...' : 'Register & Enter'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
