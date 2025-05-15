import express, { Request, Response } from "express";
import cors from "cors";
import apn from "apn";
import serverless from "serverless-http";
import { options } from "./push-settings";
import { getStore } from "@netlify/blobs";

const store = getStore({ name: "device-tokens", consistency: "strong" });

const app = express();
app.use(cors());

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

const apnProvider = new apn.Provider(options);
const deviceToken =
  "b4bcd2b6043d90f8ace9738bdf495b8b294f0ca876f1f350a41803b0df43e5d5";

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.post("/receivemessage", (req: express.Request, res: any) => {
  const { message } = req.body;
  if (typeof message !== "string") {
    return res.status(400).json({ error: "message must be a string" });
  }

  const note = new apn.Notification();
  note.alert = message;
  note.sound = "ping.aiff";
  note.badge = 1;
  note.topic = "dk.creativecoders.JYSK-Notify";

  apnProvider.send(note, deviceToken).then((result) => {
    console.log(result, result.failed);
    apnProvider.shutdown();
    return res.status(200).send("Message sent");
  });
});

app.post(
  "/api/devices",
  async (
    req: Request<
      {},
      {},
      { deviceToken: string; userId: string; storeId: string }
    >,
    res: any
  ) => {
    const { deviceToken, userId, storeId } = req.body;
    const key = `store:${storeId}:user:${userId}`;
    await store.set(key, deviceToken);
    return res.status(200).send("Device token updated");
  }
);

app.get(
  "/api/devices",
  async (
    req: Request<{}, {}, { userId: string; storeId: string }>,
    res: any
  ) => {
    const { userId, storeId } = req.query;

    if (!userId || !storeId) {
      return res.status(400).send("Missing userId or storeId");
    }

    const key = `store:${storeId}:user:${userId}`;
    const token = await store.get(key);

    return res.status(200).send(token);
  }
);

app.delete(
  "/api/devices",
  async (
    req: Request<{}, {}, {}, { userId?: string; storeId?: string }>,
    res: any
  ) => {
    const { userId, storeId } = req.query;

    if (!userId || !storeId) {
      return res.status(400).send("Missing userId or storeId");
    }

    const key = `store:${storeId}:user:${userId}`;
    await store.delete(key);

    return res.status(200).send(`Deleted device token for user ${userId}`);
  }
);

app.get("/api/devices/all", async (req: Request, res: any) => {
  const keys = await store.list();
  return res.status(200).send(keys);
});

export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
