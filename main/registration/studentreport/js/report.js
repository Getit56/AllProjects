// -------------------- Firebase Setup --------------------
// ⚠️ SECURITY WARNING: The Firebase API Keys are exposed here.
// In a production environment, you MUST rely on Firebase Security Rules
// to protect your data. These keys grant public access to the databases.
const firebaseConfigStudents = {
  apiKey: "AIzaSyAoSRm7DKQB0bTRCKNELxbEVQA7y0hGgT4",
  authDomain: "school-registration-a9774.firebaseapp.com",
  databaseURL: "https://school-registration-a9774-default-rtdb.firebaseio.com",
  projectId: "school-registration-a9774",
  storageBucket: "school-registration-a9774.firebasestorage.app",
  messagingSenderId: "967547068125",
  appId: "1:967547068125:web:0a5708c69c84d1bac64534"
};

const firebaseConfigReports = {
  apiKey: "AIzaSyCjW6d-DL_yLZKyfAYI7ahPOfE5jFNWf18",
  authDomain: "report-155f1.firebaseapp.com",
  databaseURL: "https://report-155f1-default-rtdb.firebaseio.com",
  projectId: "report-155f1",
  storageBucket: "report-155f1.firebasestorage.app",
  messagingSenderId: "604452940303",
  appId: "1:604452940303:web:43fdd5d209c6e37330d17a"
};

// Initialize Firebase Apps
const studentsApp = firebase.initializeApp(firebaseConfigStudents, "studentsApp");
const reportsApp = firebase.initializeApp(firebaseConfigReports, "reportsApp");

const studentsDB = studentsApp.database().ref("students");
const reportsDB = reportsApp.database().ref("reports");

