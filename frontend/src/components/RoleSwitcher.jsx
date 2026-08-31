import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Shield, Truck, AlertTriangle, HardHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleSwitcher({ onOpenLoginModal }) {
  const { currentUser, logout, isGuest } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isGuest) {
    return (
      <button
        onClick={onOpenLoginModal}
        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
      >
        <User className="w-4 h-4 font-bold" />
        <span>Official Sign In</span>
      </button>
    );
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return { label: 'State Command Admin', color: 'bg-purple-950/60 text-purple-300 border-purple-500/40', icon: <Shield className="w-3.5 h-3.5" /> };
      case 'ROLE_DISASTER_OFFICER':
        return { label: 'Disaster Management Officer', color: 'bg-rose-950/60 text-rose-300 border-rose-500/40', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
      case 'ROLE_TRANSPORTER':
        return { label: 'Transporter & Fleet Lead', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40', icon: <Truck className="w-3.5 h-3.5" /> };
      case 'ROLE_FIELD_ENGINEER':
        return { label: 'Field Engineer & BRO', color: 'bg-amber-950/60 text-amber-300 border-amber-500/40', icon: <HardHat className="w-3.5 h-3.5" /> };
      default:
        return { label: 'Authenticated User', color: 'bg-sky-950/60 text-sky-300 border-sky-600/40', icon: <User className="w-3.5 h-3.5" /> };
    }
  };

  const badge = getRoleBadge(currentUser?.role || '');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#0a1828] border border-[#162e4c] hover:border-sky-400 transition text-left shadow-lg"
      >
        <div className="w-7 h-7 rounded-lg bg-[#050c1a] border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
          {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-bold text-white">{currentUser.fullName || currentUser.username}</div>
          <div className="text-[10px] text-sky-400 font-medium tracking-wide flex items-center gap-1">
            {badge.label}
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Profile & Session Details Dropdown with z-[9001] and Solid Background */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#0b162c] rounded-2xl border border-[#183158] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(56,189,248,0.15)] p-4 z-[9001] animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          <div className="pb-3 border-b border-[#14294a]">
            <p className="font-bold text-white text-sm font-display">{currentUser.fullName || currentUser.username}</p>
            <p className="text-slate-400 text-[11px]">@{currentUser.username}</p>
            <div className={`mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border font-bold text-[10px] ${badge.color}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </div>
          </div>

          <div className="py-2.5 space-y-1 text-slate-300 text-[11px]">
            <p><strong className="text-white">Jurisdiction:</strong> {currentUser.district || 'All Districts'}, {currentUser.state || 'NER'}</p>
            <p><strong className="text-white">Session Status:</strong> <span className="text-emerald-400 font-bold">Active (JWT Verified)</span></p>
          </div>

          <div className="pt-2 border-t border-[#14294a]">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-rose-950/40 hover:bg-rose-950/70 text-rose-400 border border-rose-800/50 rounded-xl font-bold transition shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
