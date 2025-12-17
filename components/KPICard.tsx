import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'amber' | 'green' | 'red';
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = 'blue' 
}) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between transition-transform hover:scale-[1.01]">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {subtitle && (
          <p className="text-slate-400 text-xs mt-2 font-medium">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};