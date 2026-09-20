import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  grade: number | null;
  isPresent: boolean;
}

interface Exam {
  id: string;
  title: string;
  totalPoints: number;
}

interface SimpleGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string | null;
}

export default function SimpleGradesModal({ isOpen, onClose, examId }: SimpleGradesModalProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Buscar dados da prova e alunos
  useEffect(() => {
    if (isOpen && examId) {
      fetchExamGrades();
    }
  }, [isOpen, examId]);

  const fetchExamGrades = async () => {
    if (!examId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${examId}/grades-simple`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados da prova');
      }

      const data = await response.json();
      console.log('📊 Dados carregados:', data);
      
      setExam(data.exam);
      setStudents(data.students);
      
      toast.success('Dados carregados com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da prova');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, field: string, value: any) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, [field]: value }
        : student
    ));
  };

  const handleSaveGrades = async () => {
    if (!examId) return;

    setSaving(true);
    try {
      const gradesToSave = students.map(student => ({
        studentId: student.id,
        grade: student.grade,
        isPresent: student.isPresent
      }));

      console.log('💾 Salvando notas:', gradesToSave);

      const response = await fetch(`/api/exams/${examId}/grades-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ grades: gradesToSave })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar notas');
      }

      const result = await response.json();
      console.log('✅ Notas salvas:', result);
      
      toast.success(`${result.saved} notas salvas com sucesso!`);
      
      // Recarregar dados
      await fetchExamGrades();
      
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      toast.error('Erro ao salvar notas');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(s => s.isPresent).length;
  const gradedCount = students.filter(s => s.grade !== null && s.grade !== '').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            {exam ? `Notas: ${exam.title}` : 'Carregando...'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Carregando dados da prova...</p>
            </div>
          </div>
        ) : exam && (
          <div className="space-y-6">
            {/* Informações da Prova */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Prova</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Título</p>
                    <p className="font-medium">{exam.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pontuação Total</p>
                    <p className="font-medium">{exam.totalPoints} pontos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Total: {students.length}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Presentes: {presentCount}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Avaliados: {gradedCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Alunos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas dos Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student, index) => (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-600">ID: {student.id}</p>
                          </div>
                        </div>
                        <Badge variant={student.isPresent ? "default" : "destructive"}>
                          {student.isPresent ? 'Presente' : 'Falta'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Presença */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">Presença</label>
                          <Select 
                            value={student.isPresent ? 'present' : 'absent'} 
                            onValueChange={(value) => handleGradeChange(student.id, 'isPresent', value === 'present')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Presente</SelectItem>
                              <SelectItem value="absent">Falta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Nota */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">Nota (0-{exam.totalPoints})</label>
                          <Input
                            type="number"
                            min={0}
                            max={exam.totalPoints}
                            step={0.5}
                            value={student.grade ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(',', '.');
                              let val = parseFloat(raw);
                              if (isNaN(val)) val = 0;
                              val = Math.round(val * 2) / 2; 
                              if (val < 0) val = 0;
                              if (val > exam.totalPoints) val = exam.totalPoints;
                              handleGradeChange(student.id, 'grade', val);
                            }}
                            placeholder="0.0"
                          />
                        </div>

                        {/* Percentual */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">Percentual</label>
                          <Input
                            value={student.grade ? `${((student.grade / exam.totalPoints) * 100).toFixed(1)}%` : '-'}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveGrades} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Todas as Notas'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
