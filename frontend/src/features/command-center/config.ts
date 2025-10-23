/**
 * Command Center Configuration
 * 
 * Central configuration file for all keyboard shortcuts.
 * Add new commands here to make them available globally.
 */

import { Command, CommandCenterConfig } from './types';

/**
 * Global command definitions
 */
export const commands: Command[] = [
  {
    id: 'search-normas',
    key: 'k',
    modifiers: ['cmd', 'ctrl'], // Works with Cmd on Mac, Ctrl on Windows/Linux
    action: { type: 'navigate', route: '/normas' },
    description: 'Abrir búsqueda de normas',
    enabled: true,
    category: 'navigation',
  },
  
  {
    id: 'toggle-norma-chat',
    key: 'i',
    modifiers: ['cmd', 'ctrl'],
    action: { type: 'custom', handler: () => {} }, // Handler will be set by the chat component
    description: 'Abrir/cerrar chat de IA',
    enabled: true,
    category: 'chat',
  },
  
  {
    id: 'open-settings',
    key: ',',
    modifiers: ['cmd', 'ctrl', 'shift'],
    action: { type: 'navigate', route: '/configuracion' },
    description: 'Abrir configuración',
    enabled: true,
    category: 'navigation',
  },
  
  // Example commands (disabled by default - uncomment to enable):
  
  // {
  //   id: 'go-home',
  //   key: 'h',
  //   modifiers: ['cmd', 'ctrl'],
  //   action: { type: 'navigate', route: '/' },
  //   description: 'Ir al inicio',
  //   enabled: false,
  //   category: 'navigation',
  // },
  
  // {
  //   id: 'open-bookmarks',
  //   key: 'b',
  //   modifiers: ['cmd', 'ctrl'],
  //   action: { type: 'navigate', route: '/bookmarks' },
  //   description: 'Ver favoritos',
  //   enabled: false,
  //   category: 'navigation',
  // },
  
  // {
  //   id: 'open-command-palette',
  //   key: 'p',
  //   modifiers: ['cmd', 'ctrl', 'shift'],
  //   action: { type: 'function', handler: () => console.log('Open palette') },
  //   description: 'Abrir paleta de comandos',
  //   enabled: false,
  //   category: 'system',
  // },
];

/**
 * Command center configuration
 */
export const commandCenterConfig: CommandCenterConfig = {
  debug: process.env.NODE_ENV === 'development',
  showToasts: false, // Set to true if you want toast notifications
  disableInInputs: true, // Disable shortcuts when typing in inputs
  inputSelector: 'input, textarea, [contenteditable="true"]',
};

/**
 * Get all enabled commands
 */
export function getEnabledCommands(): Command[] {
  return commands.filter(cmd => cmd.enabled !== false);
}

/**
 * Get command by ID
 */
export function getCommandById(id: string): Command | undefined {
  return commands.find(cmd => cmd.id === id);
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: string): Command[] {
  return commands.filter(cmd => cmd.category === category && cmd.enabled !== false);
}


