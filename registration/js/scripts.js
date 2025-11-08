// -------------------- Firebase Setup --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAoSRm7DKQB0bTRCKNELxbEVQA7y0hGgT4",
  authDomain: "school-registration-a9774.firebaseapp.com",
  databaseURL: "https://school-registration-a9774-default-rtdb.firebaseio.com",
  projectId: "school-registration-a9774",
  storageBucket: "school-registration-a9774.firebasestorage.app",
  messagingSenderId: "967547068125",
  appId: "1:967547068125:web:0a5708c69c84d1bac64534"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const pendingRef = database.ref('pending'); // All new submissions go here

// -------------------- Pre-fill Registration Date --------------------
const today = new Date().toISOString().split('T')[0];
document.getElementById('registrationDate').value = today;

// -------------------- Form Submission --------------------
document.getElementById('registerForm').addEventListener('submit', function(e){
  e.preventDefault();

  // -------------------- Collect Values --------------------
  const firstName = document.getElementById('firstName').value.trim();
  const middleName = document.getElementById('middleName').value.trim();
  const surname = document.getElementById('surname').value.trim();
  const dob = document.getElementById('dob').value;
  const gender = document.getElementById('gender').value;
  const birthplace = document.getElementById('birthplace').value.trim();
  const nationality = document.getElementById('nationality').value === "Other" ? 
                      document.getElementById('nationalityCustom').value.trim() : 
                      document.getElementById('nationality').value;
  const religion = document.getElementById('religion').value;
  const denomination = document.getElementById('denomination').value === "Other" ? 
                       document.getElementById('denominationCustom').value.trim() : 
                       document.getElementById('denomination').value;
  const classApplying = document.getElementById('classApplying').value;
  const previousSchool = document.getElementById('previousSchool').value.trim();
  const reason = document.getElementById('reason').value.trim();
  const guardianName = document.getElementById('guardianName').value.trim();
  const relationship = document.getElementById('relationship').value.trim();
  const occupation = document.getElementById('occupation').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();
  const town = document.getElementById('town').value.trim();
  const region = document.getElementById('region').value;
  const medical = document.getElementById('medical').value.trim();
  const emergencyName = document.getElementById('emergencyName').value.trim();
  const emergencyNumber = document.getElementById('emergencyNumber').value.trim();
  const registrationDate = document.getElementById('registrationDate').value;

  // -------------------- Required Fields Validation --------------------
  if(!firstName || !surname || !classApplying){
    alert("❌ First Name, Surname, and Class Applying For are required!");
    return;
  }

  // -------------------- Prepare Student Data --------------------
  const studentData = {
    firstName,
    middleName,
    surname,
    dob: dob || null,
    gender,
    birthplace,
    nationality,
    religion,
    denomination,
    classApplying,
    previousSchool,
    reason,
    guardianName,
    relationship,
    occupation,
    phone,
    email,
    address,
    town,
    region,
    medical,
    emergencyName,
    emergencyNumber,
    registrationDate,
    status: "Pending",
    expiryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString() // Expires in 7 days
  };

  // -------------------- Push to Pending --------------------
  pendingRef.push(studentData, function(error){
    if(error){
      console.error("Push failed:", error);
      alert("❌ Error submitting registration. Please try again.");
    } else {
      alert(`✅ Dear ${firstName}, your application for ${classApplying} has been submitted successfully!`);

      // -------------------- Send SMS Confirmation --------------------
      const smsContent = `ST.Joseph Preparatory School-Pokukrom\nDear ${firstName}, you have applied for ${classApplying}. Please visit the school premises within 7 days to finalize approval and start school.\nThank you!`;
      const smsURL = `https://smsc.hubtel.com/v1/messages/send?clientsecret=vcbxefjc&clientid=jnhvrhia&from=BPAALERTS&to=${phone}&content=${encodeURIComponent(smsContent)}`;

      fetch(smsURL)
        .then(res => res.json())
        .then(data => console.log('SMS sent:', data))
        .catch(err => console.error('SMS sending failed:', err));

      // Reset form
      document.getElementById('registerForm').reset();
      document.getElementById('registrationDate').value = today;
    }
  });
});

// -------------------- Auto-remove expired applications --------------------
setInterval(()=>{
  pendingRef.once('value', snapshot => {
    snapshot.forEach(child => {
      const data = child.val();
      const id = child.key;
      if(data.status === "Pending" && data.expiryDate){
        const expiry = new Date(data.expiryDate);
        if(new Date() > expiry){
          pendingRef.child(id).remove()
            .then(()=> console.log(`Pending application for ${data.firstName} ${data.surname} expired and removed.`))
            .catch(console.error);
        }
      }
    });
  });
}, 24*60*60*1000); // Checks once every 24 hours
