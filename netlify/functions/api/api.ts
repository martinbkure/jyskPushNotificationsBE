import express, { Request, Response } from "express";
import cors from "cors";
import apn from "apn";
import serverless from "serverless-http";
import { options } from "./push-settings";
import { getStore } from "@netlify/blobs";

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (
    req.headers["content-type"] === "application/json" &&
    Buffer.isBuffer(req.body)
  ) {
    try {
      const raw = req.body.toString("utf8");
      req.body = JSON.parse(raw);
    } catch {
      return res.status(400).send("Invalid JSON body");
    }
  }
  next();
});

const store = getStore({
  name: "push-notifications",
  siteID: "2faa76d4-84a4-47ee-8b8b-beffe0b94406",
  token: "nfp_p8LuKaPTw35iszpJSb3t3w36P1zwkk62fc9e",
});

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

const apnProvider = new apn.Provider(options);
const fallbackDeviceToken =
  "b4bcd2b6043d90f8ace9738bdf495b8b294f0ca876f1f350a41803b0df43e5d5";

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// Send APNs notification
app.post("/receivemessage", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (typeof message !== "string") {
    return res.status(400).json({ error: "message must be a string" });
  }

  const note = new apn.Notification();
  note.alert = message;
  note.sound = "ping.aiff";
  note.badge = 1;
  note.topic = "dk.creativecoders.JYSK-Notify";

  await apnProvider.send(note, fallbackDeviceToken);
  apnProvider.shutdown();

  return res.status(200).send("Message sent");
});

// Add or update a device token
app.post("/devices", async (req: Request, res: Response) => {
  const { deviceToken, userId, storeId } = req.body;
  if (!deviceToken || !userId || !storeId) {
    return res.status(400).send("Missing fields");
  }

  const key = `store:${storeId}:user:${userId}`;
  await store.set(key, deviceToken);

  return res.status(200).send("Device token stored");
});

// Get a device token
app.get("/devices", async (req: Request, res: Response) => {
  const { userId, storeId } = req.query;
  if (!userId || !storeId) {
    return res.status(400).send("Missing userId or storeId");
  }

  const key = `store:${storeId}:user:${userId}`;
  const token = await store.get(key);

  if (!token) return res.status(404).send("Token not found");
  return res.status(200).send(token);
});

// Delete a device token
app.delete("/devices", async (req: Request, res: Response) => {
  const { userId, storeId } = req.query;
  if (!userId || !storeId) {
    return res.status(400).send("Missing userId or storeId");
  }

  const key = `store:${storeId}:user:${userId}`;
  await store.delete(key);

  return res.status(200).send(`Deleted device token for user ${userId}`);
});

// List all device tokens
app.get("/devices/all", async (_req: Request, res: Response) => {
  const keys = await store.list();
  const results: Record<string, string> = {};

  for (const key of keys) {
    const token = await store.get(key);
    if (token) {
      results[key] = token;
    }
  }

  return res.status(200).json(results);
});

// Export Netlify handler
export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
  request: true,
});
