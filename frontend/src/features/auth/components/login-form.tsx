'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useEffect, useState } from 'react';
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

const formSchema = z.object({
  email: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria' }),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  const router = useRouter();
  const search = useSearchParams();
  const urlError = search.get('error');

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (urlError === 'CredentialsSignin')
      setFormError('Correo o contraseña incorrectos');
    if (urlError === 'OAuthAccountNotLinked')
      setFormError(
        'Ya existe una cuenta con este correo (pero con otro método).',
      );
    if (urlError === 'EmailNotVerified')
      setFormError('Tenés que verificar tu correo antes de iniciar sesión.');
  }, [urlError]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null);
    setLoading(true);

    // Use NextAuth with backend integration
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      router.push('/inicio');
    } else {
      setFormError('Correo o contraseña incorrectos');
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
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold'>Iniciá sesión en tu cuenta</h1>
        <p className='text-sm text-muted-foreground'>
          Ingresá tu email para acceder
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
                <div className='flex items-center justify-between'>
                  <FormLabel>Contraseña</FormLabel>
                  <Link
                    href='/recuperar-contrasena'
                    className='text-sm underline-offset-4 hover:underline'
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormControl>
                  <Input type='password'  {...field}  placeholder='••••••••'/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className='text-sm text-destructive'>{formError}</p>}

          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
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
          Iniciar sesión con Google
        </Button>
      </div>

      <div className='text-center text-sm'>
        ¿No tenés una cuenta?{' '}
        <Link href='/registrarse' className='underline underline-offset-4'>
          Registrate
        </Link>
      </div>
    </div>
  );
}