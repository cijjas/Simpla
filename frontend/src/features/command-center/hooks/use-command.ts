'use client';

/**
 * useCommand Hook
 * 
 * Hook to access the command center context.
 */

import { useContext } from 'react';
import { CommandCenterContext } from '../context/command-provider';
import { CommandContext } from '../types';

/**
 * Hook to access command center functionality
 * 
 * @throws {Error} If used outside of CommandProvider
 * @returns {CommandContext} Command center context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { executeCommand, getEnabledCommands } = useCommand();
 *   
 *   const handleClick = () => {
 *     executeCommand('search-normas');
 *   };
 *   
 *   return <button onClick={handleClick}>Search</button>;
 * }
 * ```
 */
export function useCommand(): CommandContext {
  const context = useContext(CommandCenterContext);
  
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }
  
  return context;
}


