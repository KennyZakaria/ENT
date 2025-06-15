// Configuration
const CONFIG = {
    keycloakUrl: 'http://localhost:8080',
    keycloakRealm: 'master',
    keycloakClientId: 'file-upload-service',
    downloadServiceUrl: 'http://localhost:8002'
};

// DOM Elements
const loginSection = document.getElementById('login-section');
const coursesSection = document.getElementById('courses-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const userName = document.getElementById('user-name');
const coursesContainer = document.getElementById('courses-container');
const loadingCourses = document.getElementById('loading-courses');
const downloadStatus = document.getElementById('download-status');
const downloadMessage = document.getElementById('download-message');

// State
let authToken = null;
let currentUser = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in (token in localStorage)
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        validateTokenAndLoadCourses();
    }

    // Login button click
    loginBtn.addEventListener('click', handleLogin);

    // Logout button click
    logoutBtn.addEventListener('click', handleLogout);
});

// Authentication Functions
async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return;
    }

    try {
        // Clear previous errors
        loginError.textContent = '';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        // Get token from Keycloak
        const tokenResponse = await getKeycloakToken(username, password);
        
        if (tokenResponse.access_token) {
            // Save token and user info
            authToken = tokenResponse.access_token;
            localStorage.setItem('authToken', authToken);
            
            // Extract user info from token
            currentUser = parseToken(authToken);
            
            // Show courses section
            showCoursesSection();
            
            // Load courses
            loadCourses();
        } else {
            showLoginError('Authentication failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Authentication failed: ' + (error.message || 'Unknown error'));
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

async function getKeycloakToken(username, password) {
    const keycloak = new Keycloak({
        url: 'http://localhost:8080',       // Your Keycloak base URL
        realm: 'master',                    // Your realm name
        clientId: 'your-client-id'          // Your client ID
      });
    
      keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
        if (authenticated) {
          console.log("Authenticated");
          console.log("Access token:", keycloak.token);
          
          // Use the token to call your backend:
          fetch('http://localhost:8000/protected-api', {
            headers: {
              Authorization: `Bearer ${keycloak.token}`
            }
          })
            .then(res => res.json())
            .then(data => console.log(data));
        } else {
          console.warn("Not authenticated");
        }
      }).catch(err => console.error("Keycloak init error:", err));
    // const url = `${CONFIG.keycloakUrl}/realms/${CONFIG.keycloakRealm}/protocol/openid-connect/token`;
    
    // const formData = new URLSearchParams();
    // formData.append('client_id', CONFIG.keycloakClientId);
    // formData.append('username', username);
    // formData.append('password', password);
    // formData.append('grant_type', 'password');
    
    // const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded'
    //     },
    //     body: formData
    // });
    
    // if (!response.ok) {
    //     const errorData = await response.json().catch(() => ({}));
    //     throw new Error(errorData.error_description || `HTTP error ${response.status}`);
    // }
    
    // return await response.json();
}

function parseToken(token) {
    try {
        // Parse the JWT token (split by dots and decode the middle part)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
}

function handleLogout() {
    // Clear auth data
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    // Show login section
    loginSection.classList.remove('hidden');
    coursesSection.classList.add('hidden');
    
    // Clear form fields
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
}

async function validateTokenAndLoadCourses() {
    try {
        // Parse the token to get user info
        currentUser = parseToken(authToken);
        
        if (!currentUser || !currentUser.preferred_username) {
            throw new Error('Invalid token');
        }
        
        // Show courses section
        showCoursesSection();
        
        // Load courses
        loadCourses();
    } catch (error) {
        console.error('Token validation error:', error);
        handleLogout(); // Force logout if token is invalid
    }
}

function showCoursesSection() {
    // Update UI
    loginSection.classList.add('hidden');
    coursesSection.classList.remove('hidden');
    
    // Set user name
    userName.textContent = currentUser.preferred_username || 'User';
}

// Course Functions
async function loadCourses() {
    try {
        loadingCourses.style.display = 'block';
        coursesContainer.innerHTML = '';
        
        const response = await fetch(`${CONFIG.downloadServiceUrl}/courses`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const courses = await response.json();
        
        if (courses.length === 0) {
            coursesContainer.innerHTML = '<p>No courses available.</p>';
        } else {
            displayCourses(courses);
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        coursesContainer.innerHTML = `<p class="error-message">Failed to load courses: ${error.message}</p>`;
    } finally {
        loadingCourses.style.display = 'none';
    }
}

function displayCourses(courses) {
    coursesContainer.innerHTML = '';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        
        courseCard.innerHTML = `
            <h3 class="course-title">${escapeHtml(course.title)}</h3>
            <p class="course-description">${escapeHtml(course.description)}</p>
            <button class="btn download-btn" data-course-id="${escapeHtml(course.id)}">Download</button>
        `;
        
        coursesContainer.appendChild(courseCard);
        
        // Add event listener to download button
        const downloadBtn = courseCard.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => generateDownloadLink(course.id));
    });
}

async function generateDownloadLink(courseId) {
    try {
        showDownloadStatus('Generating download link...', false);
        
        const response = await fetch(`${CONFIG.downloadServiceUrl}/courses/${courseId}/download`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.download_url) {
            // Open the download URL in a new tab
            window.open(data.download_url, '_blank');
            showDownloadStatus('Download started!', false);
        } else {
            throw new Error('No download URL received');
        }
    } catch (error) {
        console.error('Error generating download link:', error);
        showDownloadStatus(`Failed to generate download link: ${error.message}`, true);
    }
}

// Utility Functions
function showLoginError(message) {
    loginError.textContent = message;
}

function showDownloadStatus(message, isError) {
    downloadMessage.textContent = message;
    downloadStatus.classList.remove('hidden');
    
    if (isError) {
        downloadStatus.classList.add('error');
    } else {
        downloadStatus.classList.remove('error');
    }
    
    // Hide the status after 3 seconds
    setTimeout(() => {
        downloadStatus.classList.add('hidden');
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}