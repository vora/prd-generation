import { InsertPrd, InsertUser, Prd, PrdContent, User } from "@shared/schema";

// Temporary Epic types for memory storage
interface EpicRecord {
  id: number;
  prdId: number;
  title: string;
  content: any;
  processingTime: number | null;
  createdAt: Date;
}

interface InsertEpic {
  prdId: number;
  title: string;
  content: any;
  processingTime?: number | null;
}

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

  // Epic operations
  getEpic(id: number): Promise<EpicRecord | undefined>;
  getEpicsByPrdId(prdId: number): Promise<EpicRecord[]>;
  createEpic(epic: InsertEpic): Promise<EpicRecord>;
  updateEpic(
    id: number,
    updates: Partial<InsertEpic>
  ): Promise<EpicRecord | undefined>;
  deleteEpic(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private prds: Map<number, Prd>;
  private epics: Map<number, EpicRecord>;
  private currentUserId: number;
  private currentPrdId: number;
  private currentEpicId: number;

  constructor() {
    this.users = new Map();
    this.prds = new Map();
    this.epics = new Map();
    this.currentUserId = 1;
    this.currentPrdId = 1;
    this.currentEpicId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
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
    return Array.from(this.prds.values());
  }

  async createPrd(insertPrd: InsertPrd): Promise<Prd> {
    const id = this.currentPrdId++;
    const prd: Prd = {
      ...insertPrd,
      id,
      status: insertPrd.status || "draft",
      processingTime: insertPrd.processingTime || null,
      originalFileName: insertPrd.originalFileName || null,
      createdAt: new Date(),
      content: insertPrd.content as PrdContent,
    };
    this.prds.set(id, prd);
    return prd;
  }

  async updatePrd(
    id: number,
    updates: Partial<InsertPrd>
  ): Promise<Prd | undefined> {
    const existing = this.prds.get(id);
    if (!existing) return undefined;

    const updated: Prd = {
      ...existing,
      ...updates,
      content: { ...existing.content, ...updates.content } as PrdContent,
    };
    this.prds.set(id, updated);
    return updated;
  }

  async deletePrd(id: number): Promise<boolean> {
    return this.prds.delete(id);
  }

  async getEpic(id: number): Promise<EpicRecord | undefined> {
    return this.epics.get(id);
  }

  async getEpicsByPrdId(prdId: number): Promise<EpicRecord[]> {
    return Array.from(this.epics.values()).filter(
      (epic) => epic.prdId === prdId
    );
  }

  async createEpic(insertEpic: InsertEpic): Promise<EpicRecord> {
    const id = this.currentEpicId++;
    const epic: EpicRecord = {
      ...insertEpic,
      id,
      processingTime: insertEpic.processingTime || null,
      createdAt: new Date(),
    };
    this.epics.set(id, epic);
    return epic;
  }

  async updateEpic(
    id: number,
    updates: Partial<InsertEpic>
  ): Promise<EpicRecord | undefined> {
    const existing = this.epics.get(id);
    if (!existing) return undefined;

    const updated: EpicRecord = { ...existing, ...updates };
    this.epics.set(id, updated);
    return updated;
  }

  async deleteEpic(id: number): Promise<boolean> {
    return this.epics.delete(id);
  }
}

export const storage = new MemStorage();
