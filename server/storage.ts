import { prds, type Prd, type InsertPrd, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // PRD operations
  getPrd(id: number): Promise<Prd | undefined>;
  getAllPrds(): Promise<Prd[]>;
  createPrd(prd: InsertPrd): Promise<Prd>;
  updatePrd(id: number, updates: Partial<InsertPrd>): Promise<Prd | undefined>;
  deletePrd(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private prds: Map<number, Prd>;
  private currentUserId: number;
  private currentPrdId: number;

  constructor() {
    this.users = new Map();
    this.prds = new Map();
    this.currentUserId = 1;
    this.currentPrdId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPrd(id: number): Promise<Prd | undefined> {
    return this.prds.get(id);
  }

  async getAllPrds(): Promise<Prd[]> {
    return Array.from(this.prds.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createPrd(insertPrd: InsertPrd): Promise<Prd> {
    const id = this.currentPrdId++;
    const prd: Prd = {
      ...insertPrd,
      id,
      createdAt: new Date(),
    };
    this.prds.set(id, prd);
    return prd;
  }

  async updatePrd(id: number, updates: Partial<InsertPrd>): Promise<Prd | undefined> {
    const existing = this.prds.get(id);
    if (!existing) return undefined;
    
    const updated: Prd = { ...existing, ...updates };
    this.prds.set(id, updated);
    return updated;
  }

  async deletePrd(id: number): Promise<boolean> {
    return this.prds.delete(id);
  }
}

export const storage = new MemStorage();
