'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SiGoogle } from 'react-icons/si';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleAuth } from '../hooks/use-google-auth';

const formSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  email: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [userEmail, setUserEmail] = useState<string>('');

  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null);
    setStatus('submitting');

    try {
      // Call backend registration endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, show success state
        setUserEmail(values.email);
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => router.push('/iniciar-sesion'), 3000);
      } else {
        setFormError(data.detail || 'Error al registrarse');
        setStatus('error');
      }
    } catch (error) {
      setFormError('Error de conexión. Intenta nuevamente.');
      setStatus('error');
      console.error('Registration error:', error);
    }
  }

  async function handleGoogle() {
    setFormError(null);
    setStatus('submitting');
    
    const result = await googleSignIn();
    
    if (result.success) {
      router.push('/inicio');
    } else {
      setFormError(result.error || 'Error al registrarse con Google');
      setStatus('error');
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <AnimatePresence mode='wait'>
        {status === 'success' ? (
          <motion.div
            key='success'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className='flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center'
          >
            <CheckCircle2 className='h-12 w-12 text-green-600' />
            <h2 className='text-2xl font-bold'>¡Registro exitoso!</h2>
            <p className='text-muted-foreground'>
              Se ha enviado un email de verificación a{' '}
              <span className='font-medium text-foreground'>{userEmail}</span>.
            </p>
            <p className='text-sm text-muted-foreground'>
              Por favor, verifica tu email antes de iniciar sesión.
            </p>
            <p className='text-xs text-muted-foreground italic'>
              Redirigiéndote al inicio de sesión…
            </p>
          </motion.div>
        ) : (
          <motion.div
            key='form'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className='space-y-6'
          >
            <div className='text-center'>
              <h1 className='text-2xl font-bold'>Crear una cuenta</h1>
              <p className='text-sm text-muted-foreground'>
                Completá tus datos para registrarte
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
                {...props}
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder='Juan Pérez' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder='email@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type='password' placeholder='••••••••' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formError && (
                  <motion.p
                    key='error'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-sm text-destructive'
                  >
                    {formError}
                  </motion.p>
                )}

                <Button type='submit' className='w-full' disabled={status === 'submitting'}>
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando…
                    </>
                  ) : (
                    'Registrarse'
                  )}
                </Button>
              </form>
            </Form>

            <div className='mt-6 flex flex-col gap-4'>
              <div className='relative text-center text-sm'>
                <span className='relative z-10 bg-background px-2 text-muted-foreground'>
                  O continuá con
                </span>
                <div className='absolute inset-0 top-1/2 border-t border-border' />
              </div>

              <Button
                variant='outline'
                className='w-full gap-2'
                type='button'
                onClick={handleGoogle}
                disabled={status === 'submitting' || googleLoading}
              >
                {status === 'submitting' || googleLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando…
                  </>
                ) : (
                  <>
                    <SiGoogle className='h-4 w-4' />
                    Registrarse con Google
                  </>
                )}
              </Button>
            </div>

            <div className='text-center text-sm'>
              ¿Ya tenés una cuenta?{' '}
              <Link href='/iniciar-sesion' className='underline underline-offset-4'>
                Iniciá sesión
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}