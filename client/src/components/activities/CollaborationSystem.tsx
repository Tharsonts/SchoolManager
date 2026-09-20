import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  Video, 
  Mic, 
  Share, 
  FileText,
  Eye,
  GitBranch,
  History
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
}

interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike';
}

interface PeerReview {
  id: string;
  reviewerId: string;
  reviewer: User;
  submissionId: string;
  criteria: {
    [key: string]: {
      score: number;
      feedback: string;
    };
  };
  overallScore: number;
  overallFeedback: string;
  status: 'pending' | 'completed' | 'draft';
  createdAt: string;
  isAnonymous: boolean;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: User[];
  leader: User;
  createdAt: string;
  status: 'active' | 'inactive';
}

interface CollaborationSystemProps {
  activityId: string;
  submissionId?: string;
  enablePeerReview: boolean;
  enableTeamWork: boolean;
  enableRealTimeChat: boolean;
  peerReviewCriteria?: string[];
  maxTeamSize?: number;
}

export function CollaborationSystem({
  activityId,
  submissionId,
  enablePeerReview,
  enableTeamWork,
  enableRealTimeChat,
  peerReviewCriteria = [],
  maxTeamSize = 5
}: CollaborationSystemProps) {
  const { request } = useApi();
  const [activeTab, setActiveTab] = useState('chat');
  const [comments, setComments] = useState<Comment[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showPeerReviewDialog, setShowPeerReviewDialog] = useState(false);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Estado para criação de equipe
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    members: [] as string[]
  });
  
  // Estado para peer review
  const [reviewData, setReviewData] = useState<{
    criteria: { [key: string]: { score: number; feedback: string } };
    overallFeedback: string;
    isAnonymous: boolean;
  }>({
    criteria: {},
    overallFeedback: '',
    isAnonymous: false
  });

  useEffect(() => {
    loadCollaborationData();
    if (enableRealTimeChat) {
      setupWebSocket();
    }
  }, [activityId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const loadCollaborationData = async () => {
    setLoading(true);
    try {
      const [commentsRes, teamsRes, reviewsRes] = await Promise.all([
        enableRealTimeChat ? request(`/api/activities/${activityId}/comments`) : Promise.resolve([]),
        enableTeamWork ? request(`/api/activities/${activityId}/teams`) : Promise.resolve([]),
        enablePeerReview ? request(`/api/activities/${activityId}/peer-reviews`) : Promise.resolve([])
      ]);
      
      setComments(commentsRes);
      setTeams(teamsRes);
      setPeerReviews(reviewsRes);
      
      // Encontrar equipe atual do usuário
      const userTeam = teamsRes.find((team: Team) => 
        team.members.some(member => member.id === 'current-user-id') // Substituir pelo ID real do usuário
      );
      setCurrentTeam(userTeam || null);
    } catch (error) {
      console.error('Erro ao carregar dados de colaboração:', error);
      toast.error('Erro ao carregar dados de colaboração');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    // Implementar WebSocket para chat em tempo real
    // const ws = new WebSocket(`ws://localhost:5000/ws/activities/${activityId}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'new_comment') {
    //     setComments(prev => [...prev, data.comment]);
    //   }
    // };
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const payload = {
        content: newComment,
        parentId: replyingTo
      };
      
      const response = await request(`/api/activities/${activityId}/comments`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setComments(prev => [...prev, response]);
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comentário enviado!');
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      toast.error('Erro ao enviar comentário');
    }
  };

  const handleReactToComment = async (commentId: string, reaction: 'like' | 'dislike') => {
    try {
      await request(`/api/comments/${commentId}/react`, {
        method: 'POST',
        body: JSON.stringify({ reaction })
      });
      
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const newComment = { ...comment };
          if (comment.userReaction === reaction) {
            // Remover reação
            newComment[reaction === 'like' ? 'likes' : 'dislikes']--;
            newComment.userReaction = undefined;
          } else {
            // Adicionar/trocar reação
            if (comment.userReaction) {
              newComment[comment.userReaction === 'like' ? 'likes' : 'dislikes']--;
            }
            newComment[reaction === 'like' ? 'likes' : 'dislikes']++;
            newComment.userReaction = reaction;
          }
          return newComment;
        }
        return comment;
      }));
    } catch (error) {
      console.error('Erro ao reagir ao comentário:', error);
      toast.error('Erro ao reagir ao comentário');
    }
  };

  const handleCreateTeam = async () => {
    if (!teamData.name.trim()) {
      toast.error('Nome da equipe é obrigatório');
      return;
    }
    
    try {
      const response = await request(`/api/activities/${activityId}/teams`, {
        method: 'POST',
        body: JSON.stringify(teamData)
      });
      
      setTeams(prev => [...prev, response]);
      setCurrentTeam(response);
      setShowCreateTeam(false);
      setTeamData({ name: '', description: '', members: [] });
      toast.success('Equipe criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      toast.error('Erro ao criar equipe');
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      await request(`/api/teams/${teamId}/join`, {
        method: 'POST'
      });
      
      loadCollaborationData();
      toast.success('Você entrou na equipe!');
    } catch (error) {
      console.error('Erro ao entrar na equipe:', error);
      toast.error('Erro ao entrar na equipe');
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam) return;
    
    try {
      await request(`/api/teams/${currentTeam.id}/leave`, {
        method: 'POST'
      });
      
      setCurrentTeam(null);
      loadCollaborationData();
      toast.success('Você saiu da equipe');
    } catch (error) {
      console.error('Erro ao sair da equipe:', error);
      toast.error('Erro ao sair da equipe');
    }
  };

  const handleSubmitPeerReview = async () => {
    if (!selectedSubmissionForReview) return;
    
    // Validar se todos os critérios foram avaliados
    const missingCriteria = peerReviewCriteria.filter(criterion => 
      !reviewData.criteria[criterion] || reviewData.criteria[criterion].score === 0
    );
    
    if (missingCriteria.length > 0) {
      toast.error(`Avalie todos os critérios: ${missingCriteria.join(', ')}`);
      return;
    }
    
    try {
      const overallScore = Object.values(reviewData.criteria)
        .reduce((sum, criterion) => sum + criterion.score, 0) / peerReviewCriteria.length;
      
      const payload = {
        submissionId: selectedSubmissionForReview,
        criteria: reviewData.criteria,
        overallScore,
        overallFeedback: reviewData.overallFeedback,
        isAnonymous: reviewData.isAnonymous
      };
      
      await request(`/api/activities/${activityId}/peer-reviews`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setShowPeerReviewDialog(false);
      setSelectedSubmissionForReview(null);
      setReviewData({ criteria: {}, overallFeedback: '', isAnonymous: false });
      loadCollaborationData();
      toast.success('Avaliação por pares enviada!');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sistema de Colaboração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              {enableRealTimeChat && (
                <TabsTrigger value="chat">Chat</TabsTrigger>
              )}
              {enableTeamWork && (
                <TabsTrigger value="teams">Equipes</TabsTrigger>
              )}
              {enablePeerReview && (
                <TabsTrigger value="reviews">Avaliação por Pares</TabsTrigger>
              )}
            </TabsList>
            
            {enableRealTimeChat && (
              <TabsContent value="chat" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Chat da Atividade</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {onlineUsers.slice(0, 3).map((user) => (
                        <Avatar key={user.id} className="w-6 h-6 border-2 border-white">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Badge variant="secondary">
                      {onlineUsers.length} online
                    </Badge>
                  </div>
                </div>
                
                <Card className="h-96">
                  <ScrollArea className="h-80 p-4">
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(comment.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.user.name}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                              </span>
                              {comment.user.role === 'teacher' && (
                                <Badge variant="secondary" className="text-xs">Professor</Badge>
                              )}
                            </div>
                            <p className="text-sm mb-2">{comment.content}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReactToComment(comment.id, 'like')}
                                className={`h-6 px-2 ${comment.userReaction === 'like' ? 'text-blue-600' : ''}`}
                              >
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                {comment.likes}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReactToComment(comment.id, 'dislike')}
                                className={`h-6 px-2 ${comment.userReaction === 'dislike' ? 'text-red-600' : ''}`}
                              >
                                <ThumbsDown className="w-3 h-3 mr-1" />
                                {comment.dislikes}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReplyingTo(comment.id)}
                                className="h-6 px-2"
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Responder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="p-4 border-t">
                    {replyingTo && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        Respondendo a um comentário
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                      />
                      <Button onClick={handleSendComment} disabled={!newComment.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}
            
            {enableTeamWork && (
              <TabsContent value="teams" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Trabalho em Equipe</h3>
                  {!currentTeam && (
                    <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Criar Equipe
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Nova Equipe</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="teamName">Nome da Equipe</Label>
                            <Input
                              id="teamName"
                              value={teamData.name}
                              onChange={(e) => setTeamData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Nome da equipe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="teamDescription">Descrição</Label>
                            <Textarea
                              id="teamDescription"
                              value={teamData.description}
                              onChange={(e) => setTeamData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Descrição da equipe"
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCreateTeam}>
                              Criar Equipe
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                
                {currentTeam ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{currentTeam.name}</CardTitle>
                          {currentTeam.description && (
                            <p className="text-sm text-gray-600 mt-1">{currentTeam.description}</p>
                          )}
                        </div>
                        <Button variant="destructive" onClick={handleLeaveTeam}>
                          Sair da Equipe
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Membros da Equipe</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            {currentTeam.members.map((member) => (
                              <div key={member.id} className="flex items-center gap-2 p-2 border rounded">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                                {member.id === currentTeam.leader.id && (
                                  <Badge variant="secondary" className="text-xs">Líder</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                      <Card key={team.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{team.name}</CardTitle>
                              {team.description && (
                                <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                              )}
                            </div>
                            <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                              {team.status === 'active' ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span>{team.members.length}/{maxTeamSize} membros</span>
                              <span>Líder: {team.leader.name}</span>
                            </div>
                            <div className="flex -space-x-2">
                              {team.members.slice(0, 5).map((member) => (
                                <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {team.members.length > 5 && (
                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                                  +{team.members.length - 5}
                                </div>
                              )}
                            </div>
                            {team.members.length < maxTeamSize && (
                              <Button 
                                size="sm" 
                                onClick={() => handleJoinTeam(team.id)}
                                className="w-full"
                              >
                                Entrar na Equipe
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
            
            {enablePeerReview && (
              <TabsContent value="reviews" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Avaliação por Pares</h3>
                  <Dialog open={showPeerReviewDialog} onOpenChange={setShowPeerReviewDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Star className="w-4 h-4 mr-2" />
                        Nova Avaliação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Avaliar Submissão</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div>
                          <Label>Critérios de Avaliação</Label>
                          <div className="space-y-4 mt-2">
                            {peerReviewCriteria.map((criterion) => (
                              <div key={criterion} className="space-y-2">
                                <Label className="text-sm font-medium">{criterion}</Label>
                                <div className="flex items-center gap-4">
                                  <Select
                                    value={reviewData.criteria[criterion]?.score?.toString() || ''}
                                    onValueChange={(value) => {
                                      setReviewData(prev => ({
                                        ...prev,
                                        criteria: {
                                          ...prev.criteria,
                                          [criterion]: {
                                            ...prev.criteria[criterion],
                                            score: parseInt(value)
                                          }
                                        }
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Nota" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1 - Insuficiente</SelectItem>
                                      <SelectItem value="2">2 - Satisfatório</SelectItem>
                                      <SelectItem value="3">3 - Bom</SelectItem>
                                      <SelectItem value="4">4 - Excelente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Feedback específico"
                                    value={reviewData.criteria[criterion]?.feedback || ''}
                                    onChange={(e) => {
                                      setReviewData(prev => ({
                                        ...prev,
                                        criteria: {
                                          ...prev.criteria,
                                          [criterion]: {
                                            ...prev.criteria[criterion],
                                            feedback: e.target.value
                                          }
                                        }
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="overallFeedback">Feedback Geral</Label>
                          <Textarea
                            id="overallFeedback"
                            value={reviewData.overallFeedback}
                            onChange={(e) => setReviewData(prev => ({ ...prev, overallFeedback: e.target.value }))}
                            placeholder="Comentários gerais sobre a submissão"
                            rows={4}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isAnonymous"
                            checked={reviewData.isAnonymous}
                            onChange={(e) => setReviewData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                          />
                          <Label htmlFor="isAnonymous">Avaliação anônima</Label>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowPeerReviewDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSubmitPeerReview}>
                            Enviar Avaliação
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {peerReviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {!review.isAnonymous && (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={review.reviewer.avatar} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(review.reviewer.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span className="font-medium text-sm">
                              {review.isAnonymous ? 'Avaliação Anônima' : review.reviewer.name}
                            </span>
                          </div>
                          <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                            {review.status === 'completed' ? 'Concluída' : 'Pendente'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Nota Geral:</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-bold">{review.overallScore.toFixed(1)}/4.0</span>
                            </div>
                          </div>
                          
                          {review.overallFeedback && (
                            <div>
                              <Label className="text-sm">Feedback:</Label>
                              <p className="text-sm text-gray-600 mt-1">{review.overallFeedback}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {peerReviews.length === 0 && (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center text-gray-500">
                        <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">Nenhuma avaliação encontrada</p>
                        <p className="text-sm">Seja o primeiro a avaliar uma submissão</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}