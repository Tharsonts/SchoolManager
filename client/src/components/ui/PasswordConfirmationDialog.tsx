import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface PasswordConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  // Novo callback opcional quando for necessário texto de confirmação adicional
  onConfirmWithText?: (password: string, confirmText: string) => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  // Quando true, exibe um campo adicional para digitar "confirmar"
  requireConfirmText?: boolean;
  // Rótulos customizáveis
  confirmLabel?: string;
}

const PasswordConfirmationDialog: React.FC<PasswordConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onConfirmWithText,
  title,
  description,
  itemName,
  isLoading = false,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  requireConfirmText = false,
  confirmLabel = 'Digite "confirmar" para prosseguir:'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmTextValue, setConfirmTextValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    // Validação simples: senha padrão 123 (alinhado ao backend atual)
    if (password !== '123') {
      setError('Senha incorreta');
      return;
    }

    if (requireConfirmText) {
      if (confirmTextValue.trim().toLowerCase() !== 'confirmar') {
        setError('Digite exatamente "confirmar" para prosseguir');
        return;
      }
    }

    setError('');

    if (requireConfirmText && onConfirmWithText) {
      onConfirmWithText(password, confirmTextValue.trim());
    } else {
      onConfirm(password);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    setConfirmTextValue('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
            {itemName && (
              <span className="block mt-2 font-semibold text-gray-900">
                Item: {itemName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha de Confirmação</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Digite a senha: 123"
                className={error ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {requireConfirmText && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="confirmText">{confirmLabel}</Label>
                <Input
                  id="confirmText"
                  type="text"
                  value={confirmTextValue}
                  onChange={(e) => {
                    setConfirmTextValue(e.target.value);
                    setError('');
                  }}
                  placeholder="Digite 'confirmar'"
                  disabled={isLoading}
                />
              </div>
            )}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {!requireConfirmText && (
              <p className="text-xs text-gray-500">
                Digite "123" para confirmar a exclusão
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !password.trim() || (requireConfirmText && !confirmTextValue.trim())}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { PasswordConfirmationDialog };
export default PasswordConfirmationDialog;

