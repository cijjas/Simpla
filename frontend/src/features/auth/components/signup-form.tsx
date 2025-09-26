'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

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
import { cn } from '@/lib/utils';
import { signIn } from 'next-auth/react';

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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      // Call backend registration endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
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
        // Registration successful, now login
        const loginRes = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (loginRes?.ok) {
          router.push('/inicio');
        } else {
          setFormError('Registro exitoso, pero falló el login automático. Por favor, inicia sesión manualmente.');
        }
      } else {
        setFormError(data.detail || 'Error al registrarse');
      }
    } catch (error) {
      setFormError('Error de conexión. Intenta nuevamente.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setFormError(null);
    setLoading(true);
    // Use NextAuth with backend integration
    await signIn('google', { callbackUrl: '/inicio' });
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
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
                  <Input placeholder='m@example.com' {...field} />
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

          {formError && <p className='text-sm text-destructive'>{formError}</p>}

          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? 'Registrando…' : 'Registrarse'}
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
          disabled={loading}
        >
          <SiGoogle className='h-4 w-4' />
          Registrarse con Google
        </Button>
      </div>

      <div className='text-center text-sm'>
        ¿Ya tenés una cuenta?{' '}
        <Link href='/iniciar-sesion' className='underline underline-offset-4'>
          Iniciá sesión
        </Link>
      </div>
    </div>
  );
}