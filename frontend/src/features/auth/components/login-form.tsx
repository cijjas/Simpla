'use client';

import { useSearchParams, useRouter } from 'next/navigation';
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
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../hooks/use-auth';
import { useGoogleAuth } from '../hooks/use-google-auth';
import { motion, AnimatePresence } from 'framer-motion';

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
  const preFilledEmail = search.get('email');
  const isVerified = search.get('verified') === 'true';

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(isVerified);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading: authLoading } = useAuth();
  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: preFilledEmail || '',
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

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null);
    setLoading(true);

    const result = await login(values.email, values.password);
    setLoading(false);

    if (result.success) {
      router.push('/inicio');
    } else {
      setFormError(result.error || 'Correo o contraseña incorrectos');
    }
  }

  async function handleGoogle() {
    setFormError(null);
    setLoading(true);
    
    const result = await googleSignIn();
    setLoading(false);

    if (result.success) {
      router.push('/inicio');
    } else {
      setFormError(result.error || 'Error al iniciar sesión con Google');
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className='text-center mb-8'>
        <h1 className='text-2xl font-bold'>Iniciá sesión en tu cuenta</h1>
        <p className='text-sm text-muted-foreground'>
          Ingresá tu email para acceder
        </p>
      </div>

      {/* Success message for verified email */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className='rounded-lg border border-green-200 p-4 mb-4'
          >
            <div className='flex items-center gap-3'>
              <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-green-800'>
                  ¡Cuenta verificada exitosamente!
                </p>
                <p className='text-xs text-green-600 mt-1'>
                  Ya podés iniciar sesión con tus credenciales.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className='text-green-600 hover:text-green-800 transition-colors'
              >
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className='relative'>
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      {...field} 
                      placeholder='••••••••'
                      className='pr-10'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className='text-sm text-destructive'>{formError}</p>}

          <Button type='submit' className='w-full' disabled={loading || authLoading}>
            {loading || authLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando…
              </>
            ) : (
              'Iniciar sesión'
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
          disabled={loading || googleLoading}
        >
          {loading || googleLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingresando…
            </>
          ) : (
            <>
              <SiGoogle className='h-4 w-4' />
              Iniciar sesión con Google
            </>
          )}
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