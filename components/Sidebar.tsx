import React from 'react';
import { LayoutDashboard, Package, Settings, AlertCircle, LogOut, UserCircle } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'inventory' | 'alerts';
  onChangeView: (view: 'dashboard' | 'inventory' | 'alerts') => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user, onLogout }) => {
  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl">
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-lg font-bold">
            S
          </div>
          StockFlow
        </h1>
        <p className="text-slate-500 text-xs mt-2 ml-1">智能库存管理系统</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <div
          className={linkClass(currentView === 'dashboard')}
          onClick={() => onChangeView('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">仪表盘</span>
        </div>
        <div
          className={linkClass(currentView === 'inventory')}
          onClick={() => onChangeView('inventory')}
        >
          <Package size={20} />
          <span className="font-medium">库存录入</span>
        </div>
        <div
          className={linkClass(currentView === 'alerts')}
          onClick={() => onChangeView('alerts')}
        >
          <AlertCircle size={20} />
          <span className="font-medium">预警通知</span>
        </div>
      </nav>

      <div className="p-4 space-y-2 border-t border-slate-800">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 mb-2">
            <UserCircle size={20} className="text-blue-400" />
            <div className="overflow-hidden">
               <p className="text-xs text-slate-400">当前用户</p>
               <p className="text-sm font-bold text-white truncate">{user.username}</p>
            </div>
          </div>
        )}
        
        <div className={linkClass(false)}>
          <Settings size={20} />
          <span className="font-medium">系统设置</span>
        </div>
        
        {onLogout && (
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-slate-400 hover:bg-rose-900/20 hover:text-rose-400"
            onClick={onLogout}
          >
            <LogOut size={20} />
            <span className="font-medium">退出登录</span>
          </div>
        )}
      </div>
    </div>
  );
};