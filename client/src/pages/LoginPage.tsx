import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogoIcon } from "@/components/layout/LogoIcon";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { goToDashboard } = useAuth();
  const [, navigate] = useLocation();

  // Matrícula removida

  // Animated background particles
  useEffect(() => {
    const canvas = document.getElementById('particles') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 114, 128, ${particle.opacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDemoLogin = (role: string) => {
    setSelectedRole(role);
    let demoEmail = '';
    let demoPassword = '';
    
    switch (role) {
      case 'admin':
        demoEmail = 'admin@escola.com';
        demoPassword = '123';
        break;
      case 'teacher':
        demoEmail = 'professor@escola.com';
        demoPassword = '123';
        break;
      case 'coordinator':
        demoEmail = 'coordenador@escola.com';
        demoPassword = '123';
        break;
      case 'student':
        demoEmail = 'aluno@escola.com';
        demoPassword = '123';
        break;
      case 'director':
        demoEmail = 'diretor@escola.com';
        demoPassword = '123';
        break;
    }
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Remove auto-login - now only fills the form
  };

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        // Force a page reload to update authentication state
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const error = await response.json();
        console.error('Login failed:', error.message);
        alert(error.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  const roles = [
    {
      id: 'admin',
      title: 'Administrador',
      icon: '👨‍💼',
      email: 'admin@escola.com',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-400',
      description: 'Gestão completa do sistema'
    },
    {
      id: 'teacher',
      title: 'Professor',
      icon: '👨‍🏫',
      email: 'professor@escola.com',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-400',
      description: 'Gestão de turmas e notas'
    },
    {
      id: 'coordinator',
      title: 'Coordenador',
      icon: '👩‍🏫',
      email: 'coordenador@escola.com',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-400',
      description: 'Supervisão pedagógica'
    },
    {
      id: 'student',
      title: 'Aluno',
      icon: '👨‍🎓',
      email: 'aluno@escola.com',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-400',
      description: 'Acesso ao boletim e frequência'
    },
    {
      id: 'director',
      title: 'Diretor',
      icon: '👔',
      email: 'diretor@escola.com',
      color: 'from-gray-800 to-gray-900',
      bgColor: 'bg-gray-800',
      borderColor: 'border-gray-700',
      description: 'Gestão executiva e aprovações'
    },
  ];

  // Mantemos seleção apenas para preencher e-mail/senha de demonstração

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Animated Background */}
      <canvas 
        id="particles" 
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300/40 to-indigo-300/30 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-slate-300/40 to-indigo-300/30 rounded-full blur-3xl opacity-70"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 py-6 sm:p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-8 lg:mb-10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full p-3 sm:p-4 shadow-xl">
                <LogoIcon className="h-9 w-9 sm:h-12 sm:w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-1 sm:mb-2">SchoolManager</h1>
            <p className="text-slate-600 text-base sm:text-lg">Sistema de Gestão Escolar</p>
          </div>

          {/* Login Container */}
          <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 lg:gap-10 xl:gap-14 items-center justify-center max-w-6xl mx-auto">
            {/* Demo Access (apenas o gráfico, sem títulos soltos) */}
            <div className="flex w-full flex-col items-center justify-center lg:w-1/2">

              {/* Professional Pentagon Access */}
              <div className="flex justify-center items-center py-2 animate-in fade-in slide-in-from-left-8">
                <div className="relative aspect-square w-[min(88vw,360px)] sm:w-[420px] lg:w-[460px] xl:w-[520px]">
                  {/* Pentagon SVG Container */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600">
                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="gradient-admin" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#581c87" stopOpacity="0.75"/>
                        <stop offset="30%" stopColor="#8b5cf6" stopOpacity="0.75"/>
                        <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.75"/>
                        <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.75"/>
                      </linearGradient>
                      <linearGradient id="gradient-director" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1f2937" stopOpacity="0.75"/>
                        <stop offset="30%" stopColor="#4b5563" stopOpacity="0.75"/>
                        <stop offset="70%" stopColor="#6b7280" stopOpacity="0.75"/>
                        <stop offset="100%" stopColor="#374151" stopOpacity="0.75"/>
                      </linearGradient>
                      <linearGradient id="gradient-teacher" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.75"/>
                        <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.75"/>
                        <stop offset="70%" stopColor="#2563eb" stopOpacity="0.75"/>
                        <stop offset="100%" stopColor="#1e40af" stopOpacity="0.75"/>
                      </linearGradient>
                      <linearGradient id="gradient-student" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#064e3b" stopOpacity="0.75"/>
                        <stop offset="30%" stopColor="#10b981" stopOpacity="0.75"/>
                        <stop offset="70%" stopColor="#059669" stopOpacity="0.75"/>
                        <stop offset="100%" stopColor="#047857" stopOpacity="0.75"/>
                      </linearGradient>
                      <linearGradient id="gradient-coordinator" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.75"/>
                        <stop offset="30%" stopColor="#ef4444" stopOpacity="0.75"/>
                        <stop offset="70%" stopColor="#dc2626" stopOpacity="0.75"/>
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.75"/>
                      </linearGradient>
                      
                      {/* Hover Effects */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      {/* Shadow Effects */}
                      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.3)"/>
                      </filter>
                      
                    </defs>
                    
                    {/* Pentagon Segments */}
                    {roles.map((role, index) => {
                      const angle = (index * 72) - 90; // 72 degrees per side (360/5)
                      const nextAngle = ((index + 1) * 72) - 90;
                      const radius = 240;
                      const innerRadius = 100;
                      
                      // Calculate outer points
                      const x1 = 300 + Math.cos(angle * Math.PI / 180) * radius;
                      const y1 = 300 + Math.sin(angle * Math.PI / 180) * radius;
                      const x2 = 300 + Math.cos(nextAngle * Math.PI / 180) * radius;
                      const y2 = 300 + Math.sin(nextAngle * Math.PI / 180) * radius;
                      
                      // Calculate inner points
                      const x3 = 300 + Math.cos(nextAngle * Math.PI / 180) * innerRadius;
                      const y3 = 300 + Math.sin(nextAngle * Math.PI / 180) * innerRadius;
                      const x4 = 300 + Math.cos(angle * Math.PI / 180) * innerRadius;
                      const y4 = 300 + Math.sin(angle * Math.PI / 180) * innerRadius;
                      
                      // Content (icon + name) position inside the segment (toward outer edge)
                      const contentAngle = angle + 36; // center of the segment
                      const contentRadius = (innerRadius + radius) / 2; // mid radius inside card
                      const contentX = 300 + Math.cos(contentAngle * Math.PI / 180) * contentRadius;
                      const contentY = 300 + Math.sin(contentAngle * Math.PI / 180) * contentRadius;

                      // Hover movement outward along the radial direction
                      const isHovered = hoveredIndex === index;
                      const moveOffset = isHovered ? 16 : 0;
                      const dxGroup = Math.cos(contentAngle * Math.PI / 180) * moveOffset;
                      const dyGroup = Math.sin(contentAngle * Math.PI / 180) * moveOffset;
                      
                      return (
                        <g
                    key={role.id}
                          className="cursor-pointer transition-all duration-700 ease-out hover:brightness-125 hover:drop-shadow-xl"
                    onClick={() => handleDemoLogin(role.id)}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          transform={`translate(${dxGroup}, ${dyGroup})`}
                          style={{ transition: 'transform 400ms ease-out' }}
                        >
                          {/* Pentagon Segment */}
                          <polygon
                            points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                            fill={`url(#gradient-${role.id})`}
                            stroke="#ffffff"
                            strokeWidth={3}
                            filter="url(#shadow)"
                            fillOpacity={0.75}
                          />
                          
                          {/* Hover Overlay */}
                          <polygon
                            points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                            fill="rgba(255,255,255,0.2)"
                            className="opacity-0 hover:opacity-100 transition-all duration-700 ease-out"
                          />
                          
                          {/* Glow Effect */}
                          <polygon
                            points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                            fill="none"
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth="4"
                            className="opacity-0 hover:opacity-100 transition-all duration-700 ease-out"
                          />
                          
                          {/* Inner Glow */}
                          <polygon
                            points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="2"
                            className="opacity-0 hover:opacity-100 transition-all duration-700 ease-out"
                          />
                          
                          
                          
                          {/* Icon and Role Name - inside the segment, aligned along radial */}
                          <g transform={`translate(${contentX} ${contentY}) rotate(${contentAngle - 90})`}>
                            <text
                              x={0}
                              y={-6}
                              textAnchor="middle"
                              className="text-4xl fill-gray-800 drop-shadow-lg"
                            >
                              {role.icon}
                            </text>
                            <text
                              x={0}
                              y={18}
                              textAnchor="middle"
                              className="text-base font-bold fill-gray-900 drop-shadow-lg"
                            >
                              {role.title}
                            </text>
                          </g>
                          
                        </g>
                      );
                    })}
                    
                    
                    
                    {/* Connecting Lines */}
                    {roles.map((role, index) => {
                      const angle = (index * 72) - 90;
                      const x1 = 300 + Math.cos(angle * Math.PI / 180) * 100;
                      const y1 = 300 + Math.sin(angle * Math.PI / 180) * 100;
                      const x2 = 300 + Math.cos(angle * Math.PI / 180) * 240;
                      const y2 = 300 + Math.sin(angle * Math.PI / 180) * 240;
                      
                      return (
                        <line
                          key={role.id}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="2"
                          strokeDasharray="0"
                          className="hidden xl:block transition-all duration-500 ease-out"
                        />
                      );
                    })}
                  </svg>
                  </div>
              </div>
              {/* Mantemos o gráfico sem legenda para não alterar o pentágono */}
            </div>

            {/* Login Form compactado (Matrículas removidas) */}
            <div className="w-full max-w-xl lg:w-1/2">
              <Card className="w-full p-5 sm:p-8 bg-white/85 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-white/60 border border-slate-200 animate-in fade-in slide-in-from-right-8">
                <div className="flex flex-col gap-8">
                  {/* Seção de Login */}
                  <div className="w-full">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">
                        Login do Sistema
                      </h2>
                      <p className="text-slate-600 text-sm">
                        Acesse sua conta ou use os perfis de demonstração
                      </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Digite seu email"
                          autoComplete="email"
                          required
                          className="h-11 text-base bg-slate-50 border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Senha</label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite sua senha"
                          autoComplete="current-password"
                          required
                          className="h-11 text-base bg-slate-50 border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                          disabled={isLoading}
                        />
                      </div>

                      {/* Dica integrada: senha padrão e instrução de perfis */}
                      <div className="flex flex-col gap-2 text-xs text-slate-600 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                        <span className="inline-flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">Senha padrão: 123</span>
                        </span>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="font-medium text-indigo-700 hover:underline">Esqueci minha senha</button>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Entrando...
                          </div>
                        ) : (
                          "Entrar no Sistema"
                        )}
                      </Button>
                    </form>
                    
                    <div className="mt-4 text-center space-y-3">
                      <p className="text-xs text-gray-500">
                        Sistema desenvolvido com tecnologias modernas
                      </p>
                    </div>
                  </div>

                  
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  );
}
