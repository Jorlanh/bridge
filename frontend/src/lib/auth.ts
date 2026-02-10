const TOKEN_KEY = "bridgeai_token";
const USER_KEY = "bridgeai_user";

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

export const auth = {
  setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setUser(user: User) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = sessionStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

