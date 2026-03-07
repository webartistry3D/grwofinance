// Real-time online users tracking - simplified version using HTTP polling
// This avoids conflicts with existing WebSocket service

interface OnlineUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  lastSeen: Date;
}

class OnlineUsersManager {
  private onlineUsers = new Map<string, OnlineUser>();

  // Simplified initialization - no Socket.IO server needed
  initialize(server: any) {
    console.log("🔌 Online users tracking initialized (HTTP polling mode)");
    
    // Clean up inactive users every 5 minutes
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 5 * 60 * 1000);
  }

  // Simple method to mark user as online (called from API endpoints)
  markUserOnline(userId: string, email: string, firstName?: string, lastName?: string) {
    const onlineUser: OnlineUser = {
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      lastSeen: new Date()
    };

    this.onlineUsers.set(userId, onlineUser);
  }

  // Simple method to mark user as offline
  markUserOffline(userId: string) {
    const user = this.onlineUsers.get(userId);
    if (user) {
      this.onlineUsers.delete(userId);
    }
  }

  private broadcastOnlineUsers() {
    // In HTTP polling mode, we don't broadcast, just update the internal state
    // The frontend will poll the system health endpoint to get updates
  }

  private cleanupInactiveUsers() {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    Array.from(this.onlineUsers.entries()).forEach(([userId, user]) => {
      if (now.getTime() - user.lastSeen.getTime() > inactiveThreshold) {
        this.onlineUsers.delete(userId);
      }
    });

    this.broadcastOnlineUsers();
  }

  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }
}

export const onlineUsersManager = new OnlineUsersManager();
