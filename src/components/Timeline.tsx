import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Tooltip, Cell } from 'recharts';

interface TimelineProps {
  data: any[];
  onClick: (data: any) => void;
  severities: string[];
  getSeverityColor: (severity: string) => string;
}

const Timeline: React.FC<TimelineProps> = ({ data, onClick, severities, getSeverityColor }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-16 w-full bg-[#0f0f0f] border-b border-gray-800 shrink-0 relative group">
      <div className="absolute top-1 left-2 text-[10px] text-gray-500 font-mono z-10 select-none">
        Timeline
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} onClick={onClick} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <Tooltip
            labelFormatter={(label) => `Time: ${label}`}
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #333', 
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ padding: 0 }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
          />
          {severities.map(sev => (
            <Bar 
              key={sev} 
              dataKey={sev} 
              stackId="a" 
              fill={getSeverityColor(sev)} 
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(Timeline);
