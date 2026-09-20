import React from 'react';
import { TeacherCalendar } from '@/components/calendar/TeacherCalendar';

export default function TeacherCalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendário do Professor</h1>
        <p className="text-gray-600 mt-1">
          Gerencie eventos para suas turmas e visualize as datas importantes automaticamente
        </p>
      </div>
        
      {/* Calendário do Professor */}
      <TeacherCalendar />
    </div>
  );
}