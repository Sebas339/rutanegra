import { Client, Databases, ID, Permission, Role } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "6a74eb5d00352efbb42c")
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "6a74eb9800061d4c7979";

// Public access: the web (client SDK) runs WITHOUT an API key, so collections
// must allow role "any" to read and write in order for the site to work.
const PUBLIC = [
  Permission.read(Role.any()),
  Permission.write(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

async function recreate(name, attrs, indexName, indexAttr) {
  // 1. delete if exists (empty collections — safe)
  try {
    await databases.deleteCollection(DATABASE_ID, name);
    console.log(`${name}: borrada (existía)`);
  } catch (e) {
    console.log(`${name}: no existía o no se pudo borrar ->`, e?.message);
  }

  // 2. create with PUBLIC permissions and documentSecurity=false
  //    (so documents INHERIT the collection permissions -> anonymous client works)
  try {
    await databases.createCollection(DATABASE_ID, name, name, PUBLIC, false, true);
    console.log(`${name}: creada con permisos públicos`);
  } catch (e) {
    console.log(`${name}: error al crear ->`, e?.message);
    return;
  }

  // 3. attributes
  for (const attr of attrs) {
    try {
      await attr();
      console.log(`  ${name}: atributo ok`);
    } catch (e) {
      console.log(`  ${name}: atributo ->`, e?.message);
    }
  }

  // 4. index (with retries, attributes are async in Appwrite)
  for (let i = 0; i < 6; i++) {
    try {
      await databases.createIndex(DATABASE_ID, name, indexName, "key", [indexAttr]);
      console.log(`  ${name}: index ${indexName} OK`);
      return;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000));
      if (i === 5) console.log(`  ${name}: index ->`, e?.message);
    }
  }
}

async function main() {
  await recreate(
    "events",
    [
      () => databases.createStringAttribute(DATABASE_ID, "events", "title", 255, true),
      () => databases.createStringAttribute(DATABASE_ID, "events", "date", 255, true),
      () => databases.createStringAttribute(DATABASE_ID, "events", "meetingTime", 20, true),
      () => databases.createStringAttribute(DATABASE_ID, "events", "meetingPoint", 255, true),
      () => databases.createStringAttribute(DATABASE_ID, "events", "location", 255, false),
      () => databases.createStringAttribute(DATABASE_ID, "events", "description", 5000, false),
      () => databases.createBooleanAttribute(DATABASE_ID, "events", "cancelled", true),
    ],
    "date_index",
    "date"
  );

  await recreate(
    "attendees",
    [
      () => databases.createStringAttribute(DATABASE_ID, "attendees", "event_id", 255, true),
      () => databases.createStringAttribute(DATABASE_ID, "attendees", "name", 255, true),
    ],
    "event_index",
    "event_id"
  );

  console.log("LISTO");
}

main()
  .then(() => console.log("Terminado"))
  .catch((e) => {
    console.error("ERROR:", e?.message || e);
    process.exit(1);
  });