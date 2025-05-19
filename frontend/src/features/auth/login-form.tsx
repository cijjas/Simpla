'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiGoogle } from 'react-icons/si';
import { cn } from '@/lib/utils';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) {
  const router = useRouter();
  const search = useSearchParams();
  const urlError = search.get('error'); // read error deposited by NextAuth

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ------------ Display server‐side errors (e.g., EmailNotVerified) ------------- */
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

  /* ---------------------- Credentials login handler ---------------------------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const email = (e.currentTarget.email as HTMLInputElement).value;
    const password = (e.currentTarget.password as HTMLInputElement).value;

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false, // we handle navigation manually
    });

    setLoading(false);

    if (res?.ok) {
      router.push('/dashboard');
    } else {
      // signIn gives res.error = 'CredentialsSignin'
      setFormError('Correo o contraseña incorrectos');
    }
  }

  /* ------------------------- Google login helper ------------------------------ */
  async function handleGoogle() {
    setFormError(null);
    setLoading(true);

    const res = await signIn('google', {
      callbackUrl: '/dashboard', // where to land after Google
      redirect: false, // get result back instead of auto-redirect
    });

    setLoading(false);

    if (res?.ok) {
      router.push('/dashboard'); // cookie already set
    } else {
      // if user closed Google popup, res will be undefined
      setFormError('No se pudo iniciar sesión con Google.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      {/* ——— Top copy ——— */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-bold'>Iniciá sesión en tu cuenta</h1>
        <p className='text-sm text-muted-foreground'>
          Ingresá tu email para acceder
        </p>
      </div>

      {/* ——— Form fields ——— */}
      <div className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Correo electrónico</Label>
          <Input id='email' type='email' placeholder='m@example.com' required />
        </div>

        <div className='grid gap-2'>
          <div className='flex items-center'>
            <Label htmlFor='password'>Contraseña</Label>
            <Link
              href='/forgot-password'
              className='ml-auto text-sm underline-offset-4 hover:underline'
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input id='password' type='password' required />
        </div>

        {formError && <p className='text-sm text-destructive'>{formError}</p>}

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>

        {/* Divider */}
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
        <Link href='/signup' className='underline underline-offset-4'>
          Registrate
        </Link>
      </div>
    </form>
  );
}
