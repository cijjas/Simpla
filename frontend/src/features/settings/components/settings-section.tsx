'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { EditNameDialog } from './edit-name-dialog';
import { useSubscriptionContext } from '@/features/subscription/context/subscription-context';

export function SettingsSection() {
  const { user, logout, accessToken } = useAuth();
  const { status: subscriptionStatus } = useSubscriptionContext();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const CONFIRMATION_PHRASE = 'si quiero borrar mi cuenta';

  const handleDeleteAccount = async () => {
    if (confirmationText !== CONFIRMATION_PHRASE) {
      setError('La frase de confirmación no coincide');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar la cuenta');
      }

      // Account deleted successfully, logout and redirect
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta');
      setIsDeleting(false);
    }
  };

  const handleNameUpdated = (_newName: string) => {
    // The user data will be updated automatically by the auth context
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perfil</CardTitle>
          <CardDescription>
            Información básica de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal text-muted-foreground">Nombre completo</Label>
                <p className="text-sm font-medium">{user?.name || 'No especificado'}</p>
              </div>
              <EditNameDialog 
                currentName={user?.name || ''} 
                onNameUpdated={handleNameUpdated}
              >
                <Button variant="ghost" size="sm">
                  Editar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </EditNameDialog>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <Badge variant={user?.email_verified ? 'default' : 'secondary'} className="text-xs">
                {user?.email_verified ? 'Verificado' : 'Pendiente'}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal text-muted-foreground">Plan</Label>
                <p className="text-sm font-medium">{subscriptionStatus?.tier.display_name || 'Free'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal text-muted-foreground">Proveedor de autenticación</Label>
                <p className="text-sm font-medium capitalize">{user?.provider || 'email'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seguridad</CardTitle>
          <CardDescription>
            Configuración de seguridad y acceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Cambiar contraseña</Label>
              <p className="text-xs text-muted-foreground">Actualiza tu contraseña de acceso</p>
            </div>
            <Button variant="ghost" size="sm">
              Cambiar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos y Privacidad</CardTitle>
          <CardDescription>
            Gestiona tus datos y configuraciones de privacidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">Exportar datos</Label>
              <p className="text-xs text-muted-foreground">Descarga todos tus datos personales</p>
            </div>
            <Button variant="ghost" size="sm">
              Exportar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal text-destructive">Eliminar cuenta</Label>
              <p className="text-xs text-muted-foreground">Elimina permanentemente tu cuenta y datos</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Eliminar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Eliminar Cuenta</DialogTitle>
            </div>
            <DialogDescription className="pt-3">
              Esta acción es <span className="font-semibold text-destructive">permanente e irreversible</span>. 
              Se eliminarán todos tus datos, conversaciones y configuraciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm">
                Para confirmar, escribe: <span className="font-mono text-destructive">{CONFIRMATION_PHRASE}</span>
              </Label>
              
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  setError('');
                }}
                placeholder="Escribe la frase de confirmación"
                disabled={isDeleting}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setConfirmationText('');
                setError('');
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmationText !== CONFIRMATION_PHRASE}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
