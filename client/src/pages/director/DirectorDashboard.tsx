import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, GraduationCap, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useDirectorDashboard } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DirectorDashboard: React.FC = () => {
  const { data: stats, isLoading } = useDirectorDashboard();

  // Buscar próximos eventos (7 dias) para lista rápida
  const today = new Date();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const { data: upcoming = [] } = useQuery({
    queryKey: ['director-upcoming-events'],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: today.toISOString(),
        endDate: in7Days.toISOString()
      });
      const res = await fetch(`/api/calendar/events?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar eventos');
      return res.json();
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard do Diretor</h1>
        <p className="text-gray-600">Visão geral e atalhos principais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '…' : stats?.totals?.students ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Total de alunos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '…' : stats?.totals?.teachers ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Total de professores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '…' : stats?.totals?.classes ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Turmas no período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendário</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '…' : stats?.upcomingEvents?.count ?? '—'}</div>
            <p className="text-xs text-muted-foreground">Eventos próximos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/director/approvals">
              <Button variant="outline" size="sm" className="w-full">Gerenciar Aprovações</Button>
            </Link>
            <Link href="/director/periods">
              <Button variant="outline" size="sm" className="w-full">Gerenciar Períodos</Button>
            </Link>
            <Link href="/director/announcements">
              <Button variant="outline" size="sm" className="w-full">Gerenciar Comunicados</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade listada ainda.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 5).map((evt: any) => (
                  <div key={evt.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{evt.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(evt.start)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DirectorDashboard;