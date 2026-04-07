declare module "#auth-utils" {
  interface UserSession {
    user: {
      id: number;
      email: string;
      name: string | null;
    };
  }
}

export {};
