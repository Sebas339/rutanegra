import { Client, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "6a74eb5d00352efbb42c");

export const databases = new Databases(client);

export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "6a74eb9800061d4c7979";
export const APPWRITE_EVENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_EVENTS_COLLECTION_ID || "events";
export const APPWRITE_ATTENDEES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ATTENDEES_COLLECTION_ID || "attendees";
