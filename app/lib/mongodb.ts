import { MongoClient } from "mongodb";

const mongoUrl: string = process.env.MONGO_URI || "";

const client = new MongoClient(mongoUrl);

let cachedClient: any = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  await client.connect();
  const db = client.db();
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}
