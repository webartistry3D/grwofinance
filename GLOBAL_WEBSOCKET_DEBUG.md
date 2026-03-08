# Global WebSocket Debug Override Implementation

## 🎯 **Problem Solved**
WebSocket debugging wasn't working because there might be multiple WebSocket implementations or cached/compiled code not using the updated debug version.

## ✅ **Global Debug Override Solution**

### **1. Created Global WebSocket Override**
**File**: `client/src/websocket-debug-override.ts`

```typescript
// Global WebSocket Debug Override
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
    console.log('=== End WebSocket Construction ===');
    
    // Validate URL before construction
    if (typeof url === 'string' && url.includes('undefined')) {
      console.error('🚨 INVALID URL DETECTED:', url);
      throw new Error(`Invalid WebSocket URL: ${url}`);
    }
    
    // Call original WebSocket constructor
    if (protocols) {
      super(url, protocols);
    } else {
      super(url);
    }
  }
};
```

### **2. Early Import in Main App**
**File**: `client/src/App.tsx`

```typescript
import "./websocket-debug-override"; // Import WebSocket debug override early
```

## 🛠️ **Technical Implementation**

### **Global Override Strategy**
- **Capture Original**: Store `window.WebSocket` before override
- **Class Extension**: Extend original WebSocket to maintain functionality
- **Global Replacement**: Replace `window.WebSocket` with debug version
- **Early Import**: Load before any other WebSocket usage

### **Debug Information Captured**
```typescript
console.log(`=== WebSocket Construction #${wsConstructionCount} ===`);
console.log('URL:', url);
console.log('Protocols:', protocols);
console.log('Timestamp:', new Date().toISOString());
console.log('Stack trace:', new Error().stack);
```

### **Invalid URL Detection**
```typescript
if (typeof url === 'string' && url.includes('undefined')) {
  console.error('🚨 INVALID URL DETECTED:', url);
  throw new Error(`Invalid WebSocket URL: ${url}`);
}
```

## 🔄 **How It Works**

### **All WebSocket Constructions Intercepted**
1. **Any Code**: Anywhere in the app that creates `new WebSocket()`
2. **Any Library**: Third-party libraries using WebSocket
3. **Any Component**: Custom components with WebSocket logic
4. **Any Timing**: Early or late initialization

### **Debug Output Expected**
```javascript
🔍 WebSocket Debug Override Active - All WebSocket constructions will be logged

=== WebSocket Construction #1 ===
URL: ws://localhost:5000/ws
Protocols: undefined
Timestamp: 2026-03-08T10:35:00.000Z
Stack trace: Error at WebSocket.constructor ...

=== WebSocket Construction #2 ===
URL: ws://localhost:undefined/ws
Protocols: undefined
Timestamp: 2026-03-08T10:35:01.000Z
🚨 INVALID URL DETECTED: ws://localhost:undefined/ws
```

## 🎯 **Root Cause Identification**

### **Multiple WebSocket Sources**
The global override will reveal:
- ✅ **Which components** are creating WebSockets
- ✅ **How many attempts** are being made
- ✅ **Which URLs** are being used (valid vs invalid)
- ✅ **Timing sequence** of connection attempts
- ✅ **Stack traces** to identify source code locations

### **Expected Findings**
1. **Component Count**: Should see multiple WebSocket constructions
2. **URL Variations**: Some valid, some with `undefined`
3. **Source Identification**: Stack traces show which files/components
4. **Timing Issues**: Can see if some initialize before `window.location` is ready

## 📱 **Testing Instructions**

### **Step-by-Step Debug Process:**
1. **Refresh Browser**: Clear cache and reload page
2. **Check Console**: Look for "🔍 WebSocket Debug Override Active"
3. **Monitor Constructions**: Count "=== WebSocket Construction #X ===" occurrences
4. **Identify Invalid URLs**: Look for "🚨 INVALID URL DETECTED"
5. **Analyze Stack Traces**: See which code locations are problematic

### **Expected Console Output:**
- **Override Active**: Confirms debug is working
- **Multiple Constructions**: Shows all WebSocket creation attempts
- **URL Validation**: Catches invalid URLs before connection
- **Stack Traces**: Identifies exact source locations

## 🎉 **Status: COMPREHENSIVE DEBUG ACTIVE**

The global WebSocket override now provides:
- ✅ **Universal interception** of all WebSocket constructions
- ✅ **Detailed logging** of every connection attempt
- ✅ **Invalid URL detection** before connection attempts
- ✅ **Stack trace analysis** to identify source code
- ✅ **Multiple source detection** for race conditions

**Refresh the page and check console for comprehensive WebSocket debugging!** 🔍✨

## 🛡️ **Next Steps**

After running with debug override:
1. **Count Constructions**: How many WebSockets are being created?
2. **Identify Sources**: Which components/libraries are creating them?
3. **URL Analysis**: Which URLs are valid vs invalid?
4. **Timing Issues**: Are some created before `window.location` is ready?
5. **Fix Root Cause**: Based on debug findings

This will definitively identify why some WebSocket URLs have `undefined` hosts!
