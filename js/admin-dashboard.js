let loggedInUser = null;

try {
    loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
} catch (error) {
    localStorage.removeItem('loggedInUser');
}

if (!loggedInUser || loggedInUser.role !== 'admin') {
    window.location.replace('../index.html');
} else {
    document.getElementById('sign-in-link').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('fd_access');
        localStorage.removeItem('fd_refresh');
        localStorage.removeItem('fd_name');
    });

document.addEventListener('DOMContentLoaded', () => {
    renderMedicineExpiryAlerts('adminExpiryAlerts', 'medicine-master.html');
    const staff = getStaff();
    const medicines = getMedicines();

    document.getElementById('totalStaff').textContent = staff.filter(person => person.status === 'Active').length;
    const activeMedicineStock = medicines
        .filter(medicine => medicine.status === 'Active')
        .reduce((total, medicine) => {
            const stock = Number(medicine.stock);
            return total + (Number.isFinite(stock) ? stock : 0);
        }, 0);
    document.getElementById('activeMedicineStock').textContent = activeMedicineStock;
});
}