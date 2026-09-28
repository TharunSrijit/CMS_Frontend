// Prescription Details
function viewPrescription(id) {
    window.location.href =
        "prescription-details.html?id=" + id;
}


// Dispense Medicine
function dispenseMedicine() {

    let prescription =
        document.getElementById("prescriptionId").value;

    let medicine =
        document.getElementById("medicine").value;

    let quantity =
        document.getElementById("quantity").value;

    if (!prescription || !medicine || !quantity) {
        alert("Please enter all details");
        return;
    }

    document.getElementById("message").innerHTML =
        "Medicine dispensed successfully!";
}


// Add Medicine
function addMedicine() {

    let name =
        document.getElementById("medicineName").value;

    let price =
        document.getElementById("medicinePrice").value;

    let stock =
        document.getElementById("medicineStock").value;

    if (!name || !price || !stock) {
        alert("Please enter all medicine details");
        return;
    }

    let table =
        document.getElementById("inventoryTable");

    let row = table.insertRow();

    row.innerHTML = `
        <td>${table.rows.length}</td>
        <td>${name}</td>
        <td>₹${price}</td>
        <td>${stock}</td>
        <td>${stock <= 10 ? "Low Stock" : "Available"}</td>
    `;

    alert("Medicine added successfully");

    document.getElementById("medicineName").value = "";
    document.getElementById("medicinePrice").value = "";
    document.getElementById("medicineStock").value = "";
}


// Add Stock
function addStock(medicine) {

    let quantity =
        prompt("Enter quantity to add for " + medicine);

    if (quantity && quantity > 0) {
        alert(
            quantity +
            " units added to " +
            medicine +
            " stock."
        );
    }
}


// Calculate Bill
function calculateBill() {

    let price =
        Number(
            document.getElementById("billMedicine").value
        );

    let quantity =
        Number(
            document.getElementById("billQuantity").value
        );

    let total = price * quantity;

    document.getElementById("total").innerText =
        total;
}


// Generate Bill
function generateBill() {

    let patient =
        document.getElementById("patientName").value;

    let total =
        document.getElementById("total").innerText;

    if (!patient || total == 0) {
        alert("Please enter patient and medicine details");
        return;
    }

    document.getElementById("billMessage").innerHTML =
        "<b>Bill generated successfully!</b><br>" +
        "Patient: " + patient + "<br>" +
        "Total Amount: ₹" + total;
}