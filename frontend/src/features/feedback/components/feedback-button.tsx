// FeedbackContact.tsx (updated)
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, MailCheck } from 'lucide-react';
import { CONTACT_EMAIL, WHATSAPP_LINK } from '../utils/contact.config';

const schema = z.object({
  message: z
    .string()
    .min(10, 'Debe tener al menos 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
});
type FeedbackValues = z.infer<typeof schema>;

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FeedbackValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  const onSubmit = async (values: FeedbackValues) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: values.message.trim(),
          origin: 'webapp',
        }),
      });

      if (res.ok) {
        toast.success('Mensaje enviado, ¡gracias por ayudarnos a mejorar!');
        setSent(true);
        reset();
      } else {
        toast.error('Hubo un problema enviando tu mensaje');
      }
    } catch {
      toast.error('Error de red, por favor inténtalo de nuevo');
    }
  };

  return (
    <>
      <Button
        variant='default'
        size='sm'
        onClick={() => setOpen(true)}
        className='text-sm '
      >
        Feedback
      </Button>

      <Dialog
        open={open}
        onOpenChange={v => {
          setOpen(v);
          if (!v) setSent(false);
        }}
      >
        <DialogContent className='bg-card sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>¡Tu opinión nos importa!</DialogTitle>
          </DialogHeader>

          <p className='text-sm text-muted-foreground'>
            Estamos comenzando y tu feedback es clave. ¿Tenés sugerencias,
            problemas, o algo que te gustaría ver en la app? Escribinos abajo o
            contactanos directamente.
          </p>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='sr-only'>Mensaje</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='Tu mensaje...'
                        rows={4}
                        className='resize-none'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type='submit'
                className='w-full'
                disabled={isSubmitting || sent}
              >
                {isSubmitting
                  ? 'Enviando...'
                  : sent
                  ? '¡Mensaje enviado!'
                  : 'Enviar feedback'}
              </Button>
              <p className='text-center text-xs text-muted-foreground'>
                Contanos en detalle qué te gustaría mejorar, qué problema
                encontraste o cómo podemos ayudarte mejor.
              </p>
            </form>
          </Form>

          <div className='mt-4 flex justify-center gap-4'>
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              className='flex items-center gap-2 text-sm underline'
            >
              <MailCheck className='h-4 w-4' />
              Correo
            </Link>

            <Link
              href={WHATSAPP_LINK}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 text-sm underline'
            >
              <MessageCircle className='h-4 w-4' />
              WhatsApp
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
