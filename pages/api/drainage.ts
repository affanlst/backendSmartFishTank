import { db, rtdb } from "@/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = Timestamp.now();
  const snapshot = await db.collection("drainageSchedules").get();

  const jobs = snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
    const diff = now.toDate().getTime() - timestamp.getTime();

    if (diff >= 0 && diff <= 2 * 60 * 1000) {
      await rtdb.ref("sensors/relay").set(1);
      await db.collection("drainageHistory").add({
        action: "Auto drainage started via Vercel",
        timestamp: now,
      });
      await db.collection("drainageSchedules").doc(doc.id).delete();

      await db.collection("drainageStatus").doc("status").set({
        lastStart: now,
        isRunning: true,
      });
    }
  });

  await Promise.all(jobs);
  res.status(200).json({ success: true, message: "Drainage schedule checked." });
}
