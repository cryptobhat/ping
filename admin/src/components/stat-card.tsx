interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'brand' | 'green' | 'blue' | 'yellow';
}

const colorMap = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  yellow: 'bg-yellow-50 text-yellow-600',
};

export default function StatCard({ title, value, subtitle, color = 'brand' }: StatCardProps) {
  return (
    <div className="card" aria-label={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>
          <div className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
