export type User = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: "student" | "teacher" | "admin";
  password?: string;   
};

export type UserDTO = Omit<User, "password">;