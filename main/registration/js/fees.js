// 1. Firebase Configuration (Remains the same)
const firebaseConfig = {
    apiKey: "AIzaSyAoSRm7DKQB0bTRCKNELxbEVQA7y0hGgT4",
    authDomain: "school-registration-a9774.firebaseapp.com",
    databaseURL: "https://school-registration-a9774-default-rtdb.firebaseio.com",
    projectId: "school-registration-a9774",
    storageBucket: "school-registration-a9774.appspot.com",
    messagingSenderId: "967547068125",
    appId: "1:967547068125:web:0a5708c69c84d1bac64534"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Get DOM elements
const feesTableBody = document.getElementById('feesTableBody');
const loadingMessage = document.getElementById('loadingMessage');
const feesTable = document.getElementById('feesTable');
const studentIdInput = document.getElementById('studentIdInput'); // Input will be used for Name/ID search
const searchButton = document.getElementById('searchButton');

// Global variable to hold all student data after fetching (for efficient searching)
let allStudentsData = {}; 

// 2. Function to fetch and display ALL students
function fetchAndDisplayStudents() {
    const studentsRef = database.ref('students'); 
    loadingMessage.textContent = "Loading student data...";
    
    studentsRef.on('value', (snapshot) => {
        feesTableBody.innerHTML = ''; 
        allStudentsData = {}; // Reset global data storage
        let studentCount = 0;

        if (snapshot.exists()) {
            const students = snapshot.val();
            
            for (let studentId in students) {
                const student = students[studentId];
                studentCount++;

                // 🌟 Key Change: Auto-generating the Full Name from components
                const firstName = student.firstName || '';
                const lastName = student.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                
                // Store the full data globally for efficient front-end searching
                allStudentsData[studentId] = { ...student, fullName: fullName, studentId: studentId };

                // Insert into the table (initially displaying all)
                const row = feesTableBody.insertRow();
                row.insertCell(0).textContent = studentId || 'N/A'; 
                row.insertCell(1).textContent = fullName || 'Student Name Missing'; // Use the generated full name
                row.insertCell(2).textContent = student.class || 'N/A';
                
                // Example of fees data access
                const balance = student.fees && student.fees.outstandingBalance ? student.fees.outstandingBalance.toFixed(2) : '0.00';
                const lastPayment = student.fees && student.fees.lastPaymentDate ? student.fees.lastPaymentDate : 'Never'; 
                
                row.insertCell(3).textContent = 'GHS ' + balance;
                row.insertCell(4).textContent = lastPayment; 
            }
        }

        // Update UI visibility
        loadingMessage.classList.add('hidden');
        if (studentCount > 0) {
            feesTable.classList

