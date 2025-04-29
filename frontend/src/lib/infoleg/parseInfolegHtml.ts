import { load } from 'cheerio';
import sanitizeHtml from 'sanitize-html';

const ARTICLE_RX = /^art(í|i)?culo\b/i;
const CHAPTER_RX = /^cap(í|i)tulo\b/i;
const TITLE_RX = /^t(í|i)tulo\b/i;
const DECRETA_RX = /^decreta:?$/i;
const NOTA_RX = /^nota:\b/i;
const CONSIDERANDO_RX = /^considerando:?$/i;
const SIGNATURE_RX =
  /(milei|guillermo francos|firmado|dado en la sala|planilla anexa)/i;

export function parseInfolegHtml(raw: string): string {
  if (!raw) return '';

  const $ = load(raw);
  $('[style]').removeAttr('style');
  $('span').each((_, el) => {
    const $el = $(el);
    if (/font-weight:\s*bold/i.test($el.attr('style') || '')) {
      $el.replaceWith(`<strong>${$el.html()}</strong>`);
    }
  });

  $('br').replaceWith('\n');
  const lines = $.root()
    .text()
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  let html = '';
  let currentArticuloTitle = '';
  let currentArticuloBody = '';
  let insideArticulo = false;
  let foundSignature = false;

  const flushArticulo = () => {
    if (currentArticuloTitle) {
      html += `
        <div class="not-prose">
          <div class="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-4 my-8">
            <div class="space-y-2">
              <h3 class="text-lg font-semibold leading-none tracking-tight">${currentArticuloTitle}</h3>
              <p class="text-muted-foreground">${currentArticuloBody.trim()}</p>
            </div>
          </div>
        </div>`;
      currentArticuloTitle = '';
      currentArticuloBody = '';
      insideArticulo = false;
    }
  };

  for (const line of lines) {
    if (foundSignature) {
      // After signature detected, just normal paragraphs
      html += `<p>${line}</p>`;
      continue;
    }

    if (
      CHAPTER_RX.test(line) ||
      TITLE_RX.test(line) ||
      DECRETA_RX.test(line) ||
      CONSIDERANDO_RX.test(line) ||
      NOTA_RX.test(line)
    ) {
      flushArticulo();
      html += `<h2 class="scroll-mt-20 text-2xl font-bold tracking-tight mt-10 mb-6">${line.toUpperCase()}</h2>`;
      continue;
    }

    if (ARTICLE_RX.test(line)) {
      flushArticulo();
      const [title, ...rest] = line.split(/\s*-\s*/);
      currentArticuloTitle = title.trim();
      currentArticuloBody = rest.join('- ').trim();
      insideArticulo = true;
      continue;
    }

    if (SIGNATURE_RX.test(line)) {
      flushArticulo();
      foundSignature = true;
      html += `<p>${line}</p>`;
      continue;
    }

    if (insideArticulo) {
      currentArticuloBody += ' ' + line;
    } else {
      html += `<p>${line}</p>`;
    }
  }

  flushArticulo();

  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'h2',
      'h3',
      'div',
      'strong',
      'em',
      'section',
      'ul',
      'ol',
      'li',
      'sup',
      'sub',
    ],
    allowedAttributes: {
      div: ['class'],
      section: ['class'],
      h2: ['class'],
      h3: ['class'],
      p: ['class'],
    },
  });
}
