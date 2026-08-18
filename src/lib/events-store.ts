// Store de eventos/asistentes usando el backend de Netlify (Postgres).

import { getToken } from "@/lib/auth";

export interface AttendeeData {
  name: string;
  phone: string;
}

export interface EventData {
  id: string;
  title: string;
  date: string;
  meetingTime: string;
  meetingPoint: string;
  location: string;
  description: string;
  cancelled: boolean;
  attendees: AttendeeData[];
}

function api(path: string, method: string, body?: Record<string, unknown>) {
  const token = getToken();
  return fetch("/.netlify/functions/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ path, method, ...body }),
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Error en el servidor");
    return data;
  });
}

export const fetchEvents = async (): Promise<EventData[]> => {
  const data = await api("events", "GET");
  return (data.events || []) as EventData[];
};

export const addEvent = async (
  event: Omit<EventData, "id" | "attendees" | "cancelled">
): Promise<EventData> => {
  const data = await api("events", "POST", {
    title: event.title,
    date: event.date,
    meetingTime: event.meetingTime,
    meetingPoint: event.meetingPoint,
    location: event.location,
    description: event.description,
  });
  return { ...event, id: data.id, cancelled: false, attendees: [] };
};

export const setEventCancelled = async (id: string, cancelled: boolean): Promise<void> => {
  await api(`events/${id}`, "PATCH", { cancelled });
};

export const updateEvent = async (
  id: string,
  event: Omit<EventData, "id" | "attendees" | "cancelled">
): Promise<void> => {
  await api(`events/${id}`, "PATCH", {
    title: event.title,
    date: event.date,
    meetingTime: event.meetingTime,
    meetingPoint: event.meetingPoint,
    location: event.location,
    description: event.description,
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await api(`events/${id}`, "DELETE");
};

export const addAttendee = async (
  eventId: string,
  name: string,
  phone: string
): Promise<boolean> => {
  const data = await api("attendees", "POST", { eventId, name, phone });
  if (data.duplicated) return false;
  return true;
};
