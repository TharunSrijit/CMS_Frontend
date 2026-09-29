/* =========================================================
   LAB MANAGEMENT SYSTEM
   Frontend / LocalStorage Version
========================================================= */


/* =========================================================
   SIDEBAR
========================================================= */

function toggleMenu() {

    const sidebar = document.getElementById("menu");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }

}


/* =========================================================
   GET LAB TESTS
========================================================= */

function getLabTests() {

    const tests =
        localStorage.getItem("labTests");

    if (!tests) {
        return [];
    }

    try {

        return JSON.parse(tests);

    } catch (error) {

        console.error(
            "Error reading lab tests:",
            error
        );

        return [];

    }

}


/* =========================================================
   SAVE LAB TESTS
========================================================= */

function saveLabTests(tests) {

    localStorage.setItem(
        "labTests",
        JSON.stringify(tests)
    );

}


/* =========================================================
   GENERATE LAB TEST ID
========================================================= */

function generateLabTestId() {

    const tests = getLabTests();

    let number = tests.length + 1;

    let id =
        "LAB" +
        String(number).padStart(3, "0");


    /* Make sure ID is unique */

    while (
        tests.some(test => test.id === id)
    ) {

        number++;

        id =
            "LAB" +
            String(number).padStart(3, "0");

    }

    return id;

}


/* =========================================================
   ADD NEW LAB TEST
========================================================= */

function addNewLabTest(event) {

    event.preventDefault();


    const patientName =
        document.getElementById("patientName")?.value.trim();

    const patientId =
        document.getElementById("patientId")?.value.trim();

    const doctorName =
        document.getElementById("doctorName")?.value.trim();

    const testName =
        document.getElementById("testName")?.value.trim();

    const testDate =
        document.getElementById("testDate")?.value;

    const priority =
        document.getElementById("priority")?.value;

    const notes =
        document.getElementById("notes")?.value.trim();


    if (
        !patientName ||
        !patientId ||
        !doctorName ||
        !testName ||
        !testDate
    ) {

        alert(
            "Please fill in all required fields."
        );

        return;

    }


    const tests = getLabTests();


    const newTest = {

        id: generateLabTestId(),

        patientName: patientName,

        patientId: patientId,

        doctorName: doctorName,

        testName: testName,

        testDate: testDate,

        priority: priority || "Normal",

        notes: notes || "",

        status: "Pending",

        result: "",

        remarks: "",

        createdAt:
            new Date().toISOString()

    };


    tests.push(newTest);

    saveLabTests(tests);


    const message =
        document.getElementById("message");


    if (message) {

        message.innerHTML =
            "Lab test added successfully. Test ID: " +
            newTest.id;

    }


    /* Reset form */

    const form =
        event.target;

    if (form) {
        form.reset();
    }


    /* Update dashboard */

    updateLabDashboard();

}


/* =========================================================
   UPDATE LAB DASHBOARD
========================================================= */

function updateLabDashboard() {

    const tests = getLabTests();


    const pendingTests =
        tests.filter(
            test =>
                test.status === "Pending"
        );


    const completedTests =
        tests.filter(
            test =>
                test.status === "Completed"
        );


    const pendingCount =
        document.getElementById(
            "pendingCount"
        );

    const completedCount =
        document.getElementById(
            "completedCount"
        );

    const todayTestCount =
        document.getElementById(
            "todayTestCount"
        );

    const totalTestCount =
        document.getElementById(
            "totalTestCount"
        );


    if (pendingCount) {

        pendingCount.textContent =
            pendingTests.length;

    }


    if (completedCount) {

        completedCount.textContent =
            completedTests.length;

    }


    if (totalTestCount) {

        totalTestCount.textContent =
            tests.length;

    }


    if (todayTestCount) {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        const todayTests =
            tests.filter(
                test =>
                    test.testDate === today
            );


        todayTestCount.textContent =
            todayTests.length;

    }

}


/* =========================================================
   LOAD PENDING LAB ORDERS
========================================================= */

function loadPendingLabOrders() {

    const table =
        document.getElementById(
            "pendingTestsTable"
        );

    const tbody =
        document.getElementById(
            "pendingTestsBody"
        );


    if (!table || !tbody) {

        return;

    }


    /* Clear existing dynamic rows */

    tbody.innerHTML = "";


    const tests =
        getLabTests();


    const pendingTests =
        tests.filter(
            test =>
                test.status === "Pending"
        );


    /* No pending tests */

    if (pendingTests.length === 0) {

        const row =
            tbody.insertRow();


        const cell =
            row.insertCell();


        cell.colSpan = 8;

        cell.textContent =
            "No pending laboratory tests.";

        return;

    }


    /* Create rows */

    pendingTests.forEach(
        function (test) {


            const row =
                tbody.insertRow();


            row.classList.add(
                "dynamic-lab-row"
            );


            /* Test ID */

            row.insertCell(0)
                .textContent =
                test.id;


            /* Patient */

            row.insertCell(1)
                .textContent =
                test.patientName;


            /* Doctor */

            row.insertCell(2)
                .textContent =
                test.doctorName;


            /* Test */

            row.insertCell(3)
                .textContent =
                test.testName;


            /* Date */

            row.insertCell(4)
                .textContent =
                test.testDate;


            /* Priority */

            row.insertCell(5)
                .textContent =
                test.priority;


            /* Status */

            row.insertCell(6)
                .textContent =
                test.status;


            /* Action */

            const actionCell =
                row.insertCell(7);


            const viewButton =
                document.createElement(
                    "button"
                );


            viewButton.type =
                "button";


            viewButton.textContent =
                "View";


            viewButton.className =
                "btn btn-secondary";


            viewButton.addEventListener(
                "click",
                function () {

                    viewLabTest(
                        test.id
                    );

                }
            );


            actionCell.appendChild(
                viewButton
            );

        }
    );

}


