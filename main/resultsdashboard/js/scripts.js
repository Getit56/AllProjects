// admin-dashboard.js

// -------------------- 1. SUBJECT LIST (EXACT MATCH TO ENTRY TOOL DATA STRUCTURE) --------------------
// This list MUST match the subjects used in your report card entry form.
const ACADEMIC_SUBJECTS = [
    "English",
    "Mathematics",
    "R.M.E",
    "Science",
    "Computing",
    "History",
    "Creative Arts",
    "Ghanaian Language"
];

// -------------------- 2. Firebase Setup (Reports DB) --------------------
// Using the Reports DB config provided in the Report Entry Tool code
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
const reportsApp = firebase.initializeApp(firebaseConfigReports, "reportsApp");
const reportsDB = reportsApp.database().ref("reports");

let allReportsData = [];

// -------------------- 3. Core Logic --------------------

document.addEventListener('DOMContentLoaded', () => {
    const dashboardStatsElement = document.getElementById('dashboardStats');
    if (dashboardStatsElement) {
        loadDashboardData();
    }
});

/**
 * Fetches all reports and sets up the initial dashboard view.
 */
async function loadDashboardData() {
    const containerElement = document.getElementById('dashboardStats');
    containerElement.innerHTML = '<h2>Loading School Performance Data...</h2>';
    
    try {
        const snapshot = await reportsDB.once('value');
        const allReports = snapshot.val() || {};
        allReportsData = Object.values(allReports);

        if (allReportsData.length === 0) {
            containerElement.innerHTML = '<h2>No student report data available.</h2>';
            return;
        }
        
        setupDashboardFilters();
        
        // Initial render with 'All Classes' and default threshold
        const initialThreshold = parseInt(document.getElementById('weakThreshold').value) || 50;
        filterAndRender(allReportsData, "All Classes", initialThreshold);

    } catch (error) {
        console.error("Error fetching or calculating dashboard data:", error);
        containerElement.innerHTML = '<h2>Error loading data. Check console for details.</h2>';
    }
}

/**
 * Creates the interactive filter elements (class dropdown, threshold input).
 */
function setupDashboardFilters() {
    const filterContainer = document.getElementById('filterContainer');
    if (!filterContainer) return;

    // Dynamically find all unique classes in the database
    const uniqueClasses = [...new Set(allReportsData.map(r => r.studentClass).filter(c => c))].sort();

    const classFilterHTML = `
        <label for="classFilter">Filter by Class:</label>
        <select id="classFilter">
            <option value="All">All Classes</option>
            ${uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
    `;

    const weakThresholdHTML = `
        <label for="weakThreshold">Weak Student Threshold (Avg. Score):</label>
        <input type="number" id="weakThreshold" value="50" min="10" max="100" style="width: 60px;">
    `;

    filterContainer.innerHTML = classFilterHTML + weakThresholdHTML;

    // Attach Event Listeners to trigger data processing on change/input
    const eventHandler = () => {
        const selectedClass = document.getElementById('classFilter').value;
        const threshold = parseInt(document.getElementById('weakThreshold').value) || 50;
        let filteredReports = allReportsData;
        if (selectedClass !== 'All') {
            filteredReports = allReportsData.filter(r => r.studentClass === selectedClass);
        }
        filterAndRender(filteredReports, selectedClass, threshold);
    };

    document.getElementById('classFilter').addEventListener('change', eventHandler);
    document.getElementById('weakThreshold').addEventListener('input', eventHandler);
}

/**
 * Filters the data (if needed), calculates statistics, and updates the UI.
 */
function filterAndRender(reports, context, threshold) {
    if (reports.length === 0) {
        document.getElementById('dashboardStats').innerHTML = `<h2 style="color:red;">No reports available for ${context}.</h2>`;
        return;
    }

    const filteredStats = calculateSchoolStatistics(reports);
    filteredStats.weakStudents = identifyWeakStudents(reports, threshold);
    filteredStats.bestStudents = identifyBestStudents(reports);

    renderStatistics(filteredStats, context);
}

