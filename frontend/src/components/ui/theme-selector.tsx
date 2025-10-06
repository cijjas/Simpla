'use client';

import { useThemeVariant } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Check } from 'lucide-react';

const themes = [
  {
    value: 'slate',
    label: 'Slate',
    description: 'Theme por defecto con colores neutros',
  },
  {
    value: 'nano',
    label: 'Nano',
    description: 'Theme minimalista con colores suaves',
  },
] as const;

export function ThemeSelector() {
  const { themeVariant, setThemeVariant } = useThemeVariant();

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tema de la Aplicación
        </CardTitle>
        <CardDescription>
          Elige el tema visual que prefieras para la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {themes.map((theme) => (
          <Button
            key={theme.value}
            variant={themeVariant === theme.value ? "default" : "outline"}
            onClick={() => setThemeVariant(theme.value)}
            className="w-full justify-start h-auto p-4"
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-left">
                <div className="font-medium">{theme.label}</div>
                <div className="text-sm opacity-70">{theme.description}</div>
              </div>
              {themeVariant === theme.value && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
