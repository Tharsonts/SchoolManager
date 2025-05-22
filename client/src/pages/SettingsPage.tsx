import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function SettingsPage() {
  const [schoolInfo, setSchoolInfo] = useState({
    name: "Escola Modelo",
    slogan: "Educando para o futuro",
    address: "Av. Educação, 1000 - Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01000-000",
    phone: "(11) 3333-4444",
    email: "contato@escolamodelo.edu.br",
    website: "www.escolamodelo.edu.br"
  });

  const [systemSettings, setSystemSettings] = useState({
    gradeScale: "0-10",
    attendanceThreshold: "75",
    academicYear: "2023",
    academicTerms: "4",
    notifyAbsences: true,
    notifyLowGrades: true,
    enableParentAccess: true,
    requireAttendanceDaily: true
  });

  return (
    <MainLayout pageTitle="Configurações">
      <Tabs defaultValue="school">
        <TabsList className="mb-4">
          <TabsTrigger value="school">Informações da Escola</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Escola</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua instituição de ensino.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">Nome da Escola</Label>
                    <Input 
                      id="school-name" 
                      value={schoolInfo.name}
                      onChange={e => setSchoolInfo({...schoolInfo, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-slogan">Slogan</Label>
                    <Input 
                      id="school-slogan" 
                      value={schoolInfo.slogan}
                      onChange={e => setSchoolInfo({...schoolInfo, slogan: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="school-address">Endereço</Label>
                    <Input 
                      id="school-address" 
                      value={schoolInfo.address}
                      onChange={e => setSchoolInfo({...schoolInfo, address: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-city">Cidade</Label>
                    <Input 
                      id="school-city" 
                      value={schoolInfo.city}
                      onChange={e => setSchoolInfo({...schoolInfo, city: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-state">Estado</Label>
                    <Input 
                      id="school-state" 
                      value={schoolInfo.state}
                      onChange={e => setSchoolInfo({...schoolInfo, state: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-zipcode">CEP</Label>
                    <Input 
                      id="school-zipcode" 
                      value={schoolInfo.zipCode}
                      onChange={e => setSchoolInfo({...schoolInfo, zipCode: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-phone">Telefone</Label>
                    <Input 
                      id="school-phone" 
                      value={schoolInfo.phone}
                      onChange={e => setSchoolInfo({...schoolInfo, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-email">Email</Label>
                    <Input 
                      id="school-email" 
                      type="email" 
                      value={schoolInfo.email}
                      onChange={e => setSchoolInfo({...schoolInfo, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school-website">Website</Label>
                    <Input 
                      id="school-website" 
                      value={schoolInfo.website}
                      onChange={e => setSchoolInfo({...schoolInfo, website: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Ajuste os parâmetros de funcionamento do sistema escolar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade-scale">Escala de Notas</Label>
                    <Select 
                      value={systemSettings.gradeScale}
                      onValueChange={value => setSystemSettings({...systemSettings, gradeScale: value})}
                    >
                      <SelectTrigger id="grade-scale">
                        <SelectValue placeholder="Selecione a escala" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-10">0-10</SelectItem>
                        <SelectItem value="0-100">0-100</SelectItem>
                        <SelectItem value="A-F">A-F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-threshold">Limite de Presença (%)</Label>
                    <Input 
                      id="attendance-threshold" 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={systemSettings.attendanceThreshold}
                      onChange={e => setSystemSettings({...systemSettings, attendanceThreshold: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academic-year">Ano Letivo Atual</Label>
                    <Input 
                      id="academic-year" 
                      value={systemSettings.academicYear}
                      onChange={e => setSystemSettings({...systemSettings, academicYear: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academic-terms">Número de Bimestres/Trimestres</Label>
                    <Select 
                      value={systemSettings.academicTerms}
                      onValueChange={value => setSystemSettings({...systemSettings, academicTerms: value})}
                    >
                      <SelectTrigger id="academic-terms">
                        <SelectValue placeholder="Selecione o número" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 (Semestres)</SelectItem>
                        <SelectItem value="3">3 (Trimestres)</SelectItem>
                        <SelectItem value="4">4 (Bimestres)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-absences" className="cursor-pointer">Notificar sobre ausências</Label>
                      <Switch 
                        id="notify-absences" 
                        checked={systemSettings.notifyAbsences}
                        onCheckedChange={checked => setSystemSettings({...systemSettings, notifyAbsences: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-grades" className="cursor-pointer">Notificar sobre notas baixas</Label>
                      <Switch 
                        id="notify-grades" 
                        checked={systemSettings.notifyLowGrades}
                        onCheckedChange={checked => setSystemSettings({...systemSettings, notifyLowGrades: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="parent-access" className="cursor-pointer">Habilitar acesso para pais</Label>
                      <Switch 
                        id="parent-access" 
                        checked={systemSettings.enableParentAccess}
                        onCheckedChange={checked => setSystemSettings({...systemSettings, enableParentAccess: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="require-attendance" className="cursor-pointer">Exigir registro de presença diário</Label>
                      <Switch 
                        id="require-attendance" 
                        checked={systemSettings.requireAttendanceDaily}
                        onCheckedChange={checked => setSystemSettings({...systemSettings, requireAttendanceDaily: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Salvar Configurações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Personalize como as notificações são enviadas e recebidas no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Notificações por Email</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="email-grades" />
                        <Label htmlFor="email-grades">Notas lançadas</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="email-attendance" />
                        <Label htmlFor="email-attendance">Registro de presença</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="email-events" />
                        <Label htmlFor="email-events">Eventos escolares</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="email-announcements" />
                        <Label htmlFor="email-announcements">Anúncios importantes</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notificações no Sistema</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="system-grades" defaultChecked />
                        <Label htmlFor="system-grades">Notas lançadas</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="system-attendance" defaultChecked />
                        <Label htmlFor="system-attendance">Registro de presença</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="system-events" defaultChecked />
                        <Label htmlFor="system-events">Eventos escolares</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="system-announcements" defaultChecked />
                        <Label htmlFor="system-announcements">Anúncios importantes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="system-messages" defaultChecked />
                        <Label htmlFor="system-messages">Mensagens diretas</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-template">Template de Email para Notificações</Label>
                    <Textarea 
                      id="notification-template" 
                      rows={4}
                      placeholder="Olá {nome}, você recebeu uma nova {tipo_notificacao} no sistema escolar."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Salvar Preferências
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Defina parâmetros de segurança para o sistema escolar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password-policy">Política de Senhas</Label>
                    <Select defaultValue="strong">
                      <SelectTrigger id="password-policy">
                        <SelectValue placeholder="Selecione a política" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básica (min. 6 caracteres)</SelectItem>
                        <SelectItem value="medium">Média (min. 8 caracteres, letras e números)</SelectItem>
                        <SelectItem value="strong">Forte (min. 10 caracteres, letras, números e símbolos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Tempo de Sessão (minutos)</Label>
                    <Input id="session-timeout" type="number" min="5" defaultValue="30" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-attempts">Tentativas de Login Permitidas</Label>
                    <Input id="login-attempts" type="number" min="1" defaultValue="5" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="2fa-enabled" className="cursor-pointer">Habilitar Autenticação em Dois Fatores</Label>
                      <Switch id="2fa-enabled" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enforce-password-change" className="cursor-pointer">Forçar troca de senha a cada 90 dias</Label>
                      <Switch id="enforce-password-change" defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ip-restriction" className="cursor-pointer">Restringir acesso por localização IP</Label>
                      <Switch id="ip-restriction" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allowed-ips">IPs Permitidos</Label>
                    <Textarea 
                      id="allowed-ips" 
                      placeholder="Insira os IPs permitidos separados por vírgula (deixe em branco para permitir todos)"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    Salvar Configurações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}