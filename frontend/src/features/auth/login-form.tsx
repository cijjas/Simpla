'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiGoogle } from 'react-icons/si';
import { cn } from '@/lib/utils';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // ✨ keeps Set‑Cookie before we navigate
    });

    setLoading(false);

    if (result?.ok) {
      router.push('/');
    } else {
      setError('Correo o contraseña incorrectos');
      console.error('signIn error:', result);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-bold'>Iniciá sesión en tu cuenta</h1>
        <p className='text-sm text-muted-foreground'>
          Ingresá tu email para acceder a tu cuenta
        </p>
      </div>

      <div className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Correo electrónico</Label>
          <Input id='email' type='email' placeholder='m@example.com' required />
        </div>

        <div className='grid gap-2'>
          <div className='flex items-center'>
            <Label htmlFor='password'>Contraseña</Label>
            <Link
              href='#'
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input id='password' type='password' required />
        </div>

        {error && <p className='text-sm text-destructive'>{error}</p>}

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>

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
          aria-label='Iniciar sesión con Google'
          onClick={() => signIn('google')}
        >
          <SiGoogle className='h-4 w-4' />
          Iniciar sesión con Google
        </Button>
      </div>

      <div className='text-center text-sm'>
        ¿No tenés una cuenta?{' '}
        <Link href='/signup' className='underline underline-offset-4'>
          Registrate
        </Link>
      </div>
    </form>
  );
}