/* =========================================================
   VIEW LAB TEST
========================================================= */

function viewLabTest(testId) {

    window.location.href =
        "test-details.html?id=" +
        encodeURIComponent(testId);

}


/* =========================================================
   LOAD TEST DETAILS
========================================================= */

function loadTestDetails() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const testId =
        params.get("id") ||
        params.get("orderId");


    if (!testId) {

        return;

    }


    const tests =
        getLabTests();


    const test =
        tests.find(
            item =>
                item.id === testId
        );


    if (!test) {

        alert(
            "Laboratory test not found."
        );

        return;

    }


    const orderId =
        document.getElementById(
            "orderId"
        );

    const patientName =
        document.getElementById(
            "patientName"
        );

    const patientId =
        document.getElementById(
            "patientId"
        );

    const doctorName =
        document.getElementById(
            "doctorName"
        );

    const testName =
        document.getElementById(
            "testName"
        );

    const testDate =
        document.getElementById(
            "testDate"
        );

    const testStatus =
        document.getElementById(
            "testStatus"
        );

    const testPriority =
        document.getElementById(
            "testPriority"
        );

    const testNotes =
        document.getElementById(
            "testNotes"
        );


    if (orderId)
        orderId.textContent =
            test.id;


    if (patientName)
        patientName.textContent =
            test.patientName;


    if (patientId)
        patientId.textContent =
            test.patientId;


    if (doctorName)
        doctorName.textContent =
            test.doctorName;


    if (testName)
        testName.textContent =
            test.testName;


    if (testDate)
        testDate.textContent =
            test.testDate;


    if (testStatus)
        testStatus.textContent =
            test.status;


    if (testPriority)
        testPriority.textContent =
            test.priority;


    if (testNotes)
        testNotes.textContent =
            test.notes || "No notes";

}


/* =========================================================
   GO TO RESULTS
========================================================= */

function goToResults() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const testId =
        params.get("id") ||
        params.get("orderId");


    if (!testId) {

        alert(
            "Test ID not found."
        );

        return;

    }


    window.location.href =
        "enter-results.html?orderId=" +
        encodeURIComponent(testId);

}


/* =========================================================
   LOAD RESULT TEST
========================================================= */

function loadResultTest() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const orderId =
        params.get("orderId") ||
        params.get("id");


    if (!orderId) {

        return;

    }


    const tests =
        getLabTests();


    const test =
        tests.find(
            item =>
                item.id === orderId
        );


    if (!test) {

        return;

    }


    const orderIdElement =
        document.getElementById(
            "orderId"
        );

    const patientName =
        document.getElementById(
            "patientName"
        );

    const testName =
        document.getElementById(
            "testName"
        );


    if (orderIdElement) {

        orderIdElement.value =
            test.id;

        orderIdElement.textContent =
            test.id;

    }


    if (patientName) {

        patientName.value =
            test.patientName;

        patientName.textContent =
            test.patientName;

    }


    if (testName) {

        testName.value =
            test.testName;

        testName.textContent =
            test.testName;

    }

}


/* =========================================================
   SAVE LAB RESULT
========================================================= */

function saveLabResult(event) {

    event.preventDefault();


    const orderIdElement =
        document.getElementById(
            "orderId"
        );


    const patientNameElement =
        document.getElementById(
            "patientName"
        );


    const testNameElement =
        document.getElementById(
            "testName"
        );


    const testResultElement =
        document.getElementById(
            "testResult"
        );


    const remarksElement =
        document.getElementById(
            "remarks"
        );


    const orderId =
        orderIdElement?.value ||
        orderIdElement?.textContent.trim();


    const patientName =
        patientNameElement?.value ||
        patientNameElement?.textContent.trim();


    const testName =
        testNameElement?.value ||
        testNameElement?.textContent.trim();


    const testResult =
        testResultElement?.value.trim();


    const remarks =
        remarksElement?.value.trim() ||
        "";


    if (
        !orderId ||
        !testResult
    ) {

        alert(
            "Please enter the test result."
        );

        return;

    }


    const tests =
        getLabTests();


    const index =
        tests.findIndex(
            test =>
                test.id === orderId
        );


    if (index === -1) {

        alert(
            "Laboratory test not found."
        );

        return;

    }


    tests[index].patientName =
        patientName ||
        tests[index].patientName;


    tests[index].testName =
        testName ||
        tests[index].testName;


    tests[index].result =
        testResult;


    tests[index].remarks =
        remarks;


    tests[index].status =
        "Completed";


    tests[index].completedAt =
        new Date().toISOString();


    saveLabTests(tests);


    alert(
        "Lab result saved successfully."
    );


    window.location.href =
        "completed-tests.html";

}


