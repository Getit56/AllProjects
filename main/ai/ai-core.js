// ai/ai-core.js
// --- PadBot 3.0 Core AI Module ---
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyAoSRm7DKQB0bTRCKNELxbEVQA7y0hGgT4",
  authDomain: "school-registration-a9774.firebaseapp.com",
  databaseURL: "https://school-registration-a9774-default-rtdb.firebaseio.com",
  projectId: "school-registration-a9774",
  storageBucket: "school-registration-a9774.appspot.com",
  messagingSenderId: "740384115425",
  appId: "1:740384115425:web:e68b3f75eae7275b865bfa"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- AI Brain ---
const PadBotAI = {
  async getStudentData() {
    const snap = await get(ref(db, "students"));
    return snap.exists() ? snap.val() : {};
  },
  async getTeacherData() {
    const snap = await get(ref(db, "teachers"));
    return snap.exists() ? snap.val() : {};
  },
  async getCanteenOrders() {
    const snap = await get(ref(db, "canteen"));
    return snap.exists() ? snap.val() : {};
  },
  async getReports() {
    const snap = await get(ref(db, "reports"));
    return snap.exists() ? snap.val() : {};
  },
  log: (msg) => console.log("%c[PadBot]", "color:blue;font-weight:bold", msg)
};

window.PadBotAI = PadBotAI;
PadBotAI.log("AI Core connected successfully.");
