import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${data.user.firstName}!`
        });
        
        // Forçar atualização do estado e redirecionamento
        setTimeout(() => {
          // Redirecionar baseado no role
          switch (data.user.role) {
            case "admin":
              setLocation("/admin/dashboard");
              break;
            case "coordinator":
              setLocation("/coordinator/dashboard");
              break;
            case "teacher":
              setLocation("/teacher/dashboard");
              break;
            case "student":
              setLocation("/student/dashboard");
              break;
            default:
              setLocation("/dashboard");
          }
        }, 100);
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema"
      });
      // Redirecionamento imediato e substituição do histórico
      setLocation("/");
      window.location.replace("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth
  };
}