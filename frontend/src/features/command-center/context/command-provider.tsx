'use client';

/**
 * Command Provider
 * 
 * Provides global keyboard shortcut context and event handling.
 */

import React, { createContext, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandContext } from '../types';
import { commands as defaultCommands, commandCenterConfig } from '../config';
import { findMatchingCommand, isInputElement } from '../utils';

/**
 * Command Center Context
 */
export const CommandCenterContext = createContext<CommandContext | null>(null);

/**
 * Command Provider Props
 */
interface CommandProviderProps {
  children: React.ReactNode;
  commands?: Command[];
  debug?: boolean;
}

/**
 * Command Provider Component
 * 
 * @example
 * ```tsx
 * <CommandProvider>
 *   <App />
 * </CommandProvider>
 * ```
 */
export function CommandProvider({
  children,
  commands = defaultCommands,
  debug = commandCenterConfig.debug,
}: CommandProviderProps) {
  const router = useRouter();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  /**
   * Execute a command by ID
   */
  const executeCommand = useCallback(
    async (id: string): Promise<void> => {
      const command = commands.find(cmd => cmd.id === id);

      if (!command) {
        if (debug) {
          console.warn(`[CommandCenter] Command not found: ${id}`);
        }
        return;
      }

      if (command.enabled === false) {
        if (debug) {
          console.warn(`[CommandCenter] Command disabled: ${id}`);
        }
        return;
      }

      if (command.canExecute && !command.canExecute()) {
        if (debug) {
          console.warn(`[CommandCenter] Command cannot execute: ${id}`);
        }
        return;
      }

      if (debug) {
        console.log(`[CommandCenter] Executing command: ${id}`);
      }

      try {
        switch (command.action.type) {
          case 'navigate':
            router.push(command.action.route);
            break;

          case 'function':
            await command.action.handler();
            break;

          case 'custom':
            await command.action.handler();
            break;

          case 'modal':
            // Modal handling can be implemented here
            // For now, just log
            if (debug) {
              console.log(`[CommandCenter] Modal: ${command.action.modalId}`);
            }
            break;
        }

        if (commandCenterConfig.showToasts) {
          // Toast notification can be added here
          console.log(`✓ ${command.description}`);
        }
      } catch (error) {
        console.error(`[CommandCenter] Error executing command ${id}:`, error);
        throw error;
      }
    },
    [commands, router, debug]
  );

  /**
   * Get all registered commands
   */
  const getCommands = useCallback((): Command[] => {
    return commands;
  }, [commands]);

  /**
   * Get enabled commands only
   */
  const getEnabledCommands = useCallback((): Command[] => {
    return commands.filter(cmd => cmd.enabled !== false);
  }, [commands]);

  /**
   * Check if a command is available
   */
  const isCommandAvailable = useCallback(
    (id: string): boolean => {
      const command = commands.find(cmd => cmd.id === id);
      if (!command) return false;
      if (command.enabled === false) return false;
      if (command.canExecute && !command.canExecute()) return false;
      return true;
    },
    [commands]
  );

  /**
   * Toggle command palette
   */
  const togglePalette = useCallback(() => {
    setIsPaletteOpen(prev => !prev);
  }, []);

  /**
   * Handle keyboard events
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we should ignore this event
      if (commandCenterConfig.disableInInputs && isInputElement(event.target)) {
        return;
      }

      // Find matching command
      const result = findMatchingCommand(event, getEnabledCommands());

      if (result.matched && result.command) {
        event.preventDefault();
        event.stopPropagation();

        if (debug) {
          console.log(`[CommandCenter] Matched command: ${result.command.id}`);
        }

        executeCommand(result.command.id);
      }
    };

    // Attach event listener
    window.addEventListener('keydown', handleKeyDown);

    if (debug) {
      console.log(`[CommandCenter] Initialized with ${getEnabledCommands().length} enabled commands`);
    }

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [executeCommand, getEnabledCommands, debug]);

  const contextValue: CommandContext = {
    executeCommand,
    getCommands,
    getEnabledCommands,
    isCommandAvailable,
    togglePalette,
    isPaletteOpen,
  };

  return (
    <CommandCenterContext.Provider value={contextValue}>
      {children}
    </CommandCenterContext.Provider>
  );
}

