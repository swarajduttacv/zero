
import { User, UserSettings, ChatMessage } from '../types';

const USERS_KEY = 'zerogpt_users';
const CURRENT_USER_KEY = 'zerogpt_current_user_id';

const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '', // User must fill this in Settings
  apiSecret: '',
  accessToken: 'DBBvkRbYPM11MkvMg3jL2HD6Ns2Mc3ha', // Pre-filled as requested
  passcode: '0000',
  isLiveMode: false,
  useProxy: true // Default to using proxy
};

export const AuthService = {
  getUsers(): User[] {
    const usersStr = localStorage.getItem(USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser(): User | null {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    
    // Revive dates in chat history
    if (user && user.chatHistory) {
        user.chatHistory = user.chatHistory.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
        }));
    }
    // Ensure settings has new fields if loaded from old localstorage
    if (user && user.settings && typeof user.settings.useProxy === 'undefined') {
        user.settings.useProxy = true;
    }
    return user || null;
  },

  login(email: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
      return user;
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
      settings: DEFAULT_SETTINGS,
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
