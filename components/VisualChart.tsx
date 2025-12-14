import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { AIResponseVisuals } from '../types';

interface Props {
  visuals: AIResponseVisuals;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const VisualChart: React.FC<Props> = ({ visuals }) => {
  if (!visuals || visuals.type === 'none') return null;

  return (
    <div className="mt-4 p-4 bg-brand-900/50 rounded-xl border border-brand-800">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{visuals.title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {visuals.type === 'bar' ? (
            <BarChart data={visuals.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#f1f5f9' }}
                cursor={{fill: '#334155', opacity: 0.4}}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {visuals.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#3b82f6' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          ) : visuals.type === 'pie' ? (
            <PieChart>
              <Pie
                data={visuals.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {visuals.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chart type not implemented
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};