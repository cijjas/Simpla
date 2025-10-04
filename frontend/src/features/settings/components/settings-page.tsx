'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  CreditCard, 
  User, 
  Bell, 
  Shield, 
  Palette,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SubscriptionManager } from '@/features/subscription/components/subscription-manager';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('subscription');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const settingsSections = [
    {
      id: 'subscription',
      title: 'Suscripción',
      description: 'Gestiona tu plan y límites de uso',
      icon: CreditCard,
    },
    {
      id: 'profile',
      title: 'Perfil',
      description: 'Información personal y preferencias',
      icon: User,
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      description: 'Configura las notificaciones',
      icon: Bell,
    },
    {
      id: 'privacy',
      title: 'Privacidad',
      description: 'Configuración de privacidad y seguridad',
      icon: Shield,
    },
    {
      id: 'appearance',
      title: 'Apariencia',
      description: 'Tema y personalización',
      icon: Palette,
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">
              Gestiona tu cuenta y preferencias de Simpla
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {user?.name || user?.email || 'Usuario'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <Separator />

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Gestión de Suscripción</h2>
            </div>
            <SubscriptionManager />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Perfil de Usuario</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Tu información de perfil y preferencias de cuenta
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
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={user?.email_verified ? 'default' : 'secondary'}>
                        {user?.email_verified ? 'Verificado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-sm text-muted-foreground">
                  <p>• Los cambios de perfil se sincronizan automáticamente</p>
                  <p>• Tu información está protegida y encriptada</p>
                  <p>• Puedes cambiar tu contraseña en cualquier momento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Notificaciones</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>
                  Controla qué notificaciones recibes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configuración de notificaciones próximamente</p>
                  <p className="text-sm">Podrás personalizar las notificaciones por email y en la aplicación</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Privacidad y Seguridad</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Privacidad</CardTitle>
                <CardDescription>
                  Gestiona tu privacidad y seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configuración de privacidad próximamente</p>
                  <p className="text-sm">Podrás gestionar permisos, exportar datos y configurar la seguridad</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Apariencia</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Personalización</CardTitle>
                <CardDescription>
                  Personaliza la apariencia de la aplicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configuración de apariencia próximamente</p>
                  <p className="text-sm">Podrás personalizar temas, colores y la interfaz</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

