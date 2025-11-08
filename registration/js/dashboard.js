// -------------------- Firebase Setup --------------------
var firebaseConfig = {
    apiKey: "AIzaSyAoSRm7DKQB0bTRCKNELxbEVQA7y0hGgT4",
    authDomain: "school-registration-a9774.firebaseapp.com",
    databaseURL: "https://school-registration-a9774-default-rtdb.firebaseio.com",
    projectId: "school-registration-a9774",
    storageBucket: "school-registration-a9774.appspot.com",
    messagingSenderId: "967547068125",
    appId: "1:967547068125:web:0a5708c69c84d1bac64534"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var studentsRef = database.ref('students');

// -------------------- DOM Elements --------------------
var addStudentForm = document.getElementById('addStudentForm');
var toggleAddStudentFormBtn = document.getElementById('toggleAddStudentForm');
var addStudentSection = document.getElementById('addStudentSection');
var regDenominationSelect = document.getElementById('regDenomination');
var regDenominationCustom = document.getElementById('regDenominationCustom');
var regNationalitySelect = document.getElementById('regNationality');
var regNationalityCustom = document.getElementById('regNationalityCustom');

var tableBody = document.querySelector('#studentsTable tbody');
var searchName = document.getElementById('searchName');
var filterGender = document.getElementById('filterGender');
var filterReligion = document.getElementById('filterReligion');
var filterDenomination = document.getElementById('filterDenomination');
var filterClass = document.getElementById('filterClass');
var filterRegion = document.getElementById('filterRegion');
var filterAge = document.getElementById('filterAge');
var filterEmergency = document.getElementById('filterEmergency');
var clearFiltersBtn = document.getElementById('clearFilters');

var totalStudentsElem = document.getElementById('totalStudents');
var totalMalesElem = document.getElementById('totalMales');
var totalFemalesElem = document.getElementById('totalFemales');
var filteredResultsElem = document.getElementById('filteredResults');

var allStudents = [];

// -------------------- Helper Functions --------------------
function calculateAge(dobString) {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

// -------------------- Add Student Functions --------------------
function handleAddStudent(e) {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const surname = document.getElementById('regSurname').value.trim();
    const classApplying = document.getElementById('regClassApplying').value;
    const defaultPassword = 'Rom123@';

    if (!firstName || !surname || !classApplying) {
        alert('Please fill in all required fields (First Name, Surname, Class Applying For).');
        return;
    }

    if (!defaultPassword) {
        alert('Cannot register student: default password is missing.');
        return;
    }

    const newStudent = {
        firstName: firstName,
        middleName: document.getElementById('regMiddleName').value.trim(),
        surname: surname,
        dob: document.getElementById('regDob').value,
        gender: document.getElementById('regGender').value,
        birthplace: document.getElementById('regBirthplace').value.trim(),
        denomination: regDenominationSelect.value === 'Other' ? regDenominationCustom.value.trim() : regDenominationSelect.value,
        religion: document.getElementById('regReligion').value,
        nationality: regNationalitySelect.value === 'Other' ? regNationalityCustom.value.trim() : regNationalitySelect.value,
        classApplying: classApplying,
        previousSchool: document.getElementById('regPreviousSchool').value.trim(),
        reason: document.getElementById('regReason').value.trim(),
        guardianName: document.getElementById('regGuardianName').value.trim(),
        relationship: document.getElementById('regRelationship').value.trim(),
        occupation: document.getElementById('regOccupation').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        address: document.getElementById('regAddress').value.trim(),
        town: document.getElementById('regTown').value.trim(),
        region: document.getElementById('regRegion').value,
        medical: document.getElementById('regMedical').value.trim(),
        emergencyName: document.getElementById('regEmergencyName').value.trim(),
        emergencyNumber: document.getElementById('regEmergencyNumber').value.trim(),
        registrationDate: document.getElementById('regRegistrationDate').value,
        password: defaultPassword
    };

    if (newStudent.dob) newStudent.age = calculateAge(newStudent.dob);

    studentsRef.push(newStudent)
        .then(() => {
            alert("New student registered successfully! Default password: " + defaultPassword);
            addStudentForm.reset();
            addStudentSection.style.display = 'none';
            toggleAddStudentFormBtn.textContent = 'Add New Student';
        })
        .catch(error => {
            alert("Error registering student: " + error.message);
            console.error("Firebase push failed:", error);
        });
}

// -------------------- Event Listeners --------------------
if (toggleAddStudentFormBtn) toggleAddStudentFormBtn.addEventListener('click', () => {
    const isHidden = addStudentSection.style.display === 'none';
    addStudentSection.style.display = isHidden ? 'block' : 'none';
    toggleAddStudentFormBtn.textContent = isHidden ? 'Hide Form' : 'Add New Student';
});
if (addStudentForm) addStudentForm.addEventListener('submit', handleAddStudent);
if (regDenominationSelect) regDenominationSelect.addEventListener('change', () => {
    regDenominationCustom.style.display = regDenominationSelect.value === 'Other' ? 'block' : 'none';
});
if (regNationalitySelect) regNationalitySelect.addEventListener('change', () => {
    regNationalityCustom.style.display = regNationalitySelect.value === 'Other' ? 'block' : 'none';
});

// -------------------- Firebase Listener --------------------
studentsRef.on('value', function(snapshot) {
    const data = snapshot.val();
    allStudents = [];
    if (data) {
        Object.keys(data).forEach(key => {
            const student = data[key];
            student.age = student.age || calculateAge(student.dob);
            student.key = key;
            allStudents.push(student);
        });
    }
    applyFilters();
});

// -------------------- Filters and Table Functions --------------------
// (
