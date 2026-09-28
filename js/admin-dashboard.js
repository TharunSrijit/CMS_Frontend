document.addEventListener('DOMContentLoaded', () => {
    const doctors = getDoctors();
    const staff = getStaff();
    const users = getUsers();

    document.getElementById('totalDoctors').textContent = doctors.length;
    document.getElementById('totalStaff').textContent = staff.length;
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('activeUsers').textContent = users.filter(user => user.status === 'Active').length;
});