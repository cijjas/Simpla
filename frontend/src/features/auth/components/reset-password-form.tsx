'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token');
  const email = search.get('email');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, password }),
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => router.push('/iniciar-sesion'), 3000); // Redirect after 3s
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setStatus('error');
    }
  }

  if (!token || !email) return <p>Enlace inválido.</p>;

  return (
    <AnimatePresence mode='wait'>
      {status === 'success' ? (
        <motion.div
          key='success'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className='flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center mt-8'
        >
          <CheckCircle2 className='h-10 w-10 text-green-600' />
          <h2 className='text-lg font-semibold'>Contraseña actualizada</h2>
          <p className='text-muted-foreground text-sm'>
            Redirigiéndote al inicio de sesión…
          </p>
        </motion.div>
      ) : (
        <motion.form
          key='form'
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className='grid gap-4 max-w-md mx-auto'
        >
          <h1 className='text-2xl font-bold text-center'>Nueva contraseña</h1>

          <div className='grid gap-2'>
            <Label htmlFor='password'>Contraseña nueva</Label>
            <Input
              id='password'
              type='password'
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Mínimo 6 caracteres'
            />
          </div>

          <Button type='submit' disabled={status === 'submitting'}>
            {status === 'submitting' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cambiando contraseña…
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </Button>

          {status === 'error' && (
            <motion.p
              key='error'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-sm text-destructive text-center'
            >
              El enlace es inválido o expiró.
            </motion.p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}