// ==========================================
// PHARMACY DATA
// ==========================================

let medicines = [

    {
        id: 1,
        name: "Paracetamol",
        price: 20,
        stock: 50,
        expiry: "2027-12-31"
    },

    {
        id: 2,
        name: "Amoxicillin",
        price: 80,
        stock: 8,
        expiry: "2027-05-15"
    },

    {
        id: 3,
        name: "Cetirizine",
        price: 30,
        stock: 25,
        expiry: "2028-01-20"
    },

    {
        id: 4,
        name: "Azithromycin",
        price: 60,
        stock: 5,
        expiry: "2026-10-15"
    }

];


// ==========================================
// PRESCRIPTION QUEUE
// ==========================================

function viewPrescription(id) {

    window.location.href =
        "prescription-details.html?id=" + id;

}


// ==========================================
// MEDICINE INVENTORY
// ==========================================

function addMedicine() {

    const name =
        document.getElementById("medicineName").value.trim();

    const price =
        Number(
            document.getElementById("medicinePrice").value
        );

    const stock =
        Number(
            document.getElementById("medicineStock").value
        );

    const expiry =
        document.getElementById("medicineExpiry").value;


    if (!name || price <= 0 || stock < 0 || !expiry) {

        alert(
            "Please enter medicine name, price, stock and expiry date."
        );

        return;
    }


    const medicine = {

        id: medicines.length + 1,

        name: name,

        price: price,

        stock: stock,

        expiry: expiry

    };


    medicines.push(medicine);


    alert(
        "Medicine added successfully."
    );


    document.getElementById("medicineName").value = "";

    document.getElementById("medicinePrice").value = "";

    document.getElementById("medicineStock").value = "";

    document.getElementById("medicineExpiry").value = "";


    loadInventory();

    loadStock();

}


// ==========================================
// EXPIRY STATUS
// ==========================================

function getExpiryStatus(expiry) {

    const today =
        new Date();

    const expiryDate =
        new Date(expiry);


    today.setHours(0, 0, 0, 0);

    expiryDate.setHours(0, 0, 0, 0);


    if (expiryDate < today) {

        return {
            text: "Expired",
            className: "badge-danger"
        };

    }


    const difference =
        expiryDate - today;


    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days <= 30) {

        return {
            text: "Expiring Soon",
            className: "badge-warning"
        };

    }


    return {
        text: "Valid",
        className: "badge-success"
    };

}


// ==========================================
// STOCK STATUS
// ==========================================

function getStockStatus(stock) {

    if (stock <= 0) {

        return {
            text: "Out of Stock",
            className: "badge-danger"
        };

    }


    if (stock <= 10) {

        return {
            text: "Low Stock",
            className: "badge-warning"
        };

    }


    return {
        text: "Available",
        className: "badge-success"
    };

}


// ==========================================
// LOAD INVENTORY
// ==========================================

function loadInventory() {

    const table =
        document.getElementById("inventoryTable");


    if (!table) return;


    table.innerHTML = "";


    medicines.forEach(medicine => {

        const stockStatus =
            getStockStatus(
                medicine.stock
            );


        const expiryStatus =
            getExpiryStatus(
                medicine.expiry
            );


        table.innerHTML += `

            <tr>

                <td class="td-mono">
                    ${medicine.id}
                </td>


                <td class="td-primary">
                    ${medicine.name}
                </td>


                <td>
                    ₹${medicine.price}
                </td>


                <td>
                    ${medicine.stock}
                </td>


                <td>
                    ${medicine.expiry}
                </td>


                <td>

                    <span class="badge ${expiryStatus.className}">

                        ${expiryStatus.text}

                    </span>

                    <br>

                    <span class="badge ${stockStatus.className}">

                        ${stockStatus.text}

                    </span>

                </td>

            </tr>

        `;

    });

}


// ==========================================
// LOAD STOCK
// ==========================================

