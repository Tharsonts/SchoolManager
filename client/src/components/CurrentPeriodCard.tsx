import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { useCurrentPeriod } from '@/hooks/useCurrentPeriod';

export default function CurrentPeriodCard() {
  const { data: periodData, isLoading } = useCurrentPeriod();
  const period = periodData?.data;
  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Calendar className="h-6 w-6 text-green-600" />
            Período Letivo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-6"></div>
            <p className="text-lg text-green-700 font-medium">Carregando período letivo...</p>
            <p className="text-sm text-green-600 mt-2">Aguarde um momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!period) {
    return (
      <Card className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Calendar className="h-6 w-6 text-yellow-600" />
            Período Letivo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-6" />
            <p className="text-xl text-yellow-700 font-semibold mb-2">Nenhum período ativo</p>
            <p className="text-yellow-600">Aguarde a definição do período letivo pela direção</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Corrigir problema de timezone - usar UTC para evitar offset
  const startDate = new Date(period.startDate + 'T00:00:00.000Z');
  const endDate = new Date(period.endDate + 'T23:59:59.999Z');
  
  const today = new Date();
  const remainingDays = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Calendar className="h-6 w-6 text-green-600" />
          Período Letivo Atual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-green-800">{period.name}</h3>
            <Badge className={`${getStatusColor(period.status)} text-sm px-3 py-1`}>
              {period.status === 'active' ? 'Em Andamento' : 
               period.status === 'pendente' ? 'Pendente' : 
               period.status === 'completed' ? 'Concluído' : period.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-green-600 font-medium mb-2">📅 Início</p>
              <p className="text-xl font-bold text-gray-800">{startDate.toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-green-600 font-medium mb-2">🏁 Fim</p>
              <p className="text-xl font-bold text-gray-800">{endDate.toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          {period.status === 'active' && (
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-800">
                    {remainingDays > 0 ? `${remainingDays} dias restantes` : 'Período finalizado'}
                  </p>
                  <p className="text-sm text-green-600">Continue acompanhando seu progresso!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
