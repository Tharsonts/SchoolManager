import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, User, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ScheduleItem {
  id: string;
  subjectName: string;
  teacherName: string;
  classroom: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  color?: string;
}

interface DaySchedule {
  dayName: string;
  dayNumber: number;
  items: ScheduleItem[];
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('week');

  const daysOfWeek = [
    { name: 'Domingo', number: 0 },
    { name: 'Segunda-feira', number: 1 },
    { name: 'Terça-feira', number: 2 },
    { name: 'Quarta-feira', number: 3 },
    { name: 'Quinta-feira', number: 4 },
    { name: 'Sexta-feira', number: 5 },
    { name: 'Sábado', number: 6 }
  ];

  const subjectColors = {
    'Matemática': 'bg-blue-100 text-blue-800 border-blue-200',
    'Português': 'bg-green-100 text-green-800 border-green-200',
    'História': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Geografia': 'bg-purple-100 text-purple-800 border-purple-200',
    'Ciências': 'bg-red-100 text-red-800 border-red-200',
    'Inglês': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Educação Física': 'bg-orange-100 text-orange-800 border-orange-200',
    'Arte': 'bg-pink-100 text-pink-800 border-pink-200'
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/students/${user?.id}/schedule`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erro ao carregar horários');
        }
        
        const data = await response.json();
        setSchedule(data.data || []);
      } catch (err) {
        console.error('Erro ao buscar horários:', err);
        setError('Erro ao carregar seus horários');
        // Dados de exemplo para demonstração
        setSchedule([
          {
            id: '1',
            subjectName: 'Matemática',
            teacherName: 'Prof. João Silva',
            classroom: 'Sala 101',
            startTime: '07:30',
            endTime: '08:20',
            dayOfWeek: 1
          },
          {
            id: '2',
            subjectName: 'Português',
            teacherName: 'Prof. Ana Santos',
            classroom: 'Sala 102',
            startTime: '08:20',
            endTime: '09:10',
            dayOfWeek: 1
          },
          {
            id: '3',
            subjectName: 'História',
            teacherName: 'Prof. Carlos Lima',
            classroom: 'Sala 103',
            startTime: '09:30',
            endTime: '10:20',
            dayOfWeek: 1
          },
          {
            id: '4',
            subjectName: 'Geografia',
            teacherName: 'Prof. Maria Costa',
            classroom: 'Sala 104',
            startTime: '10:20',
            endTime: '11:10',
            dayOfWeek: 1
          },
          {
            id: '5',
            subjectName: 'Ciências',
            teacherName: 'Prof. Pedro Oliveira',
            classroom: 'Lab. Ciências',
            startTime: '11:10',
            endTime: '12:00',
            dayOfWeek: 1
          },
          // Terça-feira
          {
            id: '6',
            subjectName: 'Inglês',
            teacherName: 'Prof. Sarah Johnson',
            classroom: 'Sala 105',
            startTime: '07:30',
            endTime: '08:20',
            dayOfWeek: 2
          },
          {
            id: '7',
            subjectName: 'Matemática',
            teacherName: 'Prof. João Silva',
            classroom: 'Sala 101',
            startTime: '08:20',
            endTime: '09:10',
            dayOfWeek: 2
          },
          {
            id: '8',
            subjectName: 'Educação Física',
            teacherName: 'Prof. Roberto Santos',
            classroom: 'Quadra',
            startTime: '09:30',
            endTime: '10:20',
            dayOfWeek: 2
          },
          {
            id: '9',
            subjectName: 'Arte',
            teacherName: 'Prof. Lucia Fernandes',
            classroom: 'Sala de Arte',
            startTime: '10:20',
            endTime: '11:10',
            dayOfWeek: 2
          },
          {
            id: '10',
            subjectName: 'Português',
            teacherName: 'Prof. Ana Santos',
            classroom: 'Sala 102',
            startTime: '11:10',
            endTime: '12:00',
            dayOfWeek: 2
          },
          // Quarta-feira
          {
            id: '11',
            subjectName: 'História',
            teacherName: 'Prof. Carlos Lima',
            classroom: 'Sala 103',
            startTime: '07:30',
            endTime: '08:20',
            dayOfWeek: 3
          },
          {
            id: '12',
            subjectName: 'Geografia',
            teacherName: 'Prof. Maria Costa',
            classroom: 'Sala 104',
            startTime: '08:20',
            endTime: '09:10',
            dayOfWeek: 3
          },
          {
            id: '13',
            subjectName: 'Matemática',
            teacherName: 'Prof. João Silva',
            classroom: 'Sala 101',
            startTime: '09:30',
            endTime: '10:20',
            dayOfWeek: 3
          },
          {
            id: '14',
            subjectName: 'Ciências',
            teacherName: 'Prof. Pedro Oliveira',
            classroom: 'Lab. Ciências',
            startTime: '10:20',
            endTime: '11:10',
            dayOfWeek: 3
          },
          {
            id: '15',
            subjectName: 'Inglês',
            teacherName: 'Prof. Sarah Johnson',
            classroom: 'Sala 105',
            startTime: '11:10',
            endTime: '12:00',
            dayOfWeek: 3
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchSchedule();
    }
  }, [user?.id]);

  const getScheduleByDay = (): DaySchedule[] => {
    return daysOfWeek.map(day => ({
      dayName: day.name,
      dayNumber: day.number,
      items: schedule
        .filter(item => item.dayOfWeek === day.number)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
  };

  const getTodaySchedule = (): ScheduleItem[] => {
    const today = new Date().getDay();
    return schedule
      .filter(item => item.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getCurrentClass = (): ScheduleItem | null => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.getDay();
    
    const todayClasses = schedule.filter(item => item.dayOfWeek === today);
    
    return todayClasses.find(item => 
      currentTime >= item.startTime && currentTime <= item.endTime
    ) || null;
  };

  const getNextClass = (): ScheduleItem | null => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.getDay();
    
    const todayClasses = schedule
      .filter(item => item.dayOfWeek === today && item.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return todayClasses[0] || null;
  };

  const getSubjectColor = (subjectName: string): string => {
    return subjectColors[subjectName as keyof typeof subjectColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <MainLayout pageTitle="Meus Horários">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus horários...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();
  const todaySchedule = getTodaySchedule();
  const weekSchedule = getScheduleByDay();

  return (
    <MainLayout pageTitle="Meus Horários">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Horários</h1>
        <p className="text-gray-600">Acompanhe sua grade de horários e aulas</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{error}</p>
          <p className="text-sm text-yellow-600 mt-1">Exibindo dados de exemplo</p>
        </div>
      )}

      {/* Status atual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {currentClass && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Aula Atual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-green-900">{currentClass.subjectName}</h3>
                <div className="flex items-center space-x-2 text-green-700">
                  <User className="h-4 w-4" />
                  <span>{currentClass.teacherName}</span>
                </div>
                <div className="flex items-center space-x-2 text-green-700">
                  <MapPin className="h-4 w-4" />
                  <span>{currentClass.classroom}</span>
                </div>
                <div className="flex items-center space-x-2 text-green-700">
                  <Clock className="h-4 w-4" />
                  <span>{currentClass.startTime} - {currentClass.endTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {nextClass && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Próxima Aula</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-blue-900">{nextClass.subjectName}</h3>
                <div className="flex items-center space-x-2 text-blue-700">
                  <User className="h-4 w-4" />
                  <span>{nextClass.teacherName}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <MapPin className="h-4 w-4" />
                  <span>{nextClass.classroom}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span>{nextClass.startTime} - {nextClass.endTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!currentClass && !nextClass && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Status Atual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Não há aulas no momento. Aproveite seu tempo livre!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana Completa</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Horários de Hoje</span>
              </CardTitle>
              <CardDescription>
                {daysOfWeek.find(day => day.number === new Date().getDay())?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.map((item) => (
                    <div key={item.id} className={`p-4 rounded-lg border-2 ${getSubjectColor(item.subjectName)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-5 w-5" />
                          <div>
                            <h3 className="font-semibold">{item.subjectName}</h3>
                            <p className="text-sm opacity-75">{item.teacherName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.startTime} - {item.endTime}</p>
                          <p className="text-sm opacity-75">{item.classroom}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Não há aulas hoje</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {weekSchedule.map((day) => (
              <Card key={day.dayNumber} className={day.dayNumber === new Date().getDay() ? 'ring-2 ring-amber-500' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>{day.dayName}</span>
                    {day.dayNumber === new Date().getDay() && (
                      <Badge variant="secondary" className="ml-2">Hoje</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {day.items.length > 0 ? (
                    <div className="space-y-2">
                      {day.items.map((item) => (
                        <div key={item.id} className={`p-3 rounded-md border ${getSubjectColor(item.subjectName)}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{item.subjectName}</h4>
                              <p className="text-xs opacity-75">{item.classroom}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{item.startTime}</p>
                              <p className="text-xs opacity-75">{item.endTime}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Sem aulas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}