import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin,
  BookOpen,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import useStudentSchedule from '@/hooks/useStudentSchedule';

const StudentSchedulePage = () => {
  const { 
    scheduleData, 
    isLoading, 
    error, 
    getCurrentDay, 
    getCurrentTime 
  } = useStudentSchedule();

  const { weeklySchedule, todaySchedule, currentClass, nextClass, stats } = scheduleData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-20 mt-1" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 Horários</h1>
          <p className="text-gray-600 mt-1">Seu cronograma semanal de aulas</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">{getCurrentDay()}</p>
          <p className="text-sm text-gray-600">{getCurrentTime()}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.totalClasses}</p>
                <p className="text-sm text-blue-700">Aulas por semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.totalHours}h</p>
                <p className="text-sm text-green-700">Horas semanais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{stats.subjectsCount}</p>
                <p className="text-sm text-purple-700">Disciplinas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{stats.averageClassesPerDay}</p>
                <p className="text-sm text-orange-700">Média por dia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current/Next Class Alert */}
      {currentClass && (
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Aula Atual</h3>
                <p className="text-green-700">
                  {currentClass.subject} com {currentClass.teacher} às {currentClass.time}
                </p>
                <p className="text-sm text-green-600">{currentClass.room}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentClass && nextClass && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Próxima Aula</h3>
                <p className="text-blue-700">
                  {nextClass.subject} com {nextClass.teacher} às {nextClass.time}
                </p>
                <p className="text-sm text-blue-600">{nextClass.room}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentClass && !nextClass && (
        <Card className="border border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Status Atual</h3>
                <p className="text-gray-700">Não há aulas no momento. Aproveite seu tempo livre!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {schedule.map((daySchedule, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {daySchedule.day}
                {daySchedule.day === getCurrentDay() && (
                  <Badge className="bg-blue-100 text-blue-800">Hoje</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {daySchedule.classes.map((classItem, classIndex) => (
                  <div key={classIndex} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <p className="text-sm font-medium text-gray-900">{classItem.time}</p>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{classItem.subject}</h4>
                        <p className="text-sm text-gray-600">{classItem.teacher}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{classItem.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Ver Calendário</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200 transition-all duration-200">
              <BookOpen className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Ver Disciplinas</span>
            </Button>
            <Button className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 transition-all duration-200">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Ver Professores</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSchedulePage;









