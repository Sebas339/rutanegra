import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "6a74eb5d00352efbb42c")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "6a74eb9800061d4c7979";

async function ensureIndexes() {
  try {
    await databases.createIndex(DATABASE_ID, "events", "date_index", "key", ["date"]);
    console.log("index date_index OK");
  } catch (e) {
    console.log("index date_index:", e?.message);
  }
  try {
    await databases.createIndex(DATABASE_ID, "attendees", "event_index", "key", ["event_id"]);
    console.log("index event_index OK");
  } catch (e) {
    console.log("index event_index:", e?.message);
  }
}

ensureIndexes()
  .then(() => console.log("Done"))
  .catch((e) => {
    console.error("ERROR:", e?.message || e);
    process.exit(1);
  });