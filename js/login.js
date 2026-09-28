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
    admin: { password: 'admin123', role: 'ADMIN', fullName: 'Administrator' },
    receptionist: { password: 'receptionist123', role: 'RECEPTIONIST', fullName: 'Receptionist' },
    doctor: { password: 'doctor123', role: 'DOCTOR', fullName: 'Doctor' },
    lab: { password: 'lab123', role: 'LAB_TECHNICIAN', fullName: 'Lab Technician' },
    pharmacist: { password: 'pharmacist123', role: 'PHARMACIST', fullName: 'Pharmacist' }
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
        message.textContent = 'Sign-in failed. Use the local administrator credentials.';
        return;
    }

    if (requiredRole && account.role !== requiredRole) {
        message.textContent = 'This sign-in is for administrator accounts only.';
        return;
    }

    localStorage.setItem('fd_access', 'local-session');
    localStorage.setItem('fd_refresh', '');
    localStorage.setItem('fd_name', account.fullName);
    localStorage.setItem('loggedInUser', JSON.stringify({
        username,
        name: account.fullName,
        role: account.role.toLowerCase()
    }));
    window.location.assign(dashboardByRole[account.role]);
});