// -------------------- 4. Calculation Functions --------------------

/**
 * Calculates core school performance metrics (Averages, Subject Failure Rates, Class Ranks).
 */
function calculateSchoolStatistics(reportsArray) {
    const totalStudents = reportsArray.length;
    if (totalStudents === 0) return {};
    
    const classPerformance = {}; 
    const subjectPerformance = {}; 
    let overallTotalScore = 0;
    const subjectCount = ACADEMIC_SUBJECTS.length; // Use constant subject count

    reportsArray.forEach(report => {
        const studentClass = report.studentClass || 'Unassigned';
        let studentTotalScore = 0;

        report.subjects.forEach(subject => {
            const total = parseFloat(subject.total) || 0;
            const subjectName = subject.subject;
            studentTotalScore += total;

            // Only track statistics for defined subjects
            if (ACADEMIC_SUBJECTS.includes(subjectName)) {
                if (!subjectPerformance[subjectName]) {
                    subjectPerformance[subjectName] = { totalScore: 0, count: 0, passes: 0, failures: 0 };
                }
                subjectPerformance[subjectName].totalScore += total;
                subjectPerformance[subjectName].count++;
                
                // Fixed failure threshold (score < 40)
                if (total < 40) { 
                    subjectPerformance[subjectName].failures++;
                } else {
                    subjectPerformance[subjectName].passes++;
                }
            }
        });

        overallTotalScore += studentTotalScore;

        if (!classPerformance[studentClass]) {
            classPerformance[studentClass] = { totalScore: 0, studentCount: 0 };
        }
        classPerformance[studentClass].totalScore += studentTotalScore;
        classPerformance[studentClass].studentCount++;
    });

    // Calculate Averages and Rates for Subjects
    Object.keys(subjectPerformance).forEach(subjectName => {
        const data = subjectPerformance[subjectName];
        data.averageScore = data.totalScore / data.count;
        data.failureRate = (data.failures / data.count) * 100;
    });

    // Calculate Averages for Classes
    Object.keys(classPerformance).forEach(className => {
        const data = classPerformance[className];
        // Calculate average score per student per subject
        data.averageScore = data.totalScore / data.studentCount / subjectCount;
    });
    
    const sortedClassPerformance = Object.entries(classPerformance)
        .sort(([, a], [, b]) => b.averageScore - a.averageScore)
        .map(([name, data]) => ({ name, ...data }));
    
    // Sort subjects by highest failure rate
    const sortedSubjectPerformance = Object.entries(subjectPerformance)
        .sort(([, a], [, b]) => b.failureRate - a.failureRate)
        .map(([name, data]) => ({ name, ...data }));

    return {
        totalStudents,
        averageScorePerStudent: overallTotalScore / totalStudents / subjectCount,
        classRanking: sortedClassPerformance,
        subjectAnalysis: sortedSubjectPerformance
    };
}

/**
 * Identifies the student(s) with the absolute highest aggregate score in the group (handles ties).
 */
function identifyBestStudents(reportsArray) {
    const studentTotals = reportsArray.map(report => {
        const totalAggregateScore = report.subjects.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        return {
            name: report.studentName,
            class: report.studentClass,
            total: totalAggregateScore,
            average: (totalAggregateScore / ACADEMIC_SUBJECTS.length).toFixed(2) // Use constant subject count
        };
    });

    if (studentTotals.length === 0) return [];
    const maxScore = Math.max(...studentTotals.map(s => s.total));
    return studentTotals.filter(s => s.total === maxScore); 
}

/**
 * Identifies students whose average subject score falls below the user-defined threshold.
 */
function identifyWeakStudents(reportsArray, threshold) {
    const weakStudents = [];
    const subjectCount = ACADEMIC_SUBJECTS.length;

    reportsArray.forEach(report => {
        const totalAggregateScore = report.subjects.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        const averageSubjectScore = totalAggregateScore / subjectCount;

        if (averageSubjectScore < threshold) {
            weakStudents.push({
                name: report.studentName,
                class: report.studentClass,
                average: averageSubjectScore.toFixed(2)
            });
        }
    });

    return weakStudents.sort((a, b) => a.average - b.average); 
}


