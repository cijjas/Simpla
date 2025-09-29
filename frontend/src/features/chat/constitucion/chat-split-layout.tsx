'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/features/chat/hooks/use-chat';
import { MessageItem } from '@/features/chat/components/message-item';
import { LoadingMessage } from '@/features/chat/components/loading-message';
import ArgentinaMapSimple from './argentina-map-simple';
import ProvinceList from './province-list';
import { ChatInputSplit } from './chat-input-split';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, List } from 'lucide-react';

export default function ChatSplitLayout() {
  const {
    question,
    setQuestion,
    messages,
    selectedProvinces,
    dialogOpen,
    setDialogOpen,
    isLoading,
    textareaRef,
    toggleProvince,
    clearProvinces,
    send,
    formatTime,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full flex relative overflow-hidden p-4">
      {/* Chat Section - Responsive width */}
      <div className="w-full lg:w-2/3 flex flex-col ">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {hasMessages ? (
            <div className="space-y-6 pt-6 pb-4 px-6">
              {messages.map((msg, index) => (
                <MessageItem key={index} message={msg} formatTime={formatTime} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <LoadingMessage />
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <h1 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 font-serif mb-3">
                  Constituciones
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preguntá sobre la Constitución Nacional o la de cualquier provincia de
                  Argentina. Selecciona las provincias en el mapa para filtrar tu búsqueda.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-border p-4">
          <ChatInputSplit
            question={question}
            setQuestion={setQuestion}
            send={send}
            isLoading={isLoading}
            textareaRef={textareaRef}
            selectedProvinces={selectedProvinces}
            toggleProvince={toggleProvince}
            clearProvinces={clearProvinces}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
          />
        </div>
      </div>

      {/* Map Section - Hidden on small screens */}
      <div className="hidden lg:block p-4 w-1/3">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Mapa de Provincias</span>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs defaultValue="interactive" className="h-full flex flex-col">
              <div className="px-4 pt-2 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="interactive" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Interactivo
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Lista
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="interactive" className="h-full mt-2 overflow-hidden">
                  <ArgentinaMapSimple
                    selectedProvinces={selectedProvinces}
                    onProvinceToggle={toggleProvince}
                    className="h-full"
                  />
                </TabsContent>
                
                <TabsContent value="list" className="h-full mt-2 overflow-hidden">
                  <ProvinceList
                    selectedProvinces={selectedProvinces}
                    onProvinceToggle={toggleProvince}
                    onClearAll={clearProvinces}
                    className="h-full"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
