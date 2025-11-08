// ✅ ai-core.js — Voice Only Version
// St. Joseph Preparatory School Assistant
console.log("AI Assistant initialized.");

const aiBtn = document.getElementById("ai-speaker");
let isListening = false;
let voices = [];

// --- Load voices properly before speaking ---
function loadVoices() {
  return new Promise((resolve) => {
    let synth = window.speechSynthesis;
    let id;
    id = setInterval(() => {
      voices = synth.getVoices();
      if (voices.length !== 0) {
        clearInterval(id);
        resolve(voices);
      }
    }, 50);
  });
}

// --- Speak function (waits for voices to load) ---
async function speak(text) {
  await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.voice =
    voices.find((v) => v.name.includes("Google")) ||
    voices.find((v) => v.lang === "en-US") ||
    voices[0];
  console.log("Speaking:", text);
  window.speechSynthesis.speak(utterance);
}

// --- Speech recognition setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => console.log("🎤 Listening...");
  recognition.onend = () => {
    aiBtn.classList.remove("listening");
    isListening = false;
  };
  recognition.onerror = (e) => {
    console.error("Recognition error:", e);
    speak("Sorry, I couldn't hear you. Please try again.");
  };

  recognition.onresult = (e) => {
    const userSpeech = e.results[0][0].transcript.toLowerCase();
    console.log("Heard:", userSpeech);
    respondToCommand(userSpeech);
  };
} else {
  alert("Speech recognition not supported in this browser.");
}

// --- Commands ---
function respondToCommand(text) {
  let reply = "Sorry, I didn’t understand that. Please say 'open registration' or 'show report card'.";

  if (text.includes("hello") || text.includes("hi")) reply = "Hello! Welcome to Saint Joseph Preparatory School.";
  else if (text.includes("register")) reply = "Opening registration page.";
  else if (text.includes("report")) reply = "Opening student report.";
  else if (text.includes("fees")) reply = "Opening the school fees section.";
  else if (text.includes("teacher")) reply = "Opening teacher application form.";
  else if (text.includes("canteen")) reply = "Opening canteen dashboard.";
  else if (text.includes("thank")) reply = "You're welcome!";

  speak(reply);

  // Optional navigation
  if (text.includes("register")) window.open("registration/index.html", "_blank");
  if (text.includes("report")) window.open("studentreport/index.html", "_blank");
  if (text.includes("fees")) window.open("registration/fees.html", "_blank");
  if (text.includes("teacher")) window.open("registration/teacherform.html", "_blank");
  if (text.includes("canteen")) window.open("registration/canteen.html", "_blank");
}

// --- Button logic ---
aiBtn.addEventListener("click", async () => {
  if (!recognition) {
    speak("Your browser doesn't support voice recognition.");
    return;
  }

  if (!isListening) {
    isListening = true;
    aiBtn.classList.add("listening");
    await speak("Hello! I am your school assistant. What would you like to do?");
    recognition.start();
  } else {
    recognition.stop();
    isListening = false;
    aiBtn.classList.remove("listening");
    speak("Stopped listening.");
  }
});
