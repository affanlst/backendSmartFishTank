import { db, rtdb } from "@/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const statusRef = db.collection("drainageStatus").doc("status");
  const statusSnap = await statusRef.get();

  if (!statusSnap.exists) {
    return res.status(200).json({ message: "No status found." });
  }

  const data = statusSnap.data();

  if (!data) {
    return res.status(200).json({ message: "No status data found." });
  }

  const { lastStart, isRunning } = data;
  const now = Timestamp.now();

  const start = lastStart?.toDate?.() || new Date(lastStart);
  const diff = (now.toDate().getTime() - start.getTime()) / 60000;

  if (isRunning && diff >= 15) {
    await rtdb.ref("sensors/relay").set(0);
    await db.collection("drainageHistory").add({
      action: "Auto drainage stopped after 15 mins",
      timestamp: now,
    });
    await statusRef.set({ isRunning: false });

    return res.status(200).json({ message: "Relay turned off." });
  }

  res.status(200).json({ message: "Still running, less than 15 mins." });
}
