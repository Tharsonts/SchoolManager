import React from 'react';
import DynamicCalendar from '@/components/calendar/DynamicCalendar';

const StudentCalendarPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendário Escolar</h1>
          <p className="text-gray-600 mt-1">
          Visualize suas provas e atividades automaticamente
          </p>
        </div>
        
      {/* Calendário Dinâmico */}
      <DynamicCalendar />
    </div>
  );
};

export default StudentCalendarPage;