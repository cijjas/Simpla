'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useApi } from '@/features/auth/hooks/use-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { toast } from 'sonner';

interface EditNameDialogProps {
  currentName: string;
  onNameUpdated: (newName: string) => void;
  children: React.ReactNode;
}

export function EditNameDialog({ currentName, onNameUpdated, children }: EditNameDialogProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { put } = useApi();
  const { updateUser } = useAuth();

  // Parse current name into first and last name
  React.useEffect(() => {
    if (currentName && open) {
      const nameParts = currentName.trim().split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [currentName, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    
    // Additional validation
    if (fullName.length < 1) {
      toast.error('El nombre debe tener al menos 1 carácter');
      return;
    }
    
    if (fullName.length > 255) {
      toast.error('El nombre no puede exceder 255 caracteres');
      return;
    }
    
    if (fullName === currentName) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending profile update request:', { name: fullName });
      const response = await put('/api/auth/profile', { name: fullName });
      console.log('Profile update response:', response);
      
      // The response should contain the updated user data
      if (response && response.name) {
        // Update the user data in the auth context
        updateUser({ name: response.name });
        onNameUpdated(response.name);
        toast.success('Nombre actualizado correctamente');
        setOpen(false);
      } else {
        // Fallback: update with the name we sent
        updateUser({ name: fullName });
        onNameUpdated(fullName);
        toast.success('Nombre actualizado correctamente');
        setOpen(false);
      }
    } catch (error) {
      console.error('Error updating name:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      toast.error('Error al actualizar el nombre. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Nombre</DialogTitle>
          <DialogDescription>
            Actualiza tu nombre y apellido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Tu nombre"
              required
              minLength={1}
              maxLength={255}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Tu apellido"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
