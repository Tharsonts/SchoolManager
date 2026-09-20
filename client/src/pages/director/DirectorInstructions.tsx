import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, FileText, MessageSquare, Calendar } from 'lucide-react';
import AdminInstructionModal from '@/components/instructions/AdminInstructionModal';

const DirectorInstructions: React.FC = () => {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Instruções do Diretor</h1>
        <Button onClick={() => setShowGuide(true)} className="bg-gray-800 hover:bg-gray-900 text-white">
          Guia Interativo
        </Button>
      </div>
      <p className="text-gray-600 mb-6">
        Este painel apresenta as principais funcionalidades disponíveis para o Diretor, com atalhos rápidos para cada seção.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Períodos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Gerencie os períodos acadêmicos e status de execução.</p>
            <Link href="/director/periods">
              <Button variant="outline" size="sm">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Aprove documentos, matrículas e solicitações pendentes.</p>
            <Link href="/director/approvals">
              <Button variant="outline" size="sm">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comunicados</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Publique, edite e acompanhe comunicados da instituição.</p>
            <Link href="/director/announcements">
              <Button variant="outline" size="sm">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendário</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Visualize eventos e prazos em toda a escola.</p>
            <Link href="/director/calendar">
              <Button variant="outline" size="sm">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Comunique-se com a equipe e acompanhe conversas importantes.</p>
            <Link href="/director/chat">
              <Button variant="outline" size="sm">Acessar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <AdminInstructionModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
      />
    </div>
  );
};

export default DirectorInstructions;