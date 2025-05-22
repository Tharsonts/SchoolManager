import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LogoIcon } from "@/components/layout/LogoIcon";
import { Moon, Sun, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const handleLoginDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Login bem-sucedido!",
          description: `Bem-vindo(a), ${data.user.firstName || ""}!`,
        });
        setLocation("/dashboard");
      } else {
        const errorData = await response.json().catch(() => ({ message: "Falha no login" }));
        setError(errorData.message || "Falha no login. Verifique suas credenciais.");
      }
    } catch (err) {
      setError("Erro ao conectar ao servidor. Tente novamente.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-800 dark:to-dark-900">
      <Card className="max-w-md w-full space-y-8 bg-white dark:bg-dark-600 p-8 rounded-xl shadow-lg fade-in">
        <div className="text-center">
          <div className="flex justify-center">
            <LogoIcon className="h-12 w-12 text-primary-500 dark:text-primary-300" />
          </div>
          <h1 className="mt-2 font-heading font-bold text-3xl text-primary-500 dark:text-primary-300">Sistema Escolar Digital</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Faça login para acessar o sistema</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <form 
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              autoComplete="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-400 rounded-md shadow-sm dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              autoComplete="current-password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-dark-400 rounded-md shadow-sm dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox id="remember-me" className="h-4 w-4 text-primary-500 focus:ring-primary-400 border-gray-300 rounded" />
              <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Lembrar-me</Label>
            </div>
          </div>

          <div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </div>

          <div className="text-center">
            <Button 
              type="button" 
              variant="outline"
              onClick={toggleTheme}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-500 dark:text-primary-300 bg-white dark:bg-dark-600 hover:bg-gray-100 dark:hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Modo Escuro</span>
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-dark-400"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-dark-600 text-gray-500 dark:text-gray-400">Usuários de Demonstração</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleLoginDemo('admin@escola.com', 'admin123')} 
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-400 rounded-md shadow-sm bg-white dark:bg-dark-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
              <span className="block">Administrador</span>
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleLoginDemo('coord@escola.com', 'coord123')} 
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-400 rounded-md shadow-sm bg-white dark:bg-dark-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
              <span className="block">Coordenador</span>
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleLoginDemo('prof@escola.com', 'prof123')} 
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-400 rounded-md shadow-sm bg-white dark:bg-dark-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
              <span className="block">Professor</span>
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleLoginDemo('aluno@escola.com', 'aluno123')} 
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-400 rounded-md shadow-sm bg-white dark:bg-dark-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
              <span className="block">Aluno</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
