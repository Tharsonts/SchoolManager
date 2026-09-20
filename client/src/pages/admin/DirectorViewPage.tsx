import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminApi';

export default function DirectorViewPage() {
  const { data: usersRes, isLoading } = useAdminUsers();
  const users = usersRes?.data || [];
  const director = useMemo(() => users.find((u: any) => u.role === 'director'), [users]);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UserCheck className="w-5 h-5" /> Diretor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Diretor</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6">Carregando...</div>
          ) : !director ? (
            <div className="py-6 text-gray-600">Nenhum diretor definido</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="font-medium">{director.firstName} {director.lastName}</div>
                  <div className="text-sm text-gray-500">{director.email || 'sem email'}</div>
                </div>
                <Button variant="outline" onClick={() => setShowDetails((v) => !v)}>
                  {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                </Button>
              </div>

              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Perfil</div>
                    <div className="font-medium">{director.role}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-medium">{director.status}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Matrícula</div>
                    <div className="font-medium">{director.registrationNumber || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">Telefone</div>
                    <div className="font-medium">{director.phone || '—'}</div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <div className="text-sm text-gray-600">Endereço</div>
                    <div className="font-medium">{director.address || '—'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

