// -------------------- Firebase Setup --------------------

// NOTE: In a production portal, these keys would be secured, and users would need to log in.
// For development, we keep the existing configuration structure.

// Existing Student SIS Database
const firebaseConfigStudents = {
  apiKey: "AIzaSyAoSRm7DKQB0bTRCKNELxbEVQA7y0hGgT4",
  authDomain: "school-registration-a9774.firebaseapp.com",
  databaseURL: "https://school-registration-a9774-default-rtdb.firebaseio.com",
  projectId: "school-registration-a9774",
  // ... other configs
};

// Existing Reports/Gradebook Database
const firebaseConfigReports = {
  apiKey: "AIzaSyCjW6d-DL_yLZKyfAYI7ahPOfE5jFNWf18",
  authDomain: "report-155f1.firebaseapp.com",
  databaseURL: "https://report-155f1-default-rtdb.firebaseio.com",
  projectId: "report-155f1",
  // ... other configs
};

// Initialize Firebase Apps
const studentsApp = firebase.initializeApp(firebaseConfigStudents, "studentsApp");
const reportsApp = firebase.initializeApp(firebaseConfigReports, "reportsApp");

// We'll use the 'reportsApp' database to also store new portal content like Announcements
const portalDB = reportsApp.database(); 
const announcementsRef = portalDB.ref("announcements");


// -------------------- Main Logic --------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data for the Dashboard
    loadAnnouncements();
    // 2. Setup Navigation
    setupNavigation();
});

// -------------------- Announcement Feature (New) --------------------

function loadAnnouncements() {
    const announcementsList = document.getElementById('announcements-list');
    announcementsList.innerHTML = ''; // Clear existing dummy content

    // Listen for data changes in the announcements database
    announcementsRef.limitToLast(3).on('value', (snapshot) => {
        const data = snapshot.val();
        const announcements = [];

        if (data) {
            // Convert object to array and attach key
            Object.keys(data).forEach(key => {
                announcements.push({...data[key], key: key});
            });
            
            // Sort by datePosted (descending)
            announcements.sort((a, b) => b.datePosted - a.datePosted);

            // Display the top 3
            announcements.slice(0, 3).forEach(announcement => {
                const li = document.createElement('li');
                const categoryClass = announcement.category ? announcement.category.toLowerCase().replace(' ', '-') : 'general';

                li.classList.add(categoryClass);
                li.innerHTML = `<strong>${announcement.category || 'General'}:</strong> ${announcement.title}`;
                
                // Add detail when clicked (optional)
                li.title = announcement.message; 
                
                announcementsList.appendChild(li);
            });

            if (announcements.length === 0) {
                 announcementsList.innerHTML = '<li>No recent announcements.</li>';
            }
        } else {
             announcementsList.innerHTML = '<li>No announcements found.</li>';
        }
    }, (error) => {
        console.error("Error loading announcements:", error);
        announcementsList.innerHTML = `<li class="urgent">Error loading announcements: ${error.message}</li>`;
    });
}


// -------------------- Navigation & Routing --------------------

function setupNavigation() {
    // NOTE: In a real SPA (Single Page Application), this would load different HTML content.
    // For simplicity, we assume links open the existing pages (dashboard.html, report.html)
    // or navigate to a new section if we built it all on one page.

    // Get the navigation links from the sidebar and quick access cards
    const sidebarLinks = document.querySelectorAll('.nav-item');
    const quickCards = document.querySelectorAll('.quick-links .card');

    // Define the conceptual pages/URLs (adjust these based on your actual file names)
    const portalRoutes = {
        'link-grade-entry': 'report.html', // Where report.js lives
        'link-attendance': 'attendance.html', // New page to be built
        'link-roster': 'dashboard.html', // Where dashboard.js lives
        // ... other routes
    };
    
    // Function to handle navigation
    const handleNavigation = (linkId) => {
        const url = portalRoutes[linkId];
        if (url) {
            // For now, we will just simulate opening the intended page
            console.log(`Navigating to: ${url}`);
            // window.location.href = url; // Uncomment this to navigate to actual files
            
            // Display alert for conceptual links
            if (linkId === 'link-attendance') {
                alert("Attendance Page (attendance.html) is not yet built!");
            }
        } else if (linkId === 'Dashboard') {
             // Stay on index.html
        } else {
            alert(`Feature for ${linkId} is not yet implemented.`);
        }
    };
    
    // Sidebar Listener
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove 'active' class from all, add to clicked one
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const linkText = link.textContent.trim().split(/\s+/).slice(1).join(' '); // Extracts text after icon
            handleNavigation(link.id || linkText);
        });
    });

    // Quick Card Listener (Mapping card-classes to link-IDs for routes)
    quickCards.forEach(card => {
        card.addEventListener('click', () => {
            let targetId;
            if (card.classList.contains('academic-card')) {
                targetId = 'link-grade-entry';
            } else if (card.classList.contains('attendance-card')) {
                targetId = 'link-attendance';
            } else if (card.classList.contains('primary-card')) {
                targetId = 'link-roster';
            }
            handleNavigation(targetId);
        });
    });
}

