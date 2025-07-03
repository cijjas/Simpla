'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerifyPage() {
  const params = useSearchParams();
  const success = params.get('success') === 'true';
  const error = params.get('error');
  const email = params.get('email') ?? '';

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto p-8 space-y-6 text-center'
      >
        <div className='rounded-full bg-green-50 p-3 mb-2'>
          <CheckCircle className='h-12 w-12 text-green-500' />
        </div>
        <h1 className='text-3xl font-bold tracking-tight'>
          ¡Cuenta verificada!
        </h1>
        <p className='text-muted-foreground text-lg'>
          Ya podés iniciar sesión con tus credenciales.
        </p>
        <Button size='lg' className='mt-4 px-8' asChild>
          <Link href='/iniciar-sesion'>
            Iniciar sesión <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto p-8 space-y-6 text-center'
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
          <div className='rounded-full bg-blue-50 p-3 mb-2'>
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
            ―Esto puede tardar unos segundos―
          </p>
        </>
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