function loadStock() {

    const table =
        document.getElementById("stockTable");


    if (!table) return;


    table.innerHTML = "";


    medicines.forEach(medicine => {

        const stockStatus =
            getStockStatus(
                medicine.stock
            );


        const expiryStatus =
            getExpiryStatus(
                medicine.expiry
            );


        table.innerHTML += `

            <tr>

                <td class="td-primary">

                    ${medicine.name}

                </td>


                <td>

                    ${medicine.stock}

                </td>


                <td>

                    ${medicine.expiry}

                </td>


                <td>

                    <span class="badge ${stockStatus.className}">

                        ${stockStatus.text}

                    </span>

                    <br>

                    <span class="badge ${expiryStatus.className}">

                        ${expiryStatus.text}

                    </span>

                </td>


                <td class="td-actions">

                    <button

                        class="btn btn-primary btn-sm"

                        onclick="restockMedicine(${medicine.id})">

                        Restock

                    </button>

                </td>

            </tr>

        `;

    });

}


// ==========================================
// RESTOCK MEDICINE
// ==========================================

function restockMedicine(id) {

    const medicine =
        medicines.find(
            item => item.id === id
        );


    if (!medicine) {

        alert("Medicine not found.");

        return;

    }


    const quantity =
        prompt(
            "Enter quantity to restock " +
            medicine.name + ":"
        );


    if (
        quantity === null ||
        quantity === "" ||
        Number(quantity) <= 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    medicine.stock +=
        Number(quantity);


    alert(

        medicine.name +
        " restocked successfully.\n" +

        "Added: " +
        quantity +
        "\n" +

        "New Stock: " +
        medicine.stock

    );


    loadStock();

    loadInventory();

    updateDashboard();

}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    const pending =
        document.getElementById(
            "pendingPrescriptions"
        );


    const medicineCount =
        document.getElementById(
            "medicineCount"
        );


    const lowStock =
        document.getElementById(
            "lowStock"
        );


    if (medicineCount) {

        medicineCount.innerText =
            medicines.length;

    }


    if (lowStock) {

        lowStock.innerText =

            medicines.filter(
                medicine =>
                    medicine.stock <= 10
            ).length;

    }


    if (pending) {

        pending.innerText = 3;

    }

}


// ==========================================
// DISPENSE MEDICINE
// ==========================================

function dispenseMedicine() {

    const prescriptionId =
        document.getElementById(
            "prescriptionId"
        ).value;


    const medicineName =
        document.getElementById(
            "medicine"
        ).value;


    const quantity =
        Number(
            document.getElementById(
                "quantity"
            ).value
        );


    if (
        !prescriptionId ||
        !medicineName ||
        quantity <= 0
    ) {

        alert(
            "Please enter all details."
        );

        return;

    }


    const medicine =
        medicines.find(
            item =>
                item.name === medicineName
        );


    if (!medicine) {

        alert(
            "Medicine not found."
        );

        return;

    }


    // Check expiry

    const expiryStatus =
        getExpiryStatus(
            medicine.expiry
        );


    if (
        expiryStatus.text === "Expired"
    ) {

        alert(
            "Cannot dispense expired medicine."
        );

        return;

    }


    // Check stock

    if (
        medicine.stock < quantity
    ) {

        alert(
            "Insufficient stock."
        );

        return;

    }


    medicine.stock -= quantity;


    const message =
        document.getElementById(
            "dispenseMessage"
        );


    if (message) {

        message.innerHTML = `

            <span class="badge badge-success">

                Medicine dispensed successfully.

            </span>

            <br><br>

            Medicine:
            <strong>${medicine.name}</strong>

            <br>

            Quantity:
            <strong>${quantity}</strong>

            <br>

            Remaining Stock:
            <strong>${medicine.stock}</strong>

        `;

    }


    loadStock();

    loadInventory();

    updateDashboard();

}


// ==========================================
// BILLING
// ==========================================

function calculateBill() {

    const price =
        Number(
            document.getElementById(
                "billMedicine"
            ).value
        );


    const quantity =
        Number(
            document.getElementById(
                "billQuantity"
            ).value
        );


    const total =
        price * quantity;


    const totalElement =
        document.getElementById(
            "total"
        );


    if (totalElement) {

        totalElement.innerText =
            total;

    }

}


// ==========================================
// GENERATE BILL
// ==========================================

function generateBill() {

    const patient =
        document.getElementById(
            "patientName"
        ).value.trim();


    const total =
        document.getElementById(
            "total"
        ).innerText;


    if (
        !patient ||
        total === "0"
    ) {

        alert(
            "Please enter patient and medicine details."
        );

        return;

    }


    document.getElementById(
        "billMessage"
    ).innerHTML = `

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


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadInventory();

        loadStock();

        updateDashboard();

    }
);