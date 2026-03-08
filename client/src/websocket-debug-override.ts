// Global WebSocket Debug Override
// This file should be imported early to catch all WebSocket construction attempts

const OriginalWebSocket = window.WebSocket;

let wsConstructionCount = 0;

window.WebSocket = class extends OriginalWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    wsConstructionCount++;
    console.log(`=== WebSocket Construction #${wsConstructionCount} ===`);
    console.log('URL:', url);
    console.log('Protocols:', protocols);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Stack trace:', new Error().stack);
    
    // Special handling for Vite HMR and other development tools
    if (protocols === 'vite-hmr') {
      console.log('🔧 Vite HMR WebSocket detected - skipping connection');
      // Don't create WebSocket for Vite HMR
      return;
    }
    
    // Validate URL before construction
    if (typeof url === 'string' && url.includes('undefined')) {
      console.error('🚨 INVALID URL DETECTED:', url);
      throw new Error(`Invalid WebSocket URL: ${url}`);
    }
    
    console.log('=== End WebSocket Construction ===');
    
    // Call original WebSocket constructor
    if (protocols) {
      super(url, protocols);
    } else {
      super(url);
    }
  }
};

// Log that override is active
console.log('🔍 WebSocket Debug Override Active - All WebSocket constructions will be logged');
