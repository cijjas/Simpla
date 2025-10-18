/**
 * Command Center Utilities
 * 
 * Helper functions for platform detection and key matching.
 */

import { Command, Platform, KeyMatchResult } from './types';

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  
  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac';
  }
  
  if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows';
  }
  
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }
  
  return 'unknown';
}

/**
 * Check if the current platform is Mac
 */
export function isMac(): boolean {
  return detectPlatform() === 'mac';
}

/**
 * Check if a keyboard event matches a command
 */
export function matchesCommand(event: KeyboardEvent, command: Command): boolean {
  // Check if command is enabled
  if (command.enabled === false) return false;
  
  // Check if custom validation passes
  if (command.canExecute && !command.canExecute()) return false;
  
  // Normalize the key
  const eventKey = event.key.toLowerCase();
  const commandKey = command.key.toLowerCase();
  
  // Check if the key matches
  if (eventKey !== commandKey) return false;
  
  // Check modifiers
  const platform = detectPlatform();
  const isMacPlatform = platform === 'mac';
  
  for (const modifier of command.modifiers) {
    switch (modifier) {
      case 'cmd':
        // On Mac, check metaKey; on other platforms, skip (use ctrl instead)
        if (isMacPlatform && !event.metaKey) return false;
        break;
        
      case 'ctrl':
        // On Mac, check metaKey; on other platforms, check ctrlKey
        if (isMacPlatform) {
          if (!event.metaKey) return false;
        } else {
          if (!event.ctrlKey) return false;
        }
        break;
        
      case 'shift':
        if (!event.shiftKey) return false;
        break;
        
      case 'alt':
        if (!event.altKey) return false;
        break;
        
      case 'meta':
        if (!event.metaKey) return false;
        break;
    }
  }
  
  // Ensure no extra modifiers are pressed (except for cmd/ctrl cross-platform handling)
  const hasCmd = command.modifiers.includes('cmd');
  const hasCtrl = command.modifiers.includes('ctrl');
  const hasShift = command.modifiers.includes('shift');
  const hasAlt = command.modifiers.includes('alt');
  const hasMeta = command.modifiers.includes('meta');
  
  // Handle cmd/ctrl cross-platform
  const expectsMeta = isMacPlatform ? (hasCmd || hasCtrl || hasMeta) : hasMeta;
  const expectsCtrl = isMacPlatform ? false : (hasCmd || hasCtrl);
  
  if (event.metaKey !== expectsMeta) return false;
  if (event.ctrlKey !== expectsCtrl) return false;
  if (event.shiftKey !== hasShift) return false;
  if (event.altKey !== hasAlt) return false;
  
  return true;
}

/**
 * Find a matching command for a keyboard event
 */
export function findMatchingCommand(
  event: KeyboardEvent,
  commands: Command[]
): KeyMatchResult {
  for (const command of commands) {
    if (matchesCommand(event, command)) {
      return { matched: true, command };
    }
  }
  
  return { matched: false };
}

/**
 * Check if the target element is an input field
 */
export function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof Element)) return false;
  
  const tagName = element.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = element.getAttribute('contenteditable') === 'true';
  
  return isInput || isContentEditable;
}

/**
 * Format modifier keys for display
 */
export function formatModifiers(modifiers: string[]): string {
  const platform = detectPlatform();
  const isMacPlatform = platform === 'mac';
  
  // Handle cmd/ctrl cross-platform logic
  const hasCmd = modifiers.includes('cmd');
  const hasCtrl = modifiers.includes('ctrl');
  const hasShift = modifiers.includes('shift');
  const hasAlt = modifiers.includes('alt');
  const hasMeta = modifiers.includes('meta');
  
  const result: string[] = [];
  
  // For cross-platform, show the appropriate modifier
  if (hasCmd || hasCtrl) {
    result.push(isMacPlatform ? '⌘' : 'Ctrl');
  }
  
  if (hasShift) {
    result.push(isMacPlatform ? '⇧' : 'Shift');
  }
  
  if (hasAlt) {
    result.push(isMacPlatform ? '⌥' : 'Alt');
  }
  
  if (hasMeta && !hasCmd && !hasCtrl) {
    result.push(isMacPlatform ? '⌘' : 'Meta');
  }
  
  return result.join(isMacPlatform ? '' : '+');
}

/**
 * Format a key for display
 */
export function formatKey(key: string): string {
  // Capitalize single letters
  if (key.length === 1) {
    return key.toUpperCase();
  }
  
  // Special keys
  const specialKeys: Record<string, string> = {
    enter: '↵',
    escape: 'Esc',
    backspace: '⌫',
    delete: 'Del',
    tab: '⇥',
    space: 'Space',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
  };
  
  return specialKeys[key.toLowerCase()] || key;
}

/**
 * Format a complete keyboard shortcut for display
 */
export function formatShortcut(command: Command): string {
  const mods = formatModifiers(command.modifiers);
  const key = formatKey(command.key);
  const platform = detectPlatform();
  const isMacPlatform = platform === 'mac';
  
  if (isMacPlatform) {
    return `${mods}${key}`;
  }
  
  return mods ? `${mods}+${key}` : key;
}

/**
 * Get shortcut keys as an array for separate rendering
 */
export function getShortcutParts(command: Command): string[] {
  const platform = detectPlatform();
  const isMacPlatform = platform === 'mac';
  
  const hasCmd = command.modifiers.includes('cmd');
  const hasCtrl = command.modifiers.includes('ctrl');
  const hasShift = command.modifiers.includes('shift');
  const hasAlt = command.modifiers.includes('alt');
  const hasMeta = command.modifiers.includes('meta');
  
  const parts: string[] = [];
  
  // For cross-platform, show the appropriate modifier
  if (hasCmd || hasCtrl) {
    parts.push(isMacPlatform ? '⌘' : 'Ctrl');
  }
  
  if (hasShift) {
    parts.push(isMacPlatform ? '⇧' : 'Shift');
  }
  
  if (hasAlt) {
    parts.push(isMacPlatform ? '⌥' : 'Alt');
  }
  
  if (hasMeta && !hasCmd && !hasCtrl) {
    parts.push(isMacPlatform ? '⌘' : 'Meta');
  }
  
  // Add the key
  parts.push(formatKey(command.key));
  
  return parts;
}

