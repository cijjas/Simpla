'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SimpleArticle {
  art: number;
  texto: string;
}

interface Capitulo {
  nombre: string;
  articulos: SimpleArticle[];
}

interface Titulo {
  nombre: string;
  articulos: SimpleArticle[];
  capitulos?: Capitulo[];
}

interface ParsedNorma {
  meta: any;
  preambulo: {
    contexto?: string | null;
    visto?: string | null;
    considerando?: string | null;
  };
  // cuerpo can be either array of simple articles or array of Titulo objects
  cuerpo: SimpleArticle[] | Titulo[];
  firmas: string[];
  nota?: string | null;
  anexos: { nombre: string; url: string }[];
  pie?: { edicion: string; numero: string; validez: string } | null;
  resto?: string | null;
}

export function NormaBody({ parsed }: { parsed: ParsedNorma }) {
  if (!parsed) {
    return (
      <p className='text-muted-foreground'>No hay contenido disponible.</p>
    );
  }

  const { meta, preambulo, cuerpo, firmas, nota, anexos, pie } = parsed;

  // Helper to check if cuerpo is array of simple articles
  const isSimpleArticles = (arr: any[]): arr is SimpleArticle[] => {
    return (
      arr.length === 0 ||
      (typeof arr[0].art === 'number' && typeof arr[0].texto === 'string')
    );
  };

  return (
    <Card>
      {/* Meta / header */}
      {/* <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl'>
          {meta.tituloResumido || meta.tituloSumario}
        </CardTitle>
        <CardDescription className='flex flex-wrap gap-2 text-sm'>
          <Badge variant='secondary'>{meta.tipoNorma}</Badge>
          {meta.claseNorma && (
            <Badge variant='secondary'>{meta.claseNorma}</Badge>
          )}
          <Badge>{meta.sancion}</Badge>
          <Badge>{meta.jurisdiccion}</Badge>
          <span>
            Boletín&nbsp;{meta.nroBoletin} • pág&nbsp;{meta.pagBoletin}
          </span>
        </CardDescription>
      </CardHeader>

      <Separator /> */}

      <CardContent>
        <Tabs defaultValue='cuerpo' className='w-full'>
          <TabsList className='mb-4 flex-wrap'>
            <TabsTrigger value='preambulo'>Preámbulo</TabsTrigger>
            <TabsTrigger value='cuerpo'>Artículos</TabsTrigger>
            <TabsTrigger value='firmas'>Firmas</TabsTrigger>
            <TabsTrigger value='anexos'>Anexos</TabsTrigger>
            <TabsTrigger value='raw'>JSON</TabsTrigger>
          </TabsList>

          {/* Preámbulo */}
          <TabsContent value='preambulo'>
            <ScrollArea className='h-96 pr-4 space-y-4'>
              {preambulo?.contexto ? (
                <>
                  <h4 className='font-bold font-serif py-2'>Contexto</h4>
                  <p className='whitespace-pre-wrap'>{preambulo.contexto}</p>
                </>
              ) : (
                <p className='text-muted-foreground italic'>
                  Sin contexto disponible.
                </p>
              )}
              <Separator className='my-4' />

              {preambulo?.visto && (
                <>
                  <h4 className='font-bold font-serif py-2'>Visto</h4>
                  <p className='whitespace-pre-wrap'>{preambulo.visto}</p>
                </>
              )}

              {/* Separator or spacing before CONSIDERANDO */}
              {preambulo?.visto && preambulo?.considerando && (
                <Separator className='my-4' />
              )}

              {preambulo?.considerando && (
                <>
                  <h4 className='font-bold font-serif py-2'>Considerando</h4>
                  <p className='whitespace-pre-wrap'>
                    {preambulo.considerando}
                  </p>
                </>
              )}

              {!preambulo?.visto &&
                !preambulo?.considerando &&
                !preambulo?.contexto && (
                  <p className='text-muted-foreground italic'>
                    No se encontró información en el preámbulo.
                  </p>
                )}
            </ScrollArea>
          </TabsContent>

          {/* Articulos */}
          <TabsContent value='cuerpo'>
            <ScrollArea className='h-96 pr-4'>
              {cuerpo.length > 0 ? (
                isSimpleArticles(cuerpo) ? (
                  <Accordion
                    type='single'
                    collapsible
                    defaultValue={`art-${(cuerpo as SimpleArticle[])[0]?.art}`}
                  >
                    {(cuerpo as SimpleArticle[]).map(({ art, texto }) => (
                      <AccordionItem key={art} value={`art-${art}`}>
                        <AccordionTrigger className='font-serif text-lg'>
                          Artículo {art}°
                        </AccordionTrigger>
                        <AccordionContent className='whitespace-pre-wrap leading-6'>
                          {texto}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Accordion
                    type='single'
                    collapsible
                    defaultValue={`titulo-0`}
                  >
                    {(cuerpo as Titulo[]).map((titulo, idx) => (
                      <AccordionItem key={idx} value={`titulo-${idx}`}>
                        <AccordionTrigger className='font-serif text-lg'>
                          {titulo.nombre}
                        </AccordionTrigger>
                        <AccordionContent>
                          {/* Render artículos directos del título */}
                          {titulo.articulos.length > 0 && (
                            <Accordion
                              type='single'
                              collapsible
                              defaultValue={`art-${titulo.articulos[0]?.art}`}
                              className='mb-4'
                            >
                              {titulo.articulos.map(({ art, texto }) => (
                                <AccordionItem key={art} value={`art-${art}`}>
                                  <AccordionTrigger className='font-serif text-base'>
                                    Artículo {art}°
                                  </AccordionTrigger>
                                  <AccordionContent className='whitespace-pre-wrap leading-6'>
                                    {texto}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}

                          {/* Render capitulos if any */}
                          {titulo.capitulos && titulo.capitulos.length > 0 && (
                            <Accordion type='single' collapsible>
                              {titulo.capitulos.map((capitulo, cidx) => (
                                <AccordionItem
                                  key={cidx}
                                  value={`capitulo-${cidx}`}
                                >
                                  <AccordionTrigger className='font-serif text-base'>
                                    {capitulo.nombre}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <Accordion
                                      type='single'
                                      collapsible
                                      defaultValue={`art-${capitulo.articulos[0]?.art}`}
                                    >
                                      {capitulo.articulos.map(
                                        ({ art, texto }) => (
                                          <AccordionItem
                                            key={art}
                                            value={`art-${art}`}
                                          >
                                            <AccordionTrigger className='font-serif text-sm'>
                                              Artículo {art}°
                                            </AccordionTrigger>
                                            <AccordionContent className='whitespace-pre-wrap leading-6'>
                                              {texto}
                                            </AccordionContent>
                                          </AccordionItem>
                                        ),
                                      )}
                                    </Accordion>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )
              ) : (
                <p className='text-muted-foreground italic'>
                  No se encontraron artículos en esta norma.
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Firmas */}
          <TabsContent value='firmas'>
            {firmas.length > 0 ? (
              <div className='flex flex-wrap gap-2 mb-4'>
                {firmas.map(f => (
                  <Badge key={f}>{f}</Badge>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground italic'>
                No se encontraron firmas.
              </p>
            )}
            {nota && (
              <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                {nota}
              </p>
            )}
          </TabsContent>

          {/* Anexos */}
          <TabsContent value='anexos'>
            {anexos.length === 0 ? (
              <p className='text-muted-foreground'>Sin anexos.</p>
            ) : (
              <ul className='list-disc pl-5 space-y-1'>
                {anexos.map(a => (
                  <li key={a.url}>
                    <a
                      href={a.url.replace(
                        '%%server_name%%',
                        'https://servicios.infoleg.gob.ar/infolegInternet',
                      )}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline'
                    >
                      {a.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* JSON */}
          <TabsContent value='raw'>
            <ScrollArea className='h-96 pr-4'>
              <pre className='text-xs whitespace-pre-wrap'>
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Pie */}
        {pie && (
          <p className='text-xs text-muted-foreground mt-6'>
            Edición&nbsp;{pie.edicion} • Nº&nbsp;{pie.numero} • Validez&nbsp;
            {pie.validez}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
