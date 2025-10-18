/**
 * Command Center
 * 
 * Global keyboard shortcut system for the application.
 * 
 * @example
 * ```tsx
 * // In your root layout:
 * import { CommandProvider } from '@/features/command-center';
 * 
 * <CommandProvider>
 *   <App />
 * </CommandProvider>
 * ```
 * 
 * @example
 * ```tsx
 * // In any component:
 * import { useCommand } from '@/features/command-center';
 * 
 * function MyComponent() {
 *   const { executeCommand } = useCommand();
 *   
 *   return (
 *     <button onClick={() => executeCommand('search-normas')}>
 *       Search
 *     </button>
 *   );
 * }
 * ```
 */

// Context & Provider
export { CommandProvider, CommandCenterContext } from './context/command-provider';

// Hooks
export { useCommand } from './hooks/use-command';


// Config
export {
  commands,
  commandCenterConfig,
  getEnabledCommands,
  getCommandById,
  getCommandsByCategory,
} from './config';

// Utils
export {
  detectPlatform,
  isMac,
  matchesCommand,
  findMatchingCommand,
  isInputElement,
  formatModifiers,
  formatKey,
  formatShortcut,
  getShortcutParts,
} from './utils';

// Types
export type {
  Command,
  CommandAction,
  CommandContext,
  CommandCenterConfig,
  ModifierKey,
  Platform,
  KeyMatchResult,
  CommandExecutionResult,
} from './types';

