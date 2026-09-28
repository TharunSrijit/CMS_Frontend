// ==========================================
// PHARMACY JAVASCRIPT
// ==========================================


// ------------------------------------------
// PRESCRIPTION QUEUE
// ------------------------------------------

function viewPrescription(id) {

    window.location.href =
        "prescription-details.html?id=" + id;

}


// ------------------------------------------
// DISPENSE MEDICINE
// ------------------------------------------

function dispenseMedicine() {

    const prescriptionId =
        document.getElementById("prescriptionId").value;

    const medicine =
        document.getElementById("medicine").value;

    const quantity =
        document.getElementById("quantity").value;

    if (!prescriptionId || !medicine || !quantity) {

        alert("Please enter all details.");

        return;
    }

    document.getElementById("dispenseMessage").innerHTML =
        '<span class="badge badge-success">' +
        'Medicine dispensed successfully!' +
        '</span>';

}


// ------------------------------------------
// ADD MEDICINE
// ------------------------------------------

function addMedicine() {

    const name =
        document.getElementById("medicineName").value;

    const price =
        document.getElementById("medicinePrice").value;

    const stock =
        document.getElementById("medicineStock").value;


    if (!name || !price || !stock) {

        alert("Please enter all medicine details.");

        return;
    }


    const table =
        document.getElementById("inventoryTable");


    const row =
        table.insertRow();


    row.innerHTML = `

        <td class="td-mono">
            ${table.rows.length}
        </td>

        <td class="td-primary">
            ${name}
        </td>

        <td>
            ₹${price}
        </td>

        <td>
            ${stock}
        </td>

        <td>

            <span class="badge ${
                stock <= 10
                ? "badge-warning"
                : "badge-success"
            }">

                ${
                    stock <= 10
                    ? "Low Stock"
                    : "Available"
                }

            </span>

        </td>

    `;


    document.getElementById("medicineName").value = "";

    document.getElementById("medicinePrice").value = "";

    document.getElementById("medicineStock").value = "";


    alert("Medicine added successfully.");

}


// ------------------------------------------
// ADD STOCK
// ------------------------------------------

function addStock(medicine) {

    const quantity =
        prompt(
            "Enter quantity to add for " +
            medicine + ":"
        );


    if (!quantity || quantity <= 0) {

        return;
    }


    alert(
        quantity +
        " units added to " +
        medicine +
        " stock."
    );

}


// ------------------------------------------
// CALCULATE BILL
// ------------------------------------------

function calculateBill() {

    const price =
        Number(
            document.getElementById("billMedicine").value
        );


    const quantity =
        Number(
            document.getElementById("billQuantity").value
        );


    const total =
        price * quantity;


    document.getElementById("total").innerText =
        total;

}


// ------------------------------------------
// GENERATE BILL
// ------------------------------------------

function generateBill() {

    const patient =
        document.getElementById("patientName").value;


    const total =
        document.getElementById("total").innerText;


    if (!patient || total === "0") {

        alert(
            "Please enter patient and medicine details."
        );

        return;
    }


    document.getElementById("billMessage").innerHTML = `

        <br>

        <span class="badge badge-success">
            Bill generated successfully!
        </span>

        <br><br>

        Patient:
        <strong>${patient}</strong>

        <br>

        Total Amount:
        <strong>₹${total}</strong>

    `;

}