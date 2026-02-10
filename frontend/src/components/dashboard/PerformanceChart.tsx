import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceChartProps {
  data?: Array<{ name: string; automacoes: number; leads: number }>;
}

export function PerformanceChart({ data = [] }: PerformanceChartProps) {
  // Se não houver dados, mostrar mensagem
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-semibold text-lg">Performance Geral</h3>
            <p className="text-sm text-muted-foreground">Automações e leads nos últimos 7 meses</p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg">Performance Geral</h3>
          <p className="text-sm text-muted-foreground">Automações e leads nos últimos 7 meses</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Automações</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">Leads</span>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAutomacoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(260, 100%, 65%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(260, 100%, 65%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 8%)',
                border: '1px solid hsl(222, 30%, 18%)',
                borderRadius: '12px',
                color: 'hsl(215, 20%, 65%)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'automacoes') {
                  return [`${value} automação${value !== 1 ? 'ões' : ''}`, 'Automações'];
                }
                if (name === 'leads') {
                  return [`${value.toLocaleString('pt-BR')} lead${value !== 1 ? 's' : ''}`, 'Leads'];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="automacoes" 
              stroke="hsl(190, 100%, 50%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorAutomacoes)" 
            />
            <Area 
              type="monotone" 
              dataKey="leads" 
              stroke="hsl(260, 100%, 65%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorLeads)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
