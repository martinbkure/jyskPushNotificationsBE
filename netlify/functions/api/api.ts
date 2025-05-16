import express, { Request, Response } from "express";
import cors from "cors";
import apn from "apn";
import serverless from "serverless-http";
import { options } from "./push-settings";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.resolve(__dirname, "devices.json");

const app = express();
app.use(cors());
app.use(express.json());

async function readStore(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeStore(data: Record<string, string>) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

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
  "/devices",
  async (
    req: Request<
      {},
      {},
      { deviceToken: string; userId: string; storeId: string }
    >,
    res: any
  ) => {
    const { deviceToken, userId, storeId } = req.body;
    console.log(req.body);
    if (!deviceToken || !userId || !storeId) {
      return res.status(400).send("Missing fields");
    }

    const key = `store:${storeId}:user:${userId}`;
    const store = await readStore();
    store[key] = deviceToken;
    await writeStore(store);

    return res.status(200).send("Device token updated");
  }
);

app.get(
  "/devices",
  async (
    req: Request<{}, {}, {}, { userId?: string; storeId?: string }>,
    res: any
  ) => {
    const { userId, storeId } = req.query;

    if (!userId || !storeId) {
      return res.status(400).send("Missing userId or storeId");
    }

    const key = `store:${storeId}:user:${userId}`;
    const store = await readStore();
    const token = store[key];

    if (!token) return res.status(404).send("Not found");
    return res.status(200).send(token);
  }
);

app.delete(
  "/devices",
  async (
    req: Request<{}, {}, {}, { userId?: string; storeId?: string }>,
    res: any
  ) => {
    const { userId, storeId } = req.query;

    if (!userId || !storeId) {
      return res.status(400).send("Missing userId or storeId");
    }

    const key = `store:${storeId}:user:${userId}`;
    const store = await readStore();

    if (!store[key]) {
      return res.status(404).send("Token not found");
    }

    delete store[key];
    await writeStore(store);

    return res.status(200).send(`Deleted device token for user ${userId}`);
  }
);

app.get("/devices/all", async (_req: Request, res: any) => {
  const store = await readStore();
  return res.status(200).send(store);
});

export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
