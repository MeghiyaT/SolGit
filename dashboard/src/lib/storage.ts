import fs from "node:fs";
import path from "node:path";
import { supabase } from "./supabase.ts";

export interface UserRecord {
  address: string;
  nickname: string;
  created_at?: string;
  updated_at?: string;
}

export interface RepoRecord {
  id: string;
  name: string;
  owner_address: string;
  owner_nickname: string;
  description: string;
  contract_address: string;
  tx_hash?: string;
  sol_code: string;
  facet_count: number;
  guardian_active: boolean;
  is_private: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LocalStoreData {
  users: Record<string, UserRecord>;
  repositories: RepoRecord[];
}

const isTestEnv = process.env.NODE_ENV === "test";
const testStore: LocalStoreData = { users: {}, repositories: [] };

function getStorePaths(): { dataDir: string; storeFile: string } {
  if (process.env.VERCEL) {
    const tmpDir = path.join("/tmp", "solgit-data");
    const tmpFile = path.join(tmpDir, "store.json");
    return { dataDir: tmpDir, storeFile: tmpFile };
  }

  const localDir = path.join(process.cwd(), "data");
  const localFile = path.join(localDir, "store.json");
  if (fs.existsSync(/*turbopackIgnore: true*/ localFile)) {
    return { dataDir: localDir, storeFile: localFile };
  }

  const dashDir = path.join(process.cwd(), "dashboard", "data");
  const dashFile = path.join(dashDir, "store.json");
  if (fs.existsSync(/*turbopackIgnore: true*/ dashFile)) {
    return { dataDir: dashDir, storeFile: dashFile };
  }

  const parentDir = path.join(process.cwd(), "..", "data");
  const parentFile = path.join(parentDir, "store.json");
  if (fs.existsSync(/*turbopackIgnore: true*/ parentFile)) {
    return { dataDir: parentDir, storeFile: parentFile };
  }

  return { dataDir: localDir, storeFile: localFile };
}

function ensureStoreFile(): LocalStoreData {
  if (isTestEnv) {
    return testStore;
  }
  const { dataDir, storeFile } = getStorePaths();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(/*turbopackIgnore: true*/ storeFile)) {
      const initial: LocalStoreData = { users: {}, repositories: [] };
      fs.writeFileSync(storeFile, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(/*turbopackIgnore: true*/ storeFile, "utf8");
    return JSON.parse(content) as LocalStoreData;
  } catch {
    return { users: {}, repositories: [] };
  }
}

function writeStoreFile(data: LocalStoreData): void {
  if (isTestEnv) {
    testStore.users = data.users;
    testStore.repositories = data.repositories;
    return;
  }
  const { dataDir, storeFile } = getStorePaths();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

export async function getUser(address: string): Promise<UserRecord | null> {
  const normAddress = address.toLowerCase();

  if (isTestEnv) {
    return testStore.users[normAddress] || null;
  }

  // 1. Attempt Supabase lookup
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("address", normAddress)
      .limit(1);

    if (!error && data && data.length > 0) {
      const user = data[0] as UserRecord;
      // sync to local store
      const local = ensureStoreFile();
      local.users[normAddress] = user;
      writeStoreFile(local);
      return user;
    }
  } catch {}

  // 2. Fallback to local store
  const local = ensureStoreFile();
  return local.users[normAddress] || null;
}

export async function saveUser(address: string, nickname: string): Promise<UserRecord> {
  const normAddress = address.toLowerCase();
  const now = new Date().toISOString();
  const userRecord: UserRecord = {
    address,
    nickname: nickname.trim(),
    created_at: now,
    updated_at: now,
  };

  if (isTestEnv) {
    testStore.users[normAddress] = userRecord;
    return userRecord;
  }

  // 1. Save to local store
  const local = ensureStoreFile();
  local.users[normAddress] = userRecord;
  writeStoreFile(local);

  // 2. Attempt Supabase upsert
  try {
    await supabase.from("users").upsert({
      address: userRecord.address,
      nickname: userRecord.nickname,
      updated_at: now,
    });
  } catch {}

  return userRecord;
}

export async function getRepositories(ownerAddress?: string): Promise<RepoRecord[]> {
  if (isTestEnv) {
    if (ownerAddress) {
      const norm = ownerAddress.toLowerCase();
      return testStore.repositories.filter((r) => r.owner_address.toLowerCase() === norm);
    }
    return testStore.repositories;
  }

  // 1. Attempt Supabase query
  try {
    let query = supabase.from("repositories").select("*").order("created_at", { ascending: false });
    if (ownerAddress) {
      query = query.ilike("owner_address", ownerAddress.toLowerCase());
    }
    const { data, error } = await query;
    if (!error && data && Array.isArray(data)) {
      // Merge remote data with local cache (dedup by id)
      const local = ensureStoreFile();
      const map = new Map<string, RepoRecord>();
      local.repositories.forEach((r) => map.set(r.id, r));
      data.forEach((r: RepoRecord) => map.set(r.id, r));
      const merged = Array.from(map.values());
      local.repositories = merged;
      writeStoreFile(local);
      if (ownerAddress) {
        return merged.filter((r) => r.owner_address.toLowerCase() === ownerAddress.toLowerCase());
      }
      return merged;
    }
  } catch {}

  // 2. Fallback to local store
  const local = ensureStoreFile();
  if (ownerAddress) {
    const norm = ownerAddress.toLowerCase();
    return local.repositories.filter((r) => r.owner_address.toLowerCase() === norm);
  }
  return local.repositories;
}

export async function saveRepository(repo: RepoRecord): Promise<RepoRecord> {
  const now = new Date().toISOString();
  const fullRepo: RepoRecord = {
    ...repo,
    created_at: repo.created_at || now,
    updated_at: now,
  };

  if (isTestEnv) {
    const existingIdx = testStore.repositories.findIndex((r) => r.id === fullRepo.id);
    if (existingIdx >= 0) {
      testStore.repositories[existingIdx] = fullRepo;
    } else {
      testStore.repositories.unshift(fullRepo);
    }
    return fullRepo;
  }

  // 1. Save to local store
  const local = ensureStoreFile();
  const existingIdx = local.repositories.findIndex((r) => r.id === fullRepo.id);
  if (existingIdx >= 0) {
    local.repositories[existingIdx] = fullRepo;
  } else {
    local.repositories.unshift(fullRepo);
  }
  writeStoreFile(local);

  // 2. Attempt Supabase insert
  try {
    await supabase.from("repositories").upsert(fullRepo);
  } catch {}

  return fullRepo;
}
