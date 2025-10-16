/**
 * Command Center Types
 * 
 * Defines the type system for the global keyboard shortcut system.
 */

/**
 * Supported modifier keys
 */
export type ModifierKey = 'cmd' | 'ctrl' | 'shift' | 'alt' | 'meta';

/**
 * Action types that commands can trigger
 */
export type CommandAction =
  | { type: 'navigate'; route: string }
  | { type: 'modal'; modalId: string }
  | { type: 'function'; handler: () => void | Promise<void> }
  | { type: 'custom'; handler: (context?: unknown) => void | Promise<void> };

/**
 * Command definition
 */
export interface Command {
  /** Unique identifier for the command */
  id: string;
  
  /** The key to press (e.g., 'k', 'h', 'Enter') */
  key: string;
  
  /** Modifier keys required (cmd/ctrl are automatically cross-platform) */
  modifiers: ModifierKey[];
  
  /** Action to perform when command is triggered */
  action: CommandAction;
  
  /** Human-readable description */
  description: string;
  
  /** Whether the command is enabled */
  enabled?: boolean;
  
  /** Category for grouping (optional) */
  category?: string;
  
  /** Custom validation function (optional) */
  canExecute?: () => boolean;
}

/**
 * Command execution context
 */
export interface CommandContext {
  /** Execute a command by ID */
  executeCommand: (id: string) => Promise<void>;
  
  /** Get all registered commands */
  getCommands: () => Command[];
  
  /** Get enabled commands only */
  getEnabledCommands: () => Command[];
  
  /** Check if a command is available */
  isCommandAvailable: (id: string) => boolean;
  
  /** Toggle command palette visibility */
  togglePalette?: () => void;
  
  /** Current palette open state */
  isPaletteOpen?: boolean;
}

/**
 * Keyboard event match result
 */
export interface KeyMatchResult {
  matched: boolean;
  command?: Command;
}

/**
 * Command execution result
 */
export interface CommandExecutionResult {
  success: boolean;
  commandId: string;
  error?: Error;
}

/**
 * Platform detection
 */
export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * Command center configuration
 */
export interface CommandCenterConfig {
  /** Enable debug logging */
  debug?: boolean;
  
  /** Show toast notifications on command execution */
  showToasts?: boolean;
  
  /** Disable shortcuts when typing in inputs */
  disableInInputs?: boolean;
  
  /** Custom input selector for disabling shortcuts */
  inputSelector?: string;
}