// -------------------- 5. Rendering Functions --------------------

/**
 * Updates the HTML content of the dashboard container with the calculated statistics.
 */
function renderStatistics(stats, filterContext) {
    const containerElement = document.getElementById('dashboardStats');
    let html = `<h2>Performance Overview: ${filterContext} 📊</h2>`;
    
    // --- OVERALL BEST STUDENT(S) ---
    html += '<div class="best-student-card">';
    if (stats.bestStudents && stats.bestStudents.length > 0) {
        const isTie = stats.bestStudents.length > 1;
        const bestScore = stats.bestStudents[0].total.toFixed(0);
        
        html += `
            <div class="trophy-icon">🏆</div>
            <div class="best-details">
                <h3>Overall Best Student${isTie ? 's (Tied)' : ''} in ${filterContext}</h3>
                <p class="best-score">Aggregate Total: ${bestScore}</p>
                <ul class="best-list">
                    ${stats.bestStudents.map(s => 
                        `<li>
                            <strong>${s.name}</strong> (${s.class}) 
                            <span class="avg-score">Avg: ${s.average} / 100</span>
                        </li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        html += '<p>No data to determine the best student in this selection.</p>';
    }
    html += '</div>';

    // --- General Stats ---
    html += `
        <div class="stat-card">
            <h3>Students Shown</h3>
            <p class="data-point">${stats.totalStudents}</p>
        </div>
        <div class="stat-card">
            <h3>Average Subject Score</h3>
            <p class="data-point">${stats.averageScorePerStudent.toFixed(2)} / 100</p>
        </div>
        <div class="stat-card">
            <h3>Weak Students Found</h3>
            <p class="data-point">${stats.weakStudents.length}</p>
        </div>
    `;

    // --- Weak Students List ---
    html += '<h3 class="section-title">Students Below Threshold (Needs Attention) ⚠️</h3>';
    if (stats.weakStudents.length > 0) {
        html += '<table class="data-table"><thead><tr><th>Rank</th><th>Student Name</th><th>Class</th><th>Avg. Score</th></tr></thead><tbody>';
        
        stats.weakStudents.forEach((s, index) => {
            html += `
                <tr class="high-failure">
                    <td>${index + 1}</td>
                    <td>${s.name}</td>
                    <td>${s.class}</td>
                    <td>${s.average}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
    } else {
        html += '<p>No students in this group fell below the defined threshold.</p>';
    }

    // --- Class Ranking (Only show if filtering by 'All Classes') ---
    if (filterContext === "All Classes") {
        html += '<h3 class="section-title">Class Ranking (All Classes)</h3>';
        html += '<table class="data-table"><thead><tr><th>Rank</th><th>Class</th><th>Students</th><th>Avg. Score (Per Subject)</th></tr></thead><tbody>';
        
        stats.classRanking.forEach((c, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${c.name}</td>
                    <td>${c.studentCount}</td>
                    <td>${c.averageScore.toFixed(2)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
    }

    // --- Subject Analysis ---
    html += `<h3 class="section-title">Subject Performance Analysis (${filterContext})</h3>`;
    html += '<p>Subjects are ranked by highest failure rate (score < 40).</p>';
    html += '<table class="data-table"><thead><tr><th>Rank</th><th>Subject</th><th>Avg. Score</th><th>Pass Rate</th><th>Failure Rate</th></tr></thead><tbody>';
    
    stats.subjectAnalysis.forEach((s, index) => {
        const trendIcon = s.failureRate > 20 ? '🔥' : '✅';
        const failureClass = s.failureRate > 20 ? 'high-failure' : '';

        html += `
            <tr class="${failureClass}">
                <td>${index + 1}</td>
                <td>${s.name}</td>
                <td>${s.averageScore.toFixed(2)} / 100</td>
                <td>${(100 - s.failureRate).toFixed(1)}%</td>
                <td>${s.failureRate.toFixed(1)}% ${trendIcon}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';

    containerElement.innerHTML = html;
}

