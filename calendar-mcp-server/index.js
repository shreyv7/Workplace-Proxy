const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Supabase configuration
const SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Convert "HH:MM" string to ISO string for a specific date
function timeToIsoString(timeStr, baseDate = new Date()) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(baseDate);
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toISOString();
}

// Map frontend calendar block types to backend schema BlockTypes
function mapBlockType(type) {
  switch (type) {
    case "focus":
      return "deep_work";
    case "task":
      return "shallow_work";
    case "meeting":
      return "meeting";
    default:
      return "admin";
  }
}

// ── Health Check ──
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Calendar MCP Server" });
});

// ── Retrieve Today's Blocks ──
app.get("/calendar/today", async (req, res) => {
  try {
    const { data: blocks, error } = await supabase
      .from("calendar_blocks")
      .select("*")
      .order("start", { ascending: true });

    if (error) throw error;

    const todayDate = new Date();
    const mapped = blocks.map((b) => ({
      start: timeToIsoString(b.start, todayDate),
      end: timeToIsoString(b.end, todayDate),
      block_type: mapBlockType(b.type),
      is_available: false,
      title: b.title,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Error reading calendar:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Find Slot ──
app.post("/calendar/find-slot", async (req, res) => {
  try {
    const { duration_minutes, preferred_after, block_type } = req.body;
    
    // Default search window: starting from preferred_after or 09:00 today
    let searchStart = preferred_after ? new Date(preferred_after) : new Date();
    if (searchStart.getUTCHours() < 9) {
      searchStart.setUTCHours(9, 0, 0, 0);
    }

    // Fetch existing blocks to check conflicts
    const { data: blocks } = await supabase
      .from("calendar_blocks")
      .select("*");

    const todayDate = new Date();
    const busyIntervals = (blocks || []).map((b) => ({
      start: new Date(timeToIsoString(b.start, todayDate)),
      end: new Date(timeToIsoString(b.end, todayDate)),
    }));

    // Find next available slot during working hours (09:00 - 18:00)
    let foundSlot = null;
    let currentCandidate = new Date(searchStart);

    // Keep checking up to 3 days in advance
    for (let day = 0; day < 3; day++) {
      const workdayEnd = new Date(currentCandidate);
      workdayEnd.setUTCHours(18, 0, 0, 0);

      while (currentCandidate.getTime() + duration_minutes * 60 * 1000 <= workdayEnd.getTime()) {
        const candidateStart = new Date(currentCandidate);
        const candidateEnd = new Date(currentCandidate.getTime() + duration_minutes * 60 * 1000);

        // Check if overlaps with any busy block
        const hasConflict = busyIntervals.some((busy) => {
          return candidateStart < busy.end && candidateEnd > busy.start;
        });

        if (!hasConflict) {
          foundSlot = { start: candidateStart, end: candidateEnd };
          break;
        }

        // Increment by 15-minute intervals to find next free spot
        currentCandidate.setTime(currentCandidate.getTime() + 15 * 60 * 1000);
      }

      if (foundSlot) break;

      // Roll forward to 09:00 the next day
      currentCandidate.setDate(currentCandidate.getDate() + 1);
      currentCandidate.setUTCHours(9, 0, 0, 0);
    }

    // If still no slot is found, fall back to next hour
    if (!foundSlot) {
      const fallbackStart = new Date();
      fallbackStart.setUTCHours(fallbackStart.getUTCHours() + 1, 0, 0, 0);
      foundSlot = {
        start: fallbackStart,
        end: new Date(fallbackStart.getTime() + duration_minutes * 60 * 1000),
      };
    }

    res.json({
      start: foundSlot.start.toISOString(),
      end: foundSlot.end.toISOString(),
      block_type: block_type || "shallow_work",
      is_available: true,
      title: "Proposed Action Block",
    });

  } catch (err) {
    console.error("Error finding slot:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Calendar MCP Server running on port ${PORT}`);
});
