'use client';

import { useActionState, useEffect } from 'react';
import { signup } from '@/features/auth/utils/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(signup, {
    errors: {},
  });

  // If redirect triggered from server action
  useEffect(() => {
    if ('redirect' in state && state.redirect) {
      router.push(state.redirect);
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className={cn('grid gap-6', className)}
      {...props}
    >
      <div className='text-center'>
        <h1 className='text-2xl font-bold'>Crear una cuenta</h1>
        <p className='text-sm text-muted-foreground'>
          Completá tus datos para registrarte
        </p>
      </div>

      <div className='grid gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='name'>Nombre</Label>
          <Input id='name' name='name' placeholder='Juan Pérez' />
          {state.errors?.name && (
            <p className='text-sm text-destructive'>{state.errors.name}</p>
          )}
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='email'>Correo electrónico</Label>
          <Input
            id='email'
            name='email'
            type='email'
            placeholder='m@example.com'
          />
          {state.errors?.email && (
            <p className='text-sm text-destructive'>{state.errors.email}</p>
          )}
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='password'>Contraseña</Label>
          <Input
            id='password'
            name='password'
            type='password'
            placeholder='••••••••'
          />
          {state.errors?.password && (
            <p className='text-sm text-destructive'>{state.errors.password}</p>
          )}
        </div>

        <Button type='submit' className='w-full' disabled={pending}>
          {pending ? 'Registrando…' : 'Registrarse'}
        </Button>
      </div>
    </form>
  );
}
