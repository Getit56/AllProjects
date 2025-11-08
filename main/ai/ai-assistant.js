// ai/ai-assistant.js
// --- PadBot 3.0 Assistant Logic ---
window.addEventListener("load", () => {
  if (!window.PadBotAI) {
    console.error("PadBot Core not loaded.");
    return;
  }

  async function handleAIQuery(command) {
    const lower = command.toLowerCase();
    let response = "I'm not sure what you mean.";

    if (lower.includes("student")) {
      const students = await PadBotAI.getStudentData();
      const count = Object.keys(students).length;
      response = `There are currently ${count} registered students in the database.`;
    } else if (lower.includes("teacher")) {
      const teachers = await PadBotAI.getTeacherData();
      const count = Object.keys(teachers).length;
      response = `There are ${count} teachers in the school records.`;
    } else if (lower.includes("canteen")) {
      const orders = await PadBotAI.getCanteenOrders();
      const count = Object.keys(orders).length;
      response = `There are ${count} active canteen orders right now.`;
    } else if (lower.includes("report")) {
      const reports = await PadBotAI.getReports();
      const count = Object.keys(reports).length;
      response = `There are ${count} student reports available.`;
    } else if (lower.includes("who are you")) {
      response = "I am PadBot 3.0, the St. Joseph Preparatory School assistant connected to the main system.";
    }

    if (typeof speak === "function") speak(response);
    else alert(response);
  }

  window.processAICommand = handleAIQuery;
  console.log("[PadBot] Assistant loaded successfully.");
});
