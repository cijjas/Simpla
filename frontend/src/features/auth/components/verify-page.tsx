'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyPage() {
  const params = useSearchParams();
  const success = params.get('success') === 'true';
  const error = params.get('error');
  const email = params.get('email') ?? '';
  const token = params.get('token');
  const resent = params.get('resent') === 'true';
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-verify if token and email are present
  useEffect(() => {
    if (token && email && !success && !error) {
      setIsVerifying(true);
      // Redirect to API route which will handle the verification
      if (typeof window !== 'undefined') {
        window.location.href = `/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      }
    }
  }, [token, email, success, error]);

  if (isVerifying) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className='flex flex-col items-center justify-center min-h-screen max-w-md mx-auto p-8 space-y-6 text-center'
      >
        <div className='rounded-full bg-blue-50 p-3 mb-2'>
          <Loader2 className='h-12 w-12 text-blue-500 animate-spin' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Verificando...
        </h1>
        <p className='text-muted-foreground text-lg'>
          Estamos verificando tu cuenta, por favor espera un momento.
        </p>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className='flex flex-col items-center justify-center min-h-screen max-w-md mx-auto p-8 space-y-6 text-center'
      >
        <div className='rounded-full p-3 mb-2'>
          <CheckCircle className='h-12 w-12 text-green-500' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>
          ¡Cuenta verificada!
        </h1>
        <p className='text-muted-foreground text-lg'>
          Ya podés iniciar sesión con tus credenciales.
        </p>
        <Button 
          size='lg' 
          className='mt-4 px-8' 
          asChild
          onClick={() => {
            // Redirect to login with pre-filled email and success message
            const loginUrl = `/iniciar-sesion?email=${encodeURIComponent(email)}&verified=true`;
            if (typeof window !== 'undefined') {
              window.location.href = loginUrl;
            }
          }}
        >
          <Link href={`/iniciar-sesion?email=${encodeURIComponent(email)}&verified=true`}>
            Iniciar sesión <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className='flex flex-col items-center justify-center min-h-screen max-w-md mx-auto p-8 space-y-6 text-center'
    >
      {error === 'expired' ? (
        <>
          <div className='rounded-full bg-amber-50 p-3 mb-2'>
            <AlertCircle className='h-12 w-12 text-amber-500' />
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>Enlace expirado</h1>
          <p className='text-muted-foreground text-lg'>
            El enlace de verificación ha expirado. Te podemos enviar uno nuevo.
          </p>
        </>
      ) : (
        <>
          <div className='rounded-full  p-3 mb-2'>
            <Mail className='h-12 w-12 text-blue-500' />
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Revisá tu correo
          </h1>
          <p className='text-muted-foreground text-lg'>
            Te enviamos un mail a{' '}
            <span className='font-medium text-foreground'>{email}</span> para
            verificar tu cuenta.
          </p>
          <p className='text-sm text-muted-foreground italic'>
            Esto puede tardar unos segundos
          </p>
        </>
      )}

      {/* Success message for resent email */}
      {resent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className='rounded-lg  border border-green-200 p-4 mb-4'
        >
          <div className='flex items-center gap-3'>
            <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
            <div>
              <p className='text-sm font-medium text-green-800'>
                ¡Email reenviado exitosamente!
              </p>
              <p className='text-xs text-green-600 mt-1'>
                Revisá tu bandeja de entrada nuevamente.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className='pt-4'>
        <Button
          variant={error === 'expired' ? 'default' : 'outline'}
          size='lg'
          className='mt-2 px-8'
          asChild
        >
          <Link href={`/api/auth/resend?email=${encodeURIComponent(email)}`}>
            {error === 'expired' ? 'Enviar nuevo enlace' : 'No llegó, reenviar'}
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
