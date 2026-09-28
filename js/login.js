const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const message = document.getElementById('form-message');
const submitButton = document.getElementById('submit-button');
const togglePassword = document.getElementById('toggle-password');

const dashboardByRole = {
    ADMIN: 'admin/dashboard.html',
    DOCTOR: 'doctor/dashboard.html',
    RECEPTIONIST: 'receptionist/dashboard.html',
    LAB_TECHNICIAN: 'lab/dashboard.html',
    PHARMACIST: 'pharmacy/dashboard.html'
};

const localAccounts = {
    admin: { password: 'admin123', role: 'ADMIN', userRole: 'admin', fullName: 'Administrator' },
    doctor: { password: 'doctor123', role: 'DOCTOR', userRole: 'doctor', fullName: 'Dr. Arun Kumar' },
    reception: { password: 'reception123', role: 'RECEPTIONIST', userRole: 'receptionist', fullName: 'Receptionist' },
    receptionist: { password: 'reception123', role: 'RECEPTIONIST', userRole: 'receptionist', fullName: 'Receptionist' },
    pharmacy: { password: 'pharmacy123', role: 'PHARMACIST', userRole: 'pharmacist', fullName: 'Pharmacist' },
    lab: { password: 'lab123', role: 'LAB_TECHNICIAN', userRole: 'lab', fullName: 'Lab Technician' }
};

togglePassword.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';
    passwordInput.type = showPassword ? 'text' : 'password';
    togglePassword.textContent = showPassword ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-pressed', String(showPassword));
});

loginForm.addEventListener('submit', event => {
    event.preventDefault();
    message.textContent = '';

    if (!loginForm.reportValidity()) return;

    const username = usernameInput.value.trim().toLowerCase();
    const account = localAccounts[username];
    const requiredRole = loginForm.dataset.role;

    if (!account || account.password !== passwordInput.value) {
        message.textContent = 'Sign-in failed. Please check your username and password.';
        return;
    }

    if (requiredRole && account.role !== requiredRole) {
        message.textContent = 'This sign-in is not authorized for this workspace.';
        return;
    }

    // Set loggedInUser for doctor & receptionist auth guards
    localStorage.setItem('loggedInUser', JSON.stringify({
        username: username,
        name: account.fullName,
        role: account.userRole
    }));

    localStorage.setItem('fd_access', 'local-session');
    localStorage.setItem('fd_refresh', '');
    localStorage.setItem('fd_name', account.fullName);
    window.location.assign(dashboardByRole[account.role]);
});