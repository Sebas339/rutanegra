import { ID, Query } from "appwrite";
import {
  databases,
  APPWRITE_DATABASE_ID,
  APPWRITE_EVENTS_COLLECTION_ID,
  APPWRITE_ATTENDEES_COLLECTION_ID,
} from "@/integrations/appwrite/client";

export interface EventData {
  id: string;
  title: string;
  date: string;
  meetingTime: string;
  meetingPoint: string;
  location: string;
  description: string;
  cancelled: boolean;
  attendees: string[];
}

export const fetchEvents = async (): Promise<EventData[]> => {
  try {
    const eventsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_EVENTS_COLLECTION_ID,
      [Query.orderAsc("date")]
    );

    const attendeesResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_ATTENDEES_COLLECTION_ID,
      [Query.limit(1000)]
    );

    const attendeesMap: Record<string, string[]> = {};
    for (const doc of attendeesResponse.documents) {
      const eventId = doc.event_id || doc.eventId;
      if (eventId) {
        if (!attendeesMap[eventId]) {
          attendeesMap[eventId] = [];
        }
        attendeesMap[eventId].push(doc.name);
      }
    }

    return eventsResponse.documents.map((doc: any) => {
      const meetingTime = doc.meetingTime || doc.meeting_time || "";
      const meetingPoint = doc.meetingPoint || doc.meeting_point || "";
      return {
        id: doc.$id,
        title: doc.title || "",
        date: doc.date || "",
        meetingTime,
        meetingPoint,
        location: doc.location || "",
        description: doc.description || "",
        cancelled: !!doc.cancelled,
        attendees: attendeesMap[doc.$id] || [],
      };
    });
  } catch (error) {
    console.error("Error fetching events from Appwrite:", error);
    throw error;
  }
};

export const addEvent = async (
  event: Omit<EventData, "id" | "attendees" | "cancelled">
): Promise<EventData> => {
  try {
    const payload: Record<string, any> = {
      title: event.title,
      date: event.date,
      meetingTime: event.meetingTime,
      meetingPoint: event.meetingPoint,
      location: event.location,
      description: event.description,
      cancelled: false,
    };

    const data = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_EVENTS_COLLECTION_ID,
      ID.unique(),
      payload
    );

    return {
      id: data.$id,
      title: data.title,
      date: data.date,
      meetingTime: data.meetingTime || data.meeting_time || "",
      meetingPoint: data.meetingPoint || data.meeting_point || "",
      location: data.location,
      description: data.description,
      cancelled: !!data.cancelled,
      attendees: [],
    };
  } catch (error) {
    console.error("Error adding event to Appwrite:", error);
    throw error;
  }
};

export const setEventCancelled = async (id: string, cancelled: boolean): Promise<void> => {
  try {
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_EVENTS_COLLECTION_ID,
      id,
      { cancelled }
    );
  } catch (error) {
    console.error("Error setting event cancelled in Appwrite:", error);
    throw error;
  }
};

export const updateEvent = async (
  id: string,
  event: Omit<EventData, "id" | "attendees" | "cancelled">
): Promise<void> => {
  try {
    const payload: Record<string, any> = {
      title: event.title,
      date: event.date,
      meetingTime: event.meetingTime,
      meetingPoint: event.meetingPoint,
      location: event.location,
      description: event.description,
    };

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_EVENTS_COLLECTION_ID,
      id,
      payload
    );
  } catch (error) {
    console.error("Error updating event in Appwrite:", error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_EVENTS_COLLECTION_ID,
      id
    );

    // Optional: Clean up associated attendees
    const attendeesResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_ATTENDEES_COLLECTION_ID,
      [Query.equal("event_id", id)]
    );

    for (const doc of attendeesResponse.documents) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ATTENDEES_COLLECTION_ID,
        doc.$id
      );
    }
  } catch (error) {
    console.error("Error deleting event in Appwrite:", error);
    throw error;
  }
};

export const addAttendee = async (
  eventId: string,
  name: string
): Promise<boolean> => {
  try {
    // Check if the attendee name is already registered for this event
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_ATTENDEES_COLLECTION_ID,
      [Query.equal("event_id", eventId), Query.equal("name", name)]
    );

    if (existing.documents.length > 0) {
      return false; // already registered
    }

    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_ATTENDEES_COLLECTION_ID,
      ID.unique(),
      {
        event_id: eventId,
        name,
      }
    );

    return true;
  } catch (error) {
    console.error("Error adding attendee in Appwrite:", error);
    throw error;
  }
};
