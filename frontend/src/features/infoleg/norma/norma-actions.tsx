'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Download, Share2, Check, Link as LinkIcon } from 'lucide-react';
import { SiX, SiWhatsapp } from 'react-icons/si';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NormaDetallada } from '../utils/types';

export function NormaActions({ norma }: { norma?: NormaDetallada }) {
  const [copied, setCopied] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  /* ───────── Copy ───────── */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(norma?.copyTexto || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  /* ───────── PDF Download (text-based) ───────── */
  const handleDownload = useCallback(async () => {
    if (!norma) return;

    const { jsPDF } = await import('jspdf');

    // fetch font and image assets
    const fetchFont = async (url: string) => {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const fetchImage = async (url: string): Promise<string> => {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    };

    const [[loraTTF, loraTTFB, geistTTF], logoDataURL] = await Promise.all([
      Promise.all([
        fetchFont('/fonts/Lora-SemiBold.ttf'),
        fetchFont('/fonts/Lora-Bold.ttf'),
        fetchFont('/fonts/Geist-Regular.ttf'),
      ]),
      fetchImage('/images/estampa.png'),
    ]);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

    // Embed fonts
    pdf.addFileToVFS('Lora.ttf', loraTTF);
    pdf.addFont('Lora.ttf', 'Lora', 'normal');
    pdf.addFileToVFS('LoraB.ttf', loraTTFB);
    pdf.addFont('LoraB.ttf', 'Lora', 'bold');
    pdf.addFileToVFS('Geist.ttf', geistTTF);
    pdf.addFont('Geist.ttf', 'Geist', 'normal');

    const bg = [253, 253, 252]; // cream
    const drawBg = () => {
      pdf.setFillColor(bg[0], bg[1], bg[2]);
      pdf.rect(
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        'F',
      );
    };

    const marginX = 20;
    const maxWidth = 170;
    const lineH = 7;

    /* ───────── COVER PAGE ───────── */
    drawBg();
    let y = 30;

    // Logo on the left
    const logoSize = 40;
    const logoX = marginX;
    const logoY = y;

    if (logoDataURL) {
      pdf.setDrawColor(220);
      pdf.addImage(logoDataURL, 'PNG', logoX, logoY, logoSize, 0); // height = 0 keeps aspect ratio
    }

    // SIMPLA brand in Lora, big and uppercase
    const textX = logoX + logoSize + 10;
    pdf.setFont('Lora', 'bold').setFontSize(52);
    pdf.text('SIMPLA', textX, logoY + 15);

    // Tagline in Geist
    pdf.setFont('Geist', 'normal').setFontSize(18).setTextColor(100);
    pdf.text('Una manera simple de\nnavegar las leyes.', textX, logoY + 30);
    pdf.setTextColor(0);

    // Start title block
    y = logoY + logoSize + 100;

    // nombreNorma
    if (norma.nombreNorma) {
      pdf.setFont('Lora', 'bold').setFontSize(32);
      const nameLines = pdf.splitTextToSize(norma.nombreNorma, maxWidth);
      nameLines.forEach((line: string) => {
        pdf.text(line, marginX, y);
        y += 12;
      });
      y += 4; // spacing after nombreNorma block
    }

    // Title
    pdf.setFont('Lora', 'normal').setFontSize(20);
    const titleLines = pdf.splitTextToSize(
      norma.tituloSumarioFormateado ||
        norma.tituloResumidoFormateado ||
        'Sin título',
      maxWidth,
    );
    titleLines.forEach((line: string) => {
      pdf.text(line, marginX, y);
      y += 10;
    });

    // Resumen blockquote-style
    if (norma.textoResumidoFormateado) {
      y += 10;

      const resumenText = `“${norma.textoResumidoFormateado.trim()}”`;

      // Adjusted width: same as maxWidth, minus only 6px padding on left
      const resumenLines = pdf.splitTextToSize(resumenText, 300);
      const blockStartY = y;
      const blockHeight = resumenLines.length * 6;

      // Vertical line like <blockquote>
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(1);
      pdf.line(marginX, blockStartY - 5, marginX, blockStartY + blockHeight);

      // Text: left-indented but wide enough
      pdf.setFont('Geist', 'italic').setFontSize(11).setTextColor(100);
      let textY = blockStartY;
      resumenLines.forEach((line: string) => {
        pdf.text(line, marginX + 6, textY, { maxWidth: maxWidth - 6 });
        textY += 6;
      });

      pdf.setTextColor(0);
      y = blockStartY + blockHeight + 10;
    }

    // Metadata – now one line per item at the very end
    pdf.setFont('Geist', 'normal').setFontSize(11);
    const metaLines = [
      norma.tipoNorma?.trim() && `Tipo: ${norma.tipoNorma.trim()}`,
      norma.claseNorma?.trim() && `Clase: ${norma.claseNorma.trim()}`,
      norma.publicacion && `Publicación: ${norma.publicacion}`,
      (norma.nroBoletin || norma.pagBoletin) &&
        `Boletín Oficial: ${norma.nroBoletin || '-'} / pág. ${
          norma.pagBoletin || '-'
        }`,
      norma.sancion && `Sanción: ${norma.sancion}`,
      norma.jurisdiccion && `Jurisdicción: ${norma.jurisdiccion}`,
    ].filter(Boolean) as string[];

    // Place metadata near bottom
    let metaY = 245;
    metaLines.forEach(line => {
      pdf.text(line, marginX, metaY);
      metaY += 6;
    });

    /* ───────── BODY PAGES ───────── */
    pdf.addPage();
    drawBg();
    let cursorY = 25;

    const addText = (txt: string) => {
      const paragraphs = txt.split('\n\n');
      for (const p of paragraphs) {
        const lines = p
          .split('\n')
          .flatMap(l => pdf.splitTextToSize(l, maxWidth));
        for (const line of lines) {
          if (cursorY > 280) {
            pdf.addPage();
            drawBg();
            cursorY = 25;
          }
          pdf.text(line, marginX, cursorY, { align: 'justify', maxWidth });
          cursorY += lineH;
        }
        cursorY += 4;
      }
    };

    const decodeHtmlEntities = (input: string): string => {
      const txt = document.createElement('textarea');
      txt.innerHTML = input;
      return txt.value;
    };

    const rawHtml = norma.textoNorma || norma.textoNormaAct || '';

    const plainBody = decodeHtmlEntities(
      rawHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\r\n/g, '\n')
        .trim(),
    );

    pdf.setFont('Geist', 'normal').setFontSize(12);
    addText(plainBody);

    /* ───────── PAGINATION ───────── */
    const total = pdf.getNumberOfPages();
    for (let i = 2; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFont('Geist', 'normal').setFontSize(10).setTextColor(150);
      pdf.text(
        `Página ${i - 1} de ${total - 1}`,
        pdf.internal.pageSize.getWidth() - marginX,
        290,
        { align: 'right' },
      );
    }

    pdf.save(`${norma.nombreNorma || 'norma-simplar'}.pdf`);
  }, [norma]);

  /* ───────── Share (native + fallback) ───────── */
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `${
    norma?.nombreNorma || `${norma?.tipoNorma} ${norma?.publicacion}`
  }`;

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'Norma', text: shareText, url: shareUrl });
    } catch {
      // user canceled
    }
  };

  return (
    <TooltipProvider>
      <div className='flex gap-2'>
        {/* Copy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size='icon' variant='outline' onClick={handleCopy}>
              {copied ? (
                <Check className='h-4 w-4 text-green-600' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copiar norma</TooltipContent>
        </Tooltip>

        {/* Download */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size='icon' variant='outline' onClick={handleDownload}>
              <Download className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Descargar PDF</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size='icon' variant='outline'>
                    {copiedShareLink ? (
                      <Check className='h-4 w-4 text-green-600' />
                    ) : (
                      <Share2 className='h-4 w-4' />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-44'>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        shareUrl,
                      )}`}
                      target='_blank'
                    >
                      <SiX className='mr-2 h-4 w-4' />X / Twitter
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `${shareText}: ${shareUrl}`,
                      )}`}
                      target='_blank'
                    >
                      <SiWhatsapp className='mr-2 h-4 w-4' />
                      WhatsApp
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={async () => {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopiedShareLink(true);
                      setTimeout(() => setCopiedShareLink(false), 1500);
                    }}
                  >
                    <LinkIcon className='mr-2 h-4 w-4' />
                    Copiar enlace
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={nativeShare}>
                    <Share2 className='mr-2 h-4 w-4' />
                    Otros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </TooltipTrigger>
          <TooltipContent>Compartir</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
