import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao realizar logout');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema"
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Erro ao realizar logout",
        description: "Ocorreu um erro ao tentar sair do sistema",
        variant: "destructive"
      });
    }
  });
  
  const goToDashboard = () => {
    if (!user) return setLocation("/");
    
    switch (user.role) {
      case "admin":
        setLocation("/dashboard?role=admin");
        break;
      case "coordinator":
        setLocation("/dashboard?role=coordinator");
        break;
      case "teacher":
        setLocation("/dashboard?role=teacher");
        break;
      case "student":
        setLocation("/dashboard?role=student");
        break;
      default:
        setLocation("/dashboard");
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
    goToDashboard
  };
}