/* =========================================================
   LOAD COMPLETED TESTS
========================================================= */

function loadCompletedTests() {

    const table =
        document.getElementById(
            "completedTestsTable"
        );


    if (!table) {

        return;

    }


    let tbody =
        document.getElementById(
            "completedTestsBody"
        );


    /*
       If the completed page does not
       have an ID on tbody, find it.
    */

    if (!tbody) {

        tbody =
            table.querySelector(
                "tbody"
            );

    }


    if (!tbody) {

        return;

    }


    tbody.innerHTML = "";


    const tests =
        getLabTests();


    const completedTests =
        tests.filter(
            test =>
                test.status === "Completed"
        );


    if (completedTests.length === 0) {

        const row =
            tbody.insertRow();


        const cell =
            row.insertCell();


        cell.colSpan = 7;

        cell.textContent =
            "No completed laboratory tests.";

        return;

    }


    completedTests.forEach(
        function (test) {


            const row =
                tbody.insertRow();


            row.classList.add(
                "dynamic-lab-row"
            );


            row.insertCell(0)
                .textContent =
                test.id;


            row.insertCell(1)
                .textContent =
                test.patientName;


            row.insertCell(2)
                .textContent =
                test.testName;


            row.insertCell(3)
                .textContent =
                test.testDate;


            row.insertCell(4)
                .textContent =
                test.result;


            row.insertCell(5)
                .textContent =
                test.status;


            const actionCell =
                row.insertCell(6);


            const viewButton =
                document.createElement(
                    "button"
                );


            viewButton.type =
                "button";


            viewButton.textContent =
                "View";


            viewButton.className =
                "btn btn-secondary";


            viewButton.addEventListener(
                "click",
                function () {

                    viewLabTest(
                        test.id
                    );

                }
            );


            actionCell.appendChild(
                viewButton
            );

        }
    );

}


/* =========================================================
   LAB BILL CALCULATION
========================================================= */

function calculateLabBill() {

    const testElement =
        document.getElementById(
            "labTest"
        );


    const quantityElement =
        document.getElementById(
            "labQuantity"
        );


    const totalElement =
        document.getElementById(
            "labTotal"
        );


    if (
        !testElement ||
        !quantityElement ||
        !totalElement
    ) {

        return;

    }


    /*
       Example prices.
       You can change these according
       to your project requirements.
    */

    const prices = {

        "Blood Sugar": 150,

        "CBC": 300,

        "Urine Test": 200,

        "Lipid Profile": 500,

        "Liver Function Test": 600,

        "Kidney Function Test": 550,

        "Thyroid Test": 450

    };


    const testName =
        testElement.value;


    const quantity =
        Number(
            quantityElement.value
        ) || 0;


    const price =
        prices[testName] || 0;


    const total =
        price * quantity;


    totalElement.value =
        total.toFixed(2);

}


/* =========================================================
   GENERATE LAB BILL
========================================================= */

function generateLabBill(event) {

    event.preventDefault();


    const patientName =
        document.getElementById(
            "patientName"
        )?.value.trim();


    const labTest =
        document.getElementById(
            "labTest"
        )?.value;


    const quantity =
        document.getElementById(
            "labQuantity"
        )?.value;


    const labTotal =
        document.getElementById(
            "labTotal"
        )?.value;


    const message =
        document.getElementById(
            "billMessage"
        );


    if (
        !patientName ||
        !labTest ||
        !quantity
    ) {

        alert(
            "Please fill in all billing details."
        );

        return;

    }


    if (message) {

        message.innerHTML =

            "<strong>Bill Generated Successfully</strong><br>" +

            "Patient: " +
            patientName +

            "<br>Test: " +
            labTest +

            "<br>Quantity: " +
            quantity +

            "<br>Total: ₹" +
            labTotal;

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function goToCompletedTests() {

    window.location.href =
        "completed-tests.html";

}


function goToBilling() {

    window.location.href =
        "lab-billing.html";

}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* Dashboard */

        updateLabDashboard();


        /* Pending Tests */

        loadPendingLabOrders();


        /* Completed Tests */

        loadCompletedTests();


        /* Test Details */

        loadTestDetails();


        /* Enter Results */

        loadResultTest();


        /* Billing */

        calculateLabBill();


    }
);