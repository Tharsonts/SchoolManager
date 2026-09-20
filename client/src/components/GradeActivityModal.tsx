import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Star,
  AlertCircle,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useGradeActivity } from "@/hooks/useApi";

interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  submittedAt?: string;
  comment?: string;
  grade?: number;
  feedback?: string;
  attachments?: Array<{
    type: 'file' | 'image' | 'url' | 'text';
    name: string;
    url?: string;
    content?: string;
  }>;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  maxGrade: number;
  dueDate: string;
  instructions?: string;
  requirements?: string;
}

interface GradeActivityModalProps {
  submission: StudentSubmission | null;
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GradeActivityModal({ 
  submission, 
  activity, 
  isOpen, 
  onClose, 
  onSuccess 
}: GradeActivityModalProps) {
  const [grade, setGrade] = useState<string>(submission?.grade?.toString() || "");
  const [feedback, setFeedback] = useState<string>(submission?.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const gradeActivityMutation = useGradeActivity();

  if (!submission || !activity) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLate = () => {
    if (!submission.submittedAt) return false;
    return new Date(submission.submittedAt) > new Date(activity.dueDate);
  };

  const getDaysLate = () => {
    if (!submission.submittedAt) return 0;
    const submitted = new Date(submission.submittedAt);
    const due = new Date(activity.dueDate);
    const diffTime = submitted.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getGradeStars = (gradeValue: number, maxGrade: number) => {
    const percentage = gradeValue / maxGrade;
    const stars = Math.round(percentage * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > activity.maxGrade) {
      toast({
        title: "Erro na nota",
        description: `A nota deve estar entre 0 e ${activity.maxGrade}`,
        variant: "destructive"
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: "Feedback obrigatório",
        description: "Por favor, forneça um feedback para o aluno",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await gradeActivityMutation.mutateAsync({
        submissionId: submission.id,
        grade: gradeValue,
        feedback: feedback.trim()
      });
      
      toast({
        title: "Avaliação salva!",
        description: `Nota ${gradeValue}/${activity.maxGrade} atribuída para ${submission.studentName}`,
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setGrade(submission?.grade?.toString() || "");
      setFeedback(submission?.feedback || "");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <CheckCircle className="h-5 w-5" />
            Avaliar Atividade: {activity.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Aluno */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Aluno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-medium">{submission.studentName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium">{submission.studentEmail}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Data de Entrega:</span>
                  <p className={`font-medium ${
                    isLate() ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {submission.submittedAt ? formatDate(submission.submittedAt) : 'Não enviado'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      isLate() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isLate() ? `Atrasado (${getDaysLate()} dias)` : 'No prazo'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {isLate() && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    Esta atividade foi entregue com {getDaysLate()} {getDaysLate() === 1 ? 'dia' : 'dias'} de atraso
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trabalho do Aluno */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Trabalho Entregue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Conteúdo:</h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.comment || 'Nenhum comentário fornecido'}
                  </p>
                </div>
              </div>
              
              {submission.attachments && submission.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Anexos:</h4>
                  <div className="space-y-2">
                    {submission.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Avaliação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Nota *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max={activity.maxGrade}
                      step="0.1"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder={`0 - ${activity.maxGrade}`}
                      className="w-24"
                      required
                    />
                    <span className="text-sm text-gray-600">/ {activity.maxGrade}</span>
                    {grade && !isNaN(parseFloat(grade)) && (
                      <div className="flex items-center gap-1">
                        {getGradeStars(parseFloat(grade), activity.maxGrade)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Porcentagem</Label>
                  <div className="text-lg font-semibold text-amber-600">
                    {grade && !isNaN(parseFloat(grade)) 
                      ? `${((parseFloat(grade) / activity.maxGrade) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback para o Aluno *</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Forneça um feedback detalhado sobre o trabalho do aluno..."
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Avaliação
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}