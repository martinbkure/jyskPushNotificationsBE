import express, { Request, Response } from "express";
import cors from "cors";
import apn from "apn";
import serverless from "serverless-http";
import { options } from "./push-settings";

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

export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
