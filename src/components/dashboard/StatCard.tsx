
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "accent";
}

export function StatCard({ label, value, subValue, icon: Icon, trend, color = "primary" }: StatCardProps) {
  return (
    <div className="bg-card border rounded-xl p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '↑ 12%' : '↓ 3%'}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{label}</h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-headline font-bold">{value}</span>
          {subValue && <span className="text-sm text-muted-foreground">{subValue}</span>}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 ${color === 'primary' ? 'bg-primary/20' : 'bg-accent/20'}`}></div>
    </div>
  );
}
