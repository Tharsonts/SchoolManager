import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Code, 
  Link, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Eye,
  MessageSquare,
  GitBranch,
  Play
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  status: 'uploading' | 'completed' | 'error';
  preview?: string;
}

interface Submission {
  id: string;
  activityId: string;
  studentId: string;
  type: 'file' | 'text' | 'url' | 'code' | 'video';
  content: any;
  files: SubmissionFile[];
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  version: number;
  isLate: boolean;
  collaborators?: string[];
}

interface AdvancedSubmissionSystemProps {
  activityId: string;
  activityType: string;
  allowedFormats: string[];
  maxFileSize: number;
  maxFiles: number;
  allowLateSubmission: boolean;
  dueDate?: string;
  enableVersioning: boolean;
  enableCollaboration: boolean;
  onSubmissionUpdate?: (submission: Submission) => void;
}

export function AdvancedSubmissionSystem({
  activityId,
  activityType,
  allowedFormats,
  maxFileSize,
  maxFiles,
  allowLateSubmission,
  dueDate,
  enableVersioning,
  enableCollaboration,
  onSubmissionUpdate
}: AdvancedSubmissionSystemProps) {
  const { request } = useApi();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [submissionType, setSubmissionType] = useState<'file' | 'text' | 'url' | 'code' | 'video'>('file');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [isDraft, setIsDraft] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [newCollaborator, setNewCollaborator] = useState('');

  useEffect(() => {
    loadSubmission();
  }, [activityId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const response = await request(`/api/activities/${activityId}/submissions/my`);
      if (response) {
        setSubmission(response);
        setSubmissionType(response.type);
        setFiles(response.files || []);
        setCollaborators(response.collaborators || []);
        
        if (response.content) {
          switch (response.type) {
            case 'text':
              setTextContent(response.content.text || '');
              break;
            case 'url':
              setUrlContent(response.content.url || '');
              break;
            case 'code':
              setCodeContent(response.content.code || '');
              setCodeLanguage(response.content.language || 'javascript');
              break;
          }
        }
        
        setIsDraft(response.status === 'draft');
      }
    } catch (error) {
      console.error('Erro ao carregar submissão:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    acceptedFiles.forEach(file => {
      if (file.size > maxFileSize) {
        toast.error(`Arquivo ${file.name} excede o tamanho máximo de ${maxFileSize / 1024 / 1024}MB`);
        return;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (allowedFormats.length > 0 && !allowedFormats.includes(fileExtension || '')) {
        toast.error(`Formato ${fileExtension} não permitido`);
        return;
      }

      const submissionFile: SubmissionFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        uploadProgress: 0
      };

      setFiles(prev => [...prev, submissionFile]);
      uploadFile(file, submissionFile.id);
    });
  }, [files, maxFiles, maxFileSize, allowedFormats]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFormats.length > 0 ? 
      Object.fromEntries(allowedFormats.map(format => [`.${format}`, []])) : 
      undefined
  });

  const uploadFile = async (file: File, fileId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activityId', activityId);
    formData.append('fileId', fileId);

    try {
      const response = await fetch('/api/submissions/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'completed',
          url: result.url,
          uploadProgress: 100
        } : f
      ));

      toast.success(`Arquivo ${file.name} enviado com sucesso!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error' } : f
      ));
      toast.error(`Erro ao enviar ${file.name}`);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addCollaborator = () => {
    if (newCollaborator && !collaborators.includes(newCollaborator)) {
      setCollaborators(prev => [...prev, newCollaborator]);
      setNewCollaborator('');
    }
  };

  const removeCollaborator = (email: string) => {
    setCollaborators(prev => prev.filter(c => c !== email));
  };

  const saveSubmission = async (submit = false) => {
    setLoading(true);
    try {
      let content: any = {};
      
      switch (submissionType) {
        case 'text':
          content = { text: textContent };
          break;
        case 'url':
          content = { url: urlContent };
          break;
        case 'code':
          content = { code: codeContent, language: codeLanguage };
          break;
        case 'file':
          content = { files: files.filter(f => f.status === 'completed') };
          break;
      }

      const payload = {
        activityId,
        type: submissionType,
        content,
        files: files.filter(f => f.status === 'completed'),
        status: submit ? 'submitted' : 'draft',
        collaborators: enableCollaboration ? collaborators : []
      };

      const method = submission ? 'PUT' : 'POST';
      const url = submission ? 
        `/api/submissions/${submission.id}` : 
        '/api/submissions';

      const response = await request(url, {
        method,
        body: JSON.stringify(payload)
      });

      setSubmission(response);
      setIsDraft(!submit);
      onSubmissionUpdate?.(response);
      
      toast.success(submit ? 'Submissão enviada com sucesso!' : 'Rascunho salvo!');
    } catch (error) {
      console.error('Erro ao salvar submissão:', error);
      toast.error('Erro ao salvar submissão');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.includes('text') || type.includes('document')) return <FileText className="w-4 h-4" />;
    if (type.includes('code') || type.includes('javascript') || type.includes('python')) return <Code className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isLate = dueDate && new Date() > new Date(dueDate);
  const canSubmit = !isLate || allowLateSubmission;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sistema de Submissão Avançado</CardTitle>
            <div className="flex items-center gap-2">
              {submission && (
                <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                  {submission.status === 'submitted' ? 'Enviado' : 'Rascunho'}
                </Badge>
              )}
              {isLate && (
                <Badge variant="destructive">
                  <Clock className="w-3 h-3 mr-1" />
                  Atrasado
                </Badge>
              )}
            </div>
          </div>
          {dueDate && (
            <p className="text-sm text-gray-600">
              Prazo: {new Date(dueDate).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Tipo de Submissão</Label>
            <Select value={submissionType} onValueChange={(value: any) => setSubmissionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file">Arquivo</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="url">URL/Link</SelectItem>
                <SelectItem value="code">Código</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={submissionType} className="w-full">
            <TabsContent value="file" className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-500">
                  Máximo {maxFiles} arquivos, {formatFileSize(maxFileSize)} cada
                </p>
                {allowedFormats.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Formatos permitidos: {allowedFormats.join(', ')}
                  </p>
                )}
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Arquivos Enviados</Label>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getFileIcon(file.type)}
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        {file.status === 'uploading' && file.uploadProgress !== undefined && (
                          <Progress value={file.uploadProgress} className="mt-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        {file.url && (
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="textContent">Conteúdo de Texto</Label>
                <Textarea
                  id="textContent"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Digite seu texto aqui..."
                  rows={10}
                  className="font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="urlContent">URL/Link</Label>
                <Input
                  id="urlContent"
                  value={urlContent}
                  onChange={(e) => setUrlContent(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
              {urlContent && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="w-4 h-4" />
                    <span className="font-medium">Preview do Link</span>
                  </div>
                  <a 
                    href={urlContent} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {urlContent}
                  </a>
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div>
                <Label htmlFor="codeLanguage">Linguagem</Label>
                <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="codeContent">Código</Label>
                <Textarea
                  id="codeContent"
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="// Digite seu código aqui..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              {codeContent && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Executar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {enableCollaboration && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Colaboradores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newCollaborator}
                    onChange={(e) => setNewCollaborator(e.target.value)}
                    placeholder="Email do colaborador"
                    type="email"
                  />
                  <Button onClick={addCollaborator}>
                    Adicionar
                  </Button>
                </div>
                {collaborators.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {collaborators.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeCollaborator(email)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              {enableVersioning && submission && (
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm">Versão {submission.version}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDraft"
                  checked={isDraft}
                  onCheckedChange={setIsDraft}
                />
                <Label htmlFor="isDraft">Salvar como rascunho</Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => saveSubmission(false)}
                disabled={loading}
              >
                Salvar Rascunho
              </Button>
              
              {canSubmit && (
                <Button 
                  onClick={() => saveSubmission(true)}
                  disabled={loading || (!isDraft && submission?.status === 'submitted')}
                >
                  {loading ? 'Enviando...' : 'Enviar Submissão'}
                </Button>
              )}
              
              {!canSubmit && (
                <Button disabled>
                  Prazo Expirado
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {submission && submission.status === 'graded' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Avaliação Recebida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Nota:</span>
              <Badge variant="default" className="text-lg">
                {submission.grade}/100
              </Badge>
            </div>
            {submission.feedback && (
              <div>
                <Label>Feedback do Professor</Label>
                <div className="p-4 bg-gray-50 rounded-lg mt-2">
                  <p className="whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}