// -------------------- Main Logic --------------------
document.addEventListener('DOMContentLoaded', () => {
  const rows = document.querySelectorAll('.results-table tbody tr:not(.summary-row)');
  const summaryRow = document.querySelector('.results-table tbody tr.summary-row');

  const totalCSInput = summaryRow.cells[1].querySelector('input');
  const totalESInput = summaryRow.cells[2].querySelector('input');
  const totalTotalInput = summaryRow.cells[3].querySelector('input');
  const totalGradeInput = summaryRow.cells[4].querySelector('input');
  const totalPositionInput = summaryRow.cells[5].querySelector('input');
  const totalRemarkInput = summaryRow.cells[6].querySelector('input');
  
  [totalCSInput, totalESInput, totalTotalInput, totalGradeInput, totalPositionInput, totalRemarkInput].forEach(i => i.readOnly = true);

  const classPositionInput = document.getElementById('positionInClass');
  const overallPositionInput = document.getElementById('overallPosition');

  let studentVerified = false;
  let autoSaveTimer;
  let cachedStudents = null; 
  let currentListener = null;
  let currentStudentKey = null;

  const nameInput = document.getElementById('studentName');
  const classInput = document.getElementById('studentClass');

  // Status message elements setup
  const lastSavedMsg = document.createElement('div');
  lastSavedMsg.style.fontSize = '0.85em';
  lastSavedMsg.style.marginTop = '2px';
  nameInput.parentNode.appendChild(lastSavedMsg);

  const statusMsg = document.createElement('div');
  statusMsg.style.fontSize = '0.9em';
  statusMsg.style.marginTop = '2px';
  nameInput.parentNode.appendChild(statusMsg);

  const suggestionsBox = document.createElement('ul');
  suggestionsBox.classList.add('name-suggestions');
  nameInput.parentNode.style.position = 'relative';
  nameInput.parentNode.appendChild(suggestionsBox);

  let selectedSuggestion = -1;
  const SUBJECTS = Array.from(rows).map(r => r.cells[0].textContent);

  // -------------------- Helper Functions --------------------
  function getGradeRemark(total) {
    if (total >= 80) return { grade: 'A1', remark: 'Excellent', color: 'green' };
    if (total >= 70) return { grade: 'B2', remark: 'Very Good', color: 'green' };
    if (total >= 65) return { grade: 'B3', remark: 'Good', color: 'blue ' };
    if (total >= 60) return { grade: 'C4', remark: 'High Average', color: 'black' };
    if (total >= 50) return { grade: 'C5', remark: 'Average', color: 'goldenrod' };
    if (total >= 40) return { grade: 'C6', remark: 'Low Average', color: 'goldenrod' };
    if (total >= 30) return { grade: 'D7', remark: 'Pass', color: 'teal' };
    if (total >= 20) return { grade: 'E8', remark: 'Weak Pass', color: 'red' };
    return { grade: 'F9', remark: 'Failed', color: 'red' };
  }

  function ordinal(n) {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return n + "st";
    if (j === 2 && k !== 12) return n + "nd";
    if (j === 3 && k !== 13) return n + "rd";
    return n + "th";
  }

  function sanitizeKey(name) {
      return name.replace(/[.#$/[\]]/g, "_"); 
  }

  function disableAllInputs() {
    rows.forEach(r => { r.cells[1].querySelector('input').disabled = true; r.cells[2].querySelector('input').disabled = true; });
  }

  function enableAllInputs() {
    rows.forEach(r => { r.cells[1].querySelector('input').disabled = false; r.cells[2].querySelector('input').disabled = false; });
  }

  function clearAllFields() {
    rows.forEach(row => {
      for (let i = 1; i <= 6; i++) {
        const input = row.cells[i].querySelector('input');
        if (input) input.value = '';
      }
    });
    totalCSInput.value = '';
    totalESInput.value = '';
    totalTotalInput.value = '';
    totalGradeInput.value = '';
    totalPositionInput.value = '';
    totalRemarkInput.value = '';
    if (classPositionInput) classPositionInput.value = '';
    if (overallPositionInput) overallPositionInput.value = '';
    lastSavedMsg.textContent = '';
  }

  // UPDATED: Simply updates the calculated fields based on current input values.
  function updateSummary() {
    let totalCS = 0, totalES = 0, totalTotal = 0, count = 0;
    let sumPosition = 0, positionCount = 0;

    rows.forEach(row => {
      const cs = parseFloat(row.cells[1].querySelector('input').value) || 0;
      const es = parseFloat(row.cells[2].querySelector('input').value) || 0;
      const total = cs + es;
      row.cells[3].querySelector('input').value = total;

      const { grade, color } = getGradeRemark(total);
      row.cells[4].querySelector('input').value = grade;
      
      // We rely on the updatePositions logic to set the definitive remark (with tie info).
      // Here, we just ensure the color matches the grade.
      row.cells[6].querySelector('input').style.color = color;

      const posValue = parseInt(row.cells[5].querySelector('input').value) || 0;
      if (posValue > 0) { sumPosition += posValue; positionCount++; }

      totalCS += cs; totalES += es; totalTotal += total; count++;
    });

    const avgTotal = count ? totalTotal / count : 0;
    totalCSInput.value = totalCS;
    totalESInput.value = totalES;
    totalTotalInput.value = totalTotal;
    const { grade, remark, color } = getGradeRemark(avgTotal);
    totalGradeInput.value = grade;
    totalRemarkInput.value = remark;
    totalRemarkInput.style.color = color;

    totalPositionInput.value = positionCount ? ordinal(Math.round(sumPosition / positionCount)) : '';
  }

  // -------------------- Student Verification --------------------
  nameInput.addEventListener('input', async () => {
    const query = nameInput.value.trim().toLowerCase();
    suggestionsBox.innerHTML = '';
    studentVerified = false;
    statusMsg.textContent = '';
    disableAllInputs();
    selectedSuggestion = -1;
    if (query.length < 1) { currentListener && currentListener.off(); clearAllFields(); return; }

    try {
      if (!cachedStudents) {
        statusMsg.textContent = 'Loading student data...';
        const snapshot = await studentsDB.once('value');
        cachedStudents = new Map(
            Object.values(snapshot.val() || {})
            .map(s => {
                const fullName = `${s.firstName || ''} ${s.middleName || ''} ${s.surname || ''}`.trim();
                return [fullName, { fullName, classApplying: s.classApplying || '' }];
            })
        );
        statusMsg.textContent = '';
      }

      const matches = Array.from(cachedStudents.values())
        .filter(s => s.fullName.toLowerCase().startsWith(query))
        .slice(0, 6);

      matches.forEach(student => {
        const li = document.createElement('li');
        li.textContent = `${student.fullName} (${student.classApplying})`;
        li.addEventListener('click', async () => {
          if (currentListener) currentListener.off(); 
          clearAllFields();

          nameInput.value = student.fullName;
          classInput.value = student.classApplying;
          suggestionsBox.innerHTML = '';
          
          currentStudentKey = sanitizeKey(student.fullName);
          studentVerified = true;
          enableAllInputs();
          statusMsg.style.color = 'green';
          statusMsg.textContent = `Student "${student.fullName}" verified ✅`;
          
          startRealtimeSync(currentStudentKey); 
        });
        suggestionsBox.appendChild(li);
      });

      if (matches.length === 0) {
        statusMsg.style.color = 'red';
        statusMsg.textContent = 'No student found ❌';
      }
    } catch (err) { console.error("Error loading students:", err); statusMsg.textContent = 'Error loading students.'; }
  });

  // Autocomplete navigation
  nameInput.addEventListener('keydown', (e) => {
    const items = suggestionsBox.querySelectorAll('li');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestion = (selectedSuggestion + 1) % items.length;
      items.forEach((li, i) => li.classList.toggle('selected', i === selectedSuggestion));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSuggestion = (selectedSuggestion - 1 + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('selected', i === selectedSuggestion));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion >= 0 && items[selectedSuggestion]) items[selectedSuggestion].click();
    }
  });

  document.addEventListener('click', e => { if (!nameInput.contains(e.target)) suggestionsBox.innerHTML = ''; });

  // -------------------- Row Input Handling --------------------
  rows.forEach(row => {
    const csInput = row.cells[1].querySelector('input');
    const esInput = row.cells[2].querySelector('input');
    csInput.disabled = true;
    esInput.disabled = true;

    const updateRow = (e) => {
      if (!studentVerified) return;
      
      // NEW UPDATE: Ensure only numbers are entered
      if (e.target.value && isNaN(e.target.value)) {
          e.target.value = e.target.value.replace(/[^0-9.]/g, '');
      }

      let cs = parseFloat(csInput.value);
      let es = parseFloat(esInput.value);

      if (cs > 50) { csInput.value = 50; cs = 50; }
      if (es > 50) { esInput.value = 50; es = 50; }
      if (cs < 0) { csInput.value = 0; cs = 0; }
      if (es < 0) { esInput.value = 0; es = 0; }
      
      updateSummary();
      debounceAutoSave();
    };

    csInput.addEventListener('input', updateRow);
    esInput.addEventListener('input', updateRow);
  });

  // -------------------- Preload & Sync --------------------
  function loadReportToUI(data) {
    clearAllFields();
    if (!data) return;

    data.subjects.forEach((subj, i) => {
      if (rows[i] && subj.subject === rows[i].cells[0].textContent) {
        rows[i].cells[1].querySelector('input').value = subj.classScore || '';
        rows[i].cells[2].querySelector('input').value = subj.examScore || '';
        rows[i].cells[3].querySelector('input').value = subj.total || '';
        rows[i].cells[4].querySelector('input').value = subj.grade || '';
        rows[i].cells[5].querySelector('input').value = subj.position || '';
        rows[i].cells[6].querySelector('input').value = subj.remark || '';
      }
    });

    updateSummary();
    if (classPositionInput) classPositionInput.value = data.classPosition || '';
    if (overallPositionInput) overallPositionInput.value = data.overallPosition || '';
    lastSavedMsg.textContent = `Last saved at: ${data.lastSaved || ''}`;
  }

  function startRealtimeSync(studentKey) {
    if (currentListener) currentListener.off(); 
    currentListener = reportsDB.child(studentKey);
    currentListener.on('value', snapshot => {
      const data = snapshot.val();
      loadReportToUI(data);
    });
  }

  function debounceAutoSave() { 
    if (!studentVerified) return; 
    if (autoSaveTimer) clearTimeout(autoSaveTimer); 
    autoSaveTimer = setTimeout(autoSave, 700); 
  }

  // -------------------- Auto-save --------------------
  async function autoSave() {
    if (!studentVerified || !currentStudentKey) return;
    const studentName = nameInput.value.trim();

    const studentData = { 
        studentName, 
        studentClass: classInput.value, 
        lastSaved: new Date().toLocaleString(), 
        subjects: [] 
    };

    rows.forEach((row) => {
      studentData.subjects.push({
        subject: row.cells[0].textContent,
        classScore: parseFloat(row.cells[1].querySelector('input').value) || 0,
        examScore: parseFloat(row.cells[2].querySelector('input').value) || 0,
        total: parseFloat(row.cells[3].querySelector('input').value) || 0,
        grade: row.cells[4].querySelector('input').value || '',
        position: row.cells[5].querySelector('input').value || '',
        remark: row.cells[6].querySelector('input').value || ''
      });
    });
    
    await reportsDB.child(currentStudentKey).set(studentData);
    lastSavedMsg.textContent = `Saving...`;
    
    await updatePositions(currentStudentKey, studentData);
    // The lastSavedMsg update is handled by the real-time listener after the position update finishes.
  }

  // Function to compute rank with ties based on total score
  const computeRankWithTies = (reports) => {
    const arr = reports.map(r => {
      const totalScore = r.subjects.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
      return { key: r.key, name: r.studentName, totalScore, position: 0 };
    }).sort((a, b) => b.totalScore - a.totalScore);

    let lastScore = null, lastPos = 0, tieCount = 0;
    
    arr.forEach((s) => {
      if (lastScore !== null && Math.abs(s.totalScore - lastScore) < 0.01) {
        s.position = lastPos;
        tieCount++;
      } else {
        s.position = lastPos + tieCount + 1;
        lastPos = s.position;
        tieCount = 0;
      }
      lastScore = s.totalScore;
    });
    return arr;
  };

  // -------------------- Update Positions with Class-based Ties --------------------
  async function updatePositions(updatedStudentKey, currentStudentData) {
    const snapshot = await reportsDB.once('value');
    const allReports = snapshot.val() || {};

    const reportsArray = Object.entries(allReports).map(([key, data]) => ({ key, ...data }));
    const classReports = reportsArray.filter(r => r.studentClass === currentStudentData.studentClass);
    const overallReports = reportsArray;
    
    const reportsToUpdate = {};
    
    // 1. Compute Class and Overall Rank (Total Score)
    const classRankResults = computeRankWithTies(classReports);
    const overallRankResults = computeRankWithTies(overallReports);
    
    const classRank = classRankResults.find(s => s.key === updatedStudentKey);
    const overallRank = overallRankResults.find(s => s.key === updatedStudentKey);

    const newClassPosition = classRank ? `${ordinal(classRank.position)}/${classReports.length} students` : '';
    const newOverallPosition = overallRank ? `${ordinal(overallRank.position)}/${overallReports.length} students` : '';

    if (classPositionInput) classPositionInput.value = newClassPosition;
    if (overallPositionInput) overallPositionInput.value = newOverallPosition;
    
    reportsToUpdate[updatedStudentKey] = {
        ...currentStudentData,
        classPosition: newClassPosition,
        overallPosition: newOverallPosition
    };

    // 2. Compute Subject Positions and Tie Remarks
    SUBJECTS.forEach((subjectName) => {
      const subjectScores = classReports.map(r => {
        const score = r.subjects.find(s => s.subject === subjectName)?.total || 0;
        return { key: r.key, name: r.studentName, score: parseFloat(score) || 0, report: r };
      }).sort((a, b) => b.score - a.score);
      
      let rank = 1, i = 0;
      while (i < subjectScores.length) {
        const currentScore = subjectScores[i].score;
        const sameScores = subjectScores.filter(t => Math.abs(t.score - currentScore) < 0.01);
        const nextRank = rank + sameScores.length;

        sameScores.forEach(s => {
          const reportKey = s.key;
          
          const report = reportsToUpdate[reportKey] || reportsArray.find(r => r.key === reportKey);
          const subjToUpdate = report.subjects.find(subj => subj.subject === subjectName);
          
          if (subjToUpdate) {
            subjToUpdate.position = ordinal(rank);
            const { remark } = getGradeRemark(subjToUpdate.total);
            subjToUpdate.remark = sameScores.length > 1 ? `${remark} (tie)` : remark;
          }

          if (!reportsToUpdate[reportKey]) {
            reportsToUpdate[reportKey] = { ...report };
            reportsToUpdate[reportKey].classPosition = report.classPosition || '';
            reportsToUpdate[reportKey].overallPosition = report.overallPosition || '';
          }
          reportsToUpdate[reportKey].subjects = report.subjects;
        });

        rank = nextRank;
        i += sameScores.length;
      }
    });
    
    // 3. Batch Update all affected reports in Firebase
    const updates = {};
    Object.entries(reportsToUpdate).forEach(([key, data]) => {
        updates[`${key}/subjects`] = data.subjects;
        updates[`${key}/classPosition`] = data.classPosition;
        updates[`${key}/overallPosition`] = data.overallPosition;
        // Update lastSaved timestamp for the report being actively edited
        if(key === updatedStudentKey) {
             updates[`${key}/lastSaved`] = new Date().toLocaleString();
        }
    });

    if (Object.keys(updates).length > 0) {
        await reportsDB.update(updates);
    }
  }
});
