'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    const res = await fetch('/api/auth/reset-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    setStatus(res.ok ? 'sent' : 'error');
  }

  return (
    <AnimatePresence mode='wait'>
      {status === 'sent' ? (
        <motion.div
          key='success'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className='flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center mt-8'
        >
          <CheckCircle2 className='h-10 w-10 text-green-600' />
          <h2 className='text-lg font-semibold'>
            Correo enviado correctamente
          </h2>
          <p className='text-muted-foreground text-sm'>
            Te enviamos un enlace para restablecer tu contraseña. Revisá tu
            correo.
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
          <h1 className='text-2xl font-bold text-center'>
            Restablecer contraseña
          </h1>

          <div className='grid gap-2'>
            <Label htmlFor='email'>Correo electrónico</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='ejemplo@mail.com'
              required
            />
          </div>

          <Button type='submit' disabled={status === 'sending'}>
            {status === 'sending'
              ? 'Enviando…'
              : 'Enviar enlace de recuperación'}
          </Button>

          {status === 'error' && (
            <motion.p
              key='error'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-sm text-destructive text-center'
            >
              No se pudo enviar el correo. Intentá nuevamente.
            </motion.p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
