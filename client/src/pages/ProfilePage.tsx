import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getUserInitials, getRoleTranslation } from "@/lib/utils";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    bio: "Professor de matemática com mais de 10 anos de experiência.",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout pageTitle="Meu Perfil">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card className="h-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.profileImageUrl || `https://i.pravatar.cc/150?u=${user?.id}`} alt={`${user?.firstName} ${user?.lastName}`} />
                  <AvatarFallback className="text-2xl">{getUserInitials(`${user?.firstName || ""} ${user?.lastName || ""}`)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{`${user?.firstName || ""} ${user?.lastName || ""}`}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <div className="mt-2">
                <Badge className="mx-auto">{getRoleTranslation(user?.role || "")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID de Usuário</p>
                  <p>{user?.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p>(11) 98765-4321</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
                  <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "01/01/2023"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="password">Alterar Senha</TabsTrigger>
              <TabsTrigger value="preferences">Preferências</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input 
                          id="firstName" 
                          name="firstName"
                          value={formData.firstName} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input 
                          id="lastName" 
                          name="lastName"
                          value={formData.lastName} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email" 
                          value={formData.email} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input 
                          id="phone" 
                          name="phone"
                          value={formData.phone} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input 
                          id="address" 
                          name="address"
                          value={formData.address} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input 
                          id="city" 
                          name="city"
                          value={formData.city} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input 
                          id="state" 
                          name="state"
                          value={formData.state} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input 
                          id="zipCode" 
                          name="zipCode"
                          value={formData.zipCode} 
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Biografia</Label>
                        <Input 
                          id="bio" 
                          name="bio"
                          value={formData.bio} 
                          onChange={handleChange}
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

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Atualize sua senha para manter a segurança da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input 
                          id="currentPassword" 
                          name="currentPassword"
                          type="password" 
                          value={formData.currentPassword}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input 
                          id="newPassword" 
                          name="newPassword"
                          type="password" 
                          value={formData.newPassword}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input 
                          id="confirmPassword" 
                          name="confirmPassword"
                          type="password" 
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-blue-500 hover:bg-blue-600">
                        Atualizar Senha
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Usuário</CardTitle>
                  <CardDescription>
                    Personalize sua experiência no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="email-notifications" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <Label htmlFor="email-notifications">Receber notificações por email</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="dark-mode" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <Label htmlFor="dark-mode">Preferir modo escuro</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="sound-notifications" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <Label htmlFor="sound-notifications">Ativar som nas notificações</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="session-timeout" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <Label htmlFor="session-timeout">Manter-me conectado</Label>
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
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}