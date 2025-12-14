
import { User, UserSettings } from '../types';

const USERS_KEY = 'zerogpt_users';
const CURRENT_USER_KEY = 'zerogpt_current_user_id';

const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '', 
  apiSecret: '',
  accessToken: 'DBBvkRbYPM11MkvMg3jL2HD6Ns2Mc3ha', 
  passcode: '0000',
  isLiveMode: false,
  useProxy: true
};

export const AuthService = {
  getUsers(): User[] {
    try {
        const usersStr = localStorage.getItem(USERS_KEY);
        if (!usersStr) return [];
        const users = JSON.parse(usersStr);
        return Array.isArray(users) ? users : [];
    } catch (e) {
        console.error("Corrupted user data in localStorage", e);
        return [];
    }
  },

  saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser(): User | null {
    try {
        const userId = localStorage.getItem(CURRENT_USER_KEY);
        if (!userId) return null;
        
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            // ID exists but user doesn't - cleanup
            this.logout();
            return null;
        }
        
        // Data Migration & Safety Checks
        
        // 1. Revive dates
        if (user.chatHistory && Array.isArray(user.chatHistory)) {
            user.chatHistory = user.chatHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
        } else {
            user.chatHistory = [];
        }

        // 2. Merge Settings
        if (!user.settings) {
            user.settings = { ...DEFAULT_SETTINGS };
        } else {
            // Ensure all default fields exist in user settings
            user.settings = { ...DEFAULT_SETTINGS, ...user.settings };
        }

        return user;
    } catch (e) {
        console.error("Error retrieving current user", e);
        this.logout();
        return null;
    }
  },

  login(email: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
      return this.getCurrentUser(); // Return sanitized user
    }
    return null;
  },

  signup(name: string, email: string, password: string): User {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      settings: { ...DEFAULT_SETTINGS },
      chatHistory: []
    };

    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem(CURRENT_USER_KEY, newUser.id);
    return newUser;
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateUser(updatedUser: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }
};
