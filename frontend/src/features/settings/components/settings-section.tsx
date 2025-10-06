'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ThemeSelector } from '@/components/ui/theme-selector';

export function SettingsSection() {
  const { user, logout, accessToken } = useAuth();
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

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <ThemeSelector />

      {/* Account Settings */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Información de Cuenta</CardTitle>
          <CardDescription>
            Gestiona tu información personal y configuración de cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-sm">{user?.name || 'No especificado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Proveedor</label>
              <p className="text-sm capitalize">{user?.provider || 'email'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado de Verificación</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user?.email_verified ? 'default' : 'secondary'} className="text-xs">
                  {user?.email_verified ? 'Verificado' : 'Pendiente'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Configuración de seguridad y acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Cambiar Contraseña</h4>
                <p className="text-sm text-muted-foreground">Actualiza tu contraseña de acceso</p>
              </div>
              <Button variant="outline" size="sm">
                Cambiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Datos y Privacidad</CardTitle>
          <CardDescription>
            Gestiona tus datos y configuraciones de privacidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Exportar Datos</h4>
                <p className="text-sm text-muted-foreground">Descarga todos tus datos</p>
              </div>
              <Button variant="outline" size="sm">
                Exportar
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">Eliminar Cuenta</h4>
                <p className="text-sm text-muted-foreground">Elimina permanentemente tu cuenta</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Eliminar Cuenta</DialogTitle>
            </div>
            <DialogDescription className="pt-3">
              Esta acción es <span className="font-semibold text-destructive">permanente e irreversible</span>. 
              Se eliminarán todos tus datos, conversaciones, y configuraciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="pb-3">
                <label className="text-sm font-medium ">
                  Para confirmar, escribe: <span className="font-mono text-destructive">{CONFIRMATION_PHRASE}</span>
                </label>
              </div>
              
              <Input
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
              {isDeleting ? 'Eliminando...' : 'Eliminar Cuenta Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
