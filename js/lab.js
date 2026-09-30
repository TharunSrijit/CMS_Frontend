/* =========================================================
   CLINIC MANAGEMENT SYSTEM
   LABORATORY MODULE
   =========================================================
   Storage:
   - cms_lab_tests   -> Admin Lab Test Master
   - cms_lab_orders  -> Laboratory Orders
   - cms_billing     -> Common Billing

   Status flow:
   ORDERED
      ↓
   SAMPLE_COLLECTED
      ↓
   PROCESSING
      ↓
   COMPLETED
   ========================================================= */


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const LAB_TEST_MASTER_KEY = "cms_lab_tests";
const LAB_ORDERS_KEY = "cms_lab_orders";
const BILLING_KEY = "cms_billing";

let labOrders = [];


/* =========================================================
   GENERIC STORAGE HELPERS
   ========================================================= */

function readJSON(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return fallback;
    }

    const parsed = JSON.parse(data);

    return parsed ?? fallback;
  } catch (error) {
    console.error("Error reading localStorage:", key, error);
    return fallback;
  }
}


function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Error writing localStorage:", key, error);
    return false;
  }
}


/* =========================================================
   BASIC UI HELPERS
   ========================================================= */

function setElementValue(id, value) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  if ("value" in element) {
    element.value = value ?? "";
  } else {
    element.textContent = value ?? "";
  }
}


function getElementValue(id) {
  const element = document.getElementById(id);

  if (!element) {
    return "";
  }

  if ("value" in element) {
    return String(element.value || "").trim();
  }

  return String(element.textContent || "").trim();
}


function setElementText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value ?? "";
  }
}


function showMessage(id, message, type = "success") {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.textContent = message;

  element.classList.remove(
    "success",
    "error",
    "warning",
    "message-success",
    "message-error",
    "message-warning"
  );

  if (type === "error") {
    element.classList.add("error", "message-error");
  } else if (type === "warning") {
    element.classList.add("warning", "message-warning");
  } else {
    element.classList.add("success", "message-success");
  }
}


function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatCurrency(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0.00";
  }

  return "₹" + value.toFixed(2);
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString();
}


function formatDateTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleString();
}


function getTodayString() {
  const now = new Date();

  return (
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0")
  );
}


/* =========================================================
   SIDEBAR
   ========================================================= */

function toggleSidebar() {
  const sidebar = document.getElementById("menu");

  if (sidebar) {
    sidebar.classList.toggle("open");
  }
}


/* =========================================================
   ADMIN LAB TEST MASTER
   ========================================================= */

function getLabTestMaster() {
  const tests = readJSON(LAB_TEST_MASTER_KEY, []);

  if (!Array.isArray(tests)) {
    return [];
  }

  return tests.map(function (test) {
    return {
      id:
        test.id ??
        test.testId ??
        "",

      name:
        test.name ??
        test.testName ??
        "",

      category:
        test.category ??
        "",

      description:
        test.description ??
        "",

      price:
        Number(
          test.price ??
          test.amount ??
          0
        ),

      status:
        test.status ??
        "Active",

      normalRange:
        test.normalRange ??
        "",

      unit:
        test.unit ??
        ""
    };
  });
}


function getActiveLabTests() {
  return getLabTestMaster().filter(function (test) {
    return String(test.status).toLowerCase() === "active";
  });
}


function findMasterTest(testId) {
  if (!testId) {
    return null;
  }

  const tests = getLabTestMaster();

  return (
    tests.find(function (test) {
      return String(test.id) === String(testId);
    }) || null
  );
}


function findMasterTestByName(testName) {
  if (!testName) {
    return null;
  }

  const searchName =
    String(testName).trim().toLowerCase();

  const tests = getLabTestMaster();

  return (
    tests.find(function (test) {
      return (
        String(test.name)
          .trim()
          .toLowerCase() === searchName
      );
    }) || null
  );
}


/* =========================================================
   LAB ORDER STORAGE
   ========================================================= */

function loadLabOrdersFromStorage() {
  const storedOrders =
    readJSON(LAB_ORDERS_KEY, []);

  if (!Array.isArray(storedOrders)) {
    return [];
  }

  return storedOrders.map(function (order) {
    const masterTest =
      findMasterTest(order.testId);

    return {
      ...order,

      orderNumber:
        order.orderNumber ||
        order.id ||
        "",

      testId:
        order.testId ||
        "",

      testName:
        order.testName ||
        (masterTest ? masterTest.name : "") ||
        "",

      category:
        order.category ||
        (masterTest ? masterTest.category : "") ||
        "",

      description:
        order.description ||
        (masterTest ? masterTest.description : "") ||
        "",

      /*
       * IMPORTANT:
       * Do not replace an existing order price with
       * the current Admin price.
       *
       * Old orders keep their historical price.
       */
      price:
        order.price ??
        (
          masterTest
            ? masterTest.price
            : 0
        ),

      normalRange:
        order.normalRange ??
        (masterTest ? masterTest.normalRange : "") ??
        "",

      unit:
        order.unit ??
        (masterTest ? masterTest.unit : "") ??
        ""
    };
  });
}


function saveLabOrders() {
  return writeJSON(
    LAB_ORDERS_KEY,
    labOrders
  );
}


function findOrder(orderNumber) {
  const orders =
    loadLabOrdersFromStorage();

  return (
    orders.find(function (order) {
      return (
        String(
          order.orderNumber || order.id
        ) === String(orderNumber)
      );
    }) || null
  );
}


/* =========================================================
   ORDER NUMBER
   ========================================================= */

function generateOrderNumber() {
  const orders =
    loadLabOrdersFromStorage();

  let highest = 0;

  orders.forEach(function (order) {
    const number = String(
      order.orderNumber ||
      order.id ||
      ""
    );

    const match =
      number.match(/(\d+)$/);

    if (match) {
      highest =
        Math.max(
          highest,
          Number(match[1])
        );
    }
  });

  return (
    "ORD" +
    String(highest + 1).padStart(4, "0")
  );
}


/* =========================================================
   ADD NEW LAB TEST / ORDER
   ========================================================= */

function addNewLabTest(event) {
  if (event) {
    event.preventDefault();
  }

  const patientName =
    getElementValue("patientName");

  const patientId =
    getElementValue("patientId");

  const doctorName =
    getElementValue("doctorName");

  const testId =
    getElementValue("testId") ||
    getElementValue("labTest");

  const testNameInput =
    getElementValue("testName");

  const testDate =
    getElementValue("testDate") ||
    getTodayString();

  const priority =
    getElementValue("priority") ||
    "Normal";

  const notes =
    getElementValue("notes");

  if (!patientName) {
    showMessage(
      "message",
      "Please enter patient name.",
      "error"
    );
    return false;
  }

  if (!patientId) {
    showMessage(
      "message",
      "Please enter patient ID.",
      "error"
    );
    return false;
  }

  if (!doctorName) {
    showMessage(
      "message",
      "Please enter doctor name.",
      "error"
    );
    return false;
  }

  let masterTest =
    findMasterTest(testId);

  /*
   * Compatibility with older HTML forms
   * that use test name instead of test ID.
   */
  if (!masterTest && testNameInput) {
    masterTest =
      findMasterTestByName(testNameInput);
  }

  if (!masterTest) {
    showMessage(
      "message",
      "Please select a valid laboratory test.",
      "error"
    );
    return false;
  }

  /*
   * Only Active Admin tests can be used
   * for creating a new laboratory order.
   */
  if (
    String(masterTest.status).toLowerCase() !==
    "active"
  ) {
    showMessage(
      "message",
      "This laboratory test is inactive and cannot be ordered.",
      "error"
    );
    return false;
  }

  const now =
    new Date().toISOString();

  const order = {
    orderNumber:
      generateOrderNumber(),

    id:
      generateOrderNumber(),

    patientName:
      patientName,

    patientId:
      patientId,

    doctorName:
      doctorName,

    testId:
      masterTest.id,

    testName:
      masterTest.name,

    category:
      masterTest.category,

    description:
      masterTest.description,

    /*
     * Snapshot the current Admin price.
     */
    price:
      Number(masterTest.price || 0),

    normalRange:
      masterTest.normalRange,

    unit:
      masterTest.unit,

    orderDate:
      testDate,

    createdAt:
      now,

    priority:
      priority,

    notes:
      notes,

    status:
      "ORDERED",

    sampleCollectedAt:
      "",

    processingStartedAt:
      "",

    completedAt:
      "",

    result:
      "",

    remarks:
      "",

    resultEnteredAt:
      "",

    resultEnteredBy:
      ""
  };

  /*
   * Fix the duplicated generated number in id.
   */
  order.id =
    order.orderNumber;

  labOrders =
    loadLabOrdersFromStorage();

  labOrders.push(order);

  if (!saveLabOrders()) {
    showMessage(
      "message",
      "Unable to save laboratory order.",
      "error"
    );
    return false;
  }

  showMessage(
    "message",
    "Laboratory test added successfully.",
    "success"
  );

  /*
   * Clear form if it exists.
   */
  const form =
    event &&
    event.target &&
    event.target.tagName === "FORM"
      ? event.target
      : null;

  if (form) {
    form.reset();
  }

  /*
   * Keep the new order visible immediately.
   */
  labOrders =
    loadLabOrdersFromStorage();

  if (
    document.getElementById("pendingCount")
  ) {
    loadDashboard();
  }

  return order;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function loadDashboard() {
  const orders =
    loadLabOrdersFromStorage();

  const pending =
    orders.filter(function (order) {
      return [
        "ORDERED",
        "SAMPLE_COLLECTED",
        "PROCESSING"
      ].includes(order.status);
    });

  const completed =
    orders.filter(function (order) {
      return order.status === "COMPLETED";
    });

  const today =
    getTodayString();

  const todayTests =
    orders.filter(function (order) {
      const date =
        String(
          order.orderDate ||
          order.testDate ||
          ""
        ).substring(0, 10);

      return date === today;
    });

  setElementText(
    "pendingCount",
    pending.length
  );

  setElementText(
    "completedCount",
    completed.length
  );

  setElementText(
    "todayTestCount",
    todayTests.length
  );

  setElementText(
    "totalTestCount",
    orders.length
  );
}


/*
 * Compatibility name used by older dashboard code.
 */
function updateLabDashboard() {
  loadDashboard();
}


/* =========================================================
   PENDING ORDERS
   ========================================================= */

function loadPendingLabOrders() {
  const table =
    document.getElementById(
      "pendingTestsTable"
    );

  if (!table) {
    return;
  }

  const tbody =
    document.getElementById(
      "pendingTestsBody"
    ) ||
    table.querySelector("tbody");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  const orders =
    loadLabOrdersFromStorage()
      .filter(function (order) {
        return [
          "ORDERED",
          "SAMPLE_COLLECTED",
          "PROCESSING"
        ].includes(order.status);
      });

  orders.forEach(function (order) {

    const row =
      tbody.insertRow();

    row.insertCell().textContent =
      order.orderNumber || order.id;

    row.insertCell().textContent =
      order.patientName;

    row.insertCell().textContent =
      order.doctorName;

    row.insertCell().textContent =
      order.testName;

    row.insertCell().textContent =
      formatDate(
        order.orderDate
      );

    row.insertCell().textContent =
      order.priority || "Normal";

    row.insertCell().textContent =
      getStatusLabel(order.status);

    const actionCell =
      row.insertCell();

    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "btn btn-primary";
    button.textContent =
      "View";

    button.onclick =
      function () {
        viewLabTest(
          order.orderNumber ||
          order.id
        );
      };

    actionCell.appendChild(button);
  });
}


/* =========================================================
   TEST DETAILS
   ========================================================= */

function loadTestDetails() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const orderNumber =
    params.get("orderId") ||
    params.get("id");

  if (!orderNumber) {
    return;
  }

  const order =
    findOrder(orderNumber);

  if (!order) {
    showMessage(
      "message",
      "Laboratory order not found.",
      "error"
    );
    return;
  }

  setElementValue(
    "orderId",
    order.orderNumber || order.id
  );

  setElementValue(
    "patientName",
    order.patientName
  );

  setElementValue(
    "patientId",
    order.patientId
  );

  setElementValue(
    "doctorName",
    order.doctorName
  );

  setElementValue(
    "testName",
    order.testName
  );

  setElementValue(
    "testId",
    order.testId
  );

  setElementValue(
    "testDate",
    order.orderDate
  );

  setElementValue(
    "testStatus",
    getStatusLabel(order.status)
  );

  setElementValue(
    "testPriority",
    order.priority
  );

  setElementValue(
    "testCategory",
    order.category
  );

  setElementValue(
    "testDescription",
    order.description
  );

  setElementValue(
    "testPrice",
    order.price
  );

  setElementValue(
    "testNotes",
    order.notes
  );

  setElementValue(
    "testResult",
    order.result
  );

  setElementValue(
    "testRemarks",
    order.remarks
  );

  setElementValue(
    "normalRange",
    order.normalRange
  );

  setElementValue(
    "testUnit",
    order.unit
  );

  setElementText(
    "testStatusText",
    getStatusLabel(order.status)
  );
}


/* =========================================================
   VIEW ORDER
   ========================================================= */

function viewLabTest(orderNumber) {
  window.location.href =
    "test-details.html?orderId=" +
    encodeURIComponent(orderNumber);
}


/* =========================================================
   SAMPLE COLLECTION
   ========================================================= */

function collectSample(orderNumber) {
  const orders =
    loadLabOrdersFromStorage();

  const index =
    orders.findIndex(function (order) {
      return (
        String(
          order.orderNumber ||
          order.id
        ) === String(orderNumber)
      );
    });

  if (index === -1) {
    alert("Laboratory order not found.");
    return null;
  }

  const order =
    orders[index];

  if (order.status !== "ORDERED") {
    alert(
      "Sample can only be collected for an ordered test."
    );
    return null;
  }

  const now =
    new Date().toISOString();

  order.status =
    "SAMPLE_COLLECTED";

  order.sampleCollectedAt =
    now;

  order.updatedAt =
    now;

  writeJSON(
    LAB_ORDERS_KEY,
    orders
  );

  labOrders =
    orders;

  return order;
}


/* =========================================================
   START PROCESSING
   ========================================================= */

function startLabProcessing(orderNumber) {
  const orders =
    loadLabOrdersFromStorage();

  const index =
    orders.findIndex(function (order) {
      return (
        String(
          order.orderNumber ||
          order.id
        ) === String(orderNumber)
      );
    });

  if (index === -1) {
    alert("Laboratory order not found.");
    return null;
  }

  const order =
    orders[index];

  if (
    order.status !==
    "SAMPLE_COLLECTED"
  ) {
    alert(
      "Processing can only start after sample collection."
    );
    return null;
  }

  const now =
    new Date().toISOString();

  order.status =
    "PROCESSING";

  order.processingStartedAt =
    now;

  order.updatedAt =
    now;

  writeJSON(
    LAB_ORDERS_KEY,
    orders
  );

  labOrders =
    orders;

  return order;
}


/* =========================================================
   RESULT PAGE
   ========================================================= */

function goToResults(orderNumber) {
  const id =
    orderNumber ||
    getElementValue("orderId");

  if (!id) {
    return;
  }

  window.location.href =
    "enter-results.html?orderId=" +
    encodeURIComponent(id);
}


function loadResultTest() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const orderNumber =
    params.get("orderId") ||
    params.get("id");

  if (!orderNumber) {
    return;
  }

  const order =
    findOrder(orderNumber);

  if (!order) {
    showMessage(
      "message",
      "Laboratory order not found.",
      "error"
    );
    return;
  }

  setElementValue(
    "orderId",
    order.orderNumber || order.id
  );

  setElementValue(
    "patientName",
    order.patientName
  );

  setElementValue(
    "patientId",
    order.patientId
  );

  setElementValue(
    "doctorName",
    order.doctorName
  );

  setElementValue(
    "testName",
    order.testName
  );

  setElementValue(
    "testId",
    order.testId
  );

  setElementValue(
    "normalRange",
    order.normalRange
  );

  setElementValue(
    "testUnit",
    order.unit
  );

  setElementValue(
    "testResult",
    order.result
  );

  setElementValue(
    "result",
    order.result
  );

  setElementValue(
    "remarks",
    order.remarks
  );
}


/* =========================================================
   SAVE LAB RESULT
   ========================================================= */

function saveLabResult(event) {
  if (event) {
    event.preventDefault();
  }

  const orderNumber =
    getElementValue("orderId") ||
    new URLSearchParams(
      window.location.search
    ).get("orderId");

  const result =
    getElementValue("testResult") ||
    getElementValue("result");

  const remarks =
    getElementValue("testRemarks") ||
    getElementValue("remarks");

  if (!orderNumber) {
    showMessage(
      "message",
      "Order ID is required.",
      "error"
    );
    return false;
  }

  if (!result) {
    showMessage(
      "message",
      "Please enter the laboratory result.",
      "error"
    );
    return false;
  }

  const orders =
    loadLabOrdersFromStorage();

  const index =
    orders.findIndex(function (order) {
      return (
        String(
          order.orderNumber ||
          order.id
        ) === String(orderNumber)
      );
    });

  if (index === -1) {
    showMessage(
      "message",
      "Laboratory order not found.",
      "error"
    );
    return false;
  }

  const order =
    orders[index];

  if (
    order.status === "ORDERED"
  ) {
    showMessage(
      "message",
      "Sample must be collected before entering results.",
      "error"
    );
    return false;
  }

  const now =
    new Date().toISOString();

  order.result =
    result;

  order.remarks =
    remarks;

  order.status =
    "COMPLETED";

  order.completedAt =
    now;

  order.resultEnteredAt =
    now;

  order.resultEnteredBy =
    getElementValue(
      "resultEnteredBy"
    ) ||
    "Lab Technician";

  order.updatedAt =
    now;

  writeJSON(
    LAB_ORDERS_KEY,
    orders
  );

  labOrders =
    orders;

  showMessage(
    "message",
    "Laboratory result saved successfully.",
    "success"
  );

  /*
   * Redirect after a short delay so the
   * success message can be seen.
   */
  setTimeout(function () {
    window.location.href =
      "completed-tests.html";
  }, 500);

  return true;
}


/* =========================================================
   COMPLETED TESTS
   ========================================================= */

function loadCompletedTests() {
  const table =
    document.getElementById(
      "completedTestsTable"
    );

  if (!table) {
    return;
  }

  const tbody =
    document.getElementById(
      "completedTestsBody"
    ) ||
    table.querySelector("tbody");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  const orders =
    loadLabOrdersFromStorage()
      .filter(function (order) {
        return order.status === "COMPLETED";
      });

  orders.forEach(function (order) {

    const row =
      tbody.insertRow();

    row.insertCell().textContent =
      order.orderNumber || order.id;

    row.insertCell().textContent =
      order.patientName;

    row.insertCell().textContent =
      order.testName;

    row.insertCell().textContent =
      formatDate(
        order.orderDate
      );

    row.insertCell().textContent =
      order.result || "";

    row.insertCell().textContent =
      "Completed";

    const actionCell =
      row.insertCell();

    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "btn btn-primary";

    button.textContent =
      "View";

    button.onclick =
      function () {
        window.location.href =
          "test-details.html?orderId=" +
          encodeURIComponent(
            order.orderNumber ||
            order.id
          );
      };

    actionCell.appendChild(
      button
    );
  });
}


/* =========================================================
   COMPLETED TEST DETAILS
   ========================================================= */

function loadCompletedTestDetails() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const orderNumber =
    params.get("orderId") ||
    params.get("id");

  if (!orderNumber) {
    return;
  }

  const order =
    findOrder(orderNumber);

  if (!order) {
    return;
  }

  setElementValue(
    "orderId",
    order.orderNumber || order.id
  );

  setElementValue(
    "patientName",
    order.patientName
  );

  setElementValue(
    "patientId",
    order.patientId
  );

  setElementValue(
    "doctorName",
    order.doctorName
  );

  setElementValue(
    "testName",
    order.testName
  );

  setElementValue(
    "testCategory",
    order.category
  );

  setElementValue(
    "testResult",
    order.result
  );

  setElementValue(
    "completedResult",
    order.result
  );

  setElementValue(
    "testRemarks",
    order.remarks
  );

  setElementValue(
    "resultDetails",
    order.remarks
  );

  setElementValue(
    "normalRange",
    order.normalRange
  );

  setElementValue(
    "testUnit",
    order.unit
  );

  setElementValue(
    "resultEnteredBy",
    order.resultEnteredBy
  );

  setElementText(
    "completedAt",
    formatDateTime(
      order.completedAt
    )
  );
}


/* =========================================================
   BILLING
   ========================================================= */

function getBills() {
  const bills =
    readJSON(
      BILLING_KEY,
      []
    );

  return Array.isArray(bills)
    ? bills
    : [];
}


function saveBills(bills) {
  return writeJSON(
    BILLING_KEY,
    bills
  );
}


function generateLabBillNumber() {
  const bills =
    getBills();

  let highest =
    0;

  bills.forEach(function (bill) {

    const value =
      String(
        bill.billId ||
        bill.id ||
        ""
      );

    const match =
      value.match(
        /(\d+)$/
      );

    if (match) {
      highest =
        Math.max(
          highest,
          Number(match[1])
        );
    }
  });

  return (
    "LAB-BILL-" +
    String(
      highest + 1
    ).padStart(
      4,
      "0"
    )
  );
}


/* =========================================================
   BILLING TEST DROPDOWN
   ========================================================= */

function loadLabBillingTests() {
  const select =
    document.getElementById(
      "billingTest"
    ) ||
    document.getElementById(
      "labTest"
    );

  if (
    !select ||
    select.tagName !== "SELECT"
  ) {
    return;
  }

  const activeTests =
    getActiveLabTests();

  const currentValue =
    select.value;

  select.innerHTML =
    '<option value="">Select Laboratory Test</option>';

  activeTests.forEach(function (test) {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      test.id;

    option.textContent =
      test.name +
      " - " +
      formatCurrency(
        test.price
      );

    select.appendChild(
      option
    );
  });

  if (currentValue) {
    select.value =
      currentValue;
  }
}


/* =========================================================
   BILLING PRICE CALCULATION
   ========================================================= */

function getQuantity() {
  const quantity =
    Number(
      getElementValue(
        "labQuantity"
      ) ||
      getElementValue(
        "quantity"
      ) ||
      1
    );

  return quantity > 0
    ? quantity
    : 1;
}


function updateLabBillingPrice() {
  const testId =
    getElementValue(
      "billingTest"
    ) ||
    getElementValue(
      "labTest"
    );

  const test =
    findMasterTest(
      testId
    );

  if (!test) {
    return;
  }

  const quantity =
    getQuantity();

  const total =
    Number(test.price || 0) *
    quantity;

  setElementValue(
    "labPrice",
    test.price
  );

  setElementValue(
    "billingPrice",
    test.price
  );

  setElementValue(
    "labTotal",
    total.toFixed(2)
  );

  setElementValue(
    "totalAmount",
    total.toFixed(2)
  );
}


function updateBillingTotal() {
  updateLabBillingPrice();
}


function calculateLabBill() {
  updateLabBillingPrice();
}


/* =========================================================
   GENERATE LAB BILL
   ========================================================= */

function generateLabBill(event) {
  if (event) {
    event.preventDefault();
  }

  const patientName =
    getElementValue(
      "patientName"
    );

  const patientId =
    getElementValue(
      "patientId"
    );

  const doctorName =
    getElementValue(
      "doctorName"
    );

  const testId =
    getElementValue(
      "billingTest"
    ) ||
    getElementValue(
      "labTest"
    );

  if (!patientName) {
    showMessage(
      "billMessage",
      "Please enter patient name.",
      "error"
    );
    return false;
  }

  if (!testId) {
    showMessage(
      "billMessage",
      "Please select a laboratory test.",
      "error"
    );
    return false;
  }

  /*
   * Always retrieve the current Admin price
   * when creating a NEW bill.
   */
  const test =
    findMasterTest(
      testId
    );

  if (!test) {
    showMessage(
      "billMessage",
      "Laboratory test not found.",
      "error"
    );
    return false;
  }

  if (
    String(test.status).toLowerCase() !==
    "active"
  ) {
    showMessage(
      "billMessage",
      "This laboratory test is inactive.",
      "error"
    );
    return false;
  }

  const quantity =
    getQuantity();

  const unitPrice =
    Number(
      test.price || 0
    );

  const total =
    unitPrice *
    quantity;

  const now =
    new Date().toISOString();

  const billNumber =
    generateLabBillNumber();

  const bill = {

    billId:
      billNumber,

    id:
      billNumber,

    billType:
      "LAB",

    patientName:
      patientName,

    patientId:
      patientId,

    doctorName:
      doctorName,

    testId:
      test.id,

    testName:
      test.name,

    category:
      test.category,

    quantity:
      quantity,

    /*
     * Historical price snapshot.
     */
    price:
      unitPrice,

    unitPrice:
      unitPrice,

    total:
      total,

    amount:
      total,

    items: [
      {
        testId:
          test.id,

        testName:
          test.name,

        category:
          test.category,

        quantity:
          quantity,

        unitPrice:
          unitPrice,

        total:
          total
      }
    ],

    /*
     * Every new bill starts unpaid.
     */
    status:
      "Unpaid",

    paymentStatus:
      "Unpaid",

    paymentMethod:
      "",

    paymentReference:
      "",

    reference:
      "",

    billDate:
      now,

    createdAt:
      now,

    paidAt:
      ""
  };

  const bills =
    getBills();

  bills.push(
    bill
  );

  if (
    !saveBills(
      bills
    )
  ) {
    showMessage(
      "billMessage",
      "Unable to save laboratory bill.",
      "error"
    );
    return false;
  }

  setElementText(
    "billMessage",
    "Lab bill generated successfully. Bill No: " +
    billNumber
  );

  /*
   * Keep the message compatible with
   * existing project CSS.
   */
  const message =
    document.getElementById(
      "billMessage"
    );

  if (message) {
    message.classList.add(
      "success",
      "message-success"
    );
  }

  return bill;
}


/* =========================================================
   BILLING HISTORY
   ========================================================= */

function loadLabBillingHistory() {
  const table =
    document.getElementById(
      "labBillingTable"
    ) ||
    document.getElementById(
      "billingTable"
    );

  if (!table) {
    return;
  }

  const tbody =
    table.querySelector(
      "tbody"
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  const bills =
    getBills().filter(
      function (bill) {

        return (
          String(
            bill.billType || ""
          ).toUpperCase() ===
          "LAB"
        );
      }
    );

  bills.forEach(function (bill) {

    const row =
      tbody.insertRow();

    row.insertCell().textContent =
      bill.billId ||
      bill.id ||
      "";

    row.insertCell().textContent =
      bill.patientName ||
      "";

    row.insertCell().textContent =
      bill.testName ||
      (
        bill.items &&
        bill.items[0]
          ? bill.items[0].testName
          : ""
      );

    row.insertCell().textContent =
      formatCurrency(
        bill.total ??
        bill.amount ??
        0
      );

    row.insertCell().textContent =
      getBillStatusLabel(
        bill
      );

    row.insertCell().textContent =
      formatDate(
        bill.billDate ||
        bill.createdAt
      );

    const actionCell =
      row.insertCell();

    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "btn btn-primary";

    button.textContent =
      "View";

    button.onclick =
      function () {

        viewLabBill(
          bill.billId ||
          bill.id
        );
      };

    actionCell.appendChild(
      button
    );
  });
}


/* =========================================================
   VIEW BILL
   ========================================================= */

function viewLabBill(billId) {
  window.location.href =
    "lab-billing.html?billId=" +
    encodeURIComponent(
      billId
    );
}


/* =========================================================
   LOAD BILL DETAILS
   ========================================================= */

function loadLabBillDetails() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const billId =
    params.get("billId") ||
    params.get("id");

  if (!billId) {
    return;
  }

  const bills =
    getBills();

  const bill =
    bills.find(
      function (item) {
        return (
          String(
            item.billId ||
            item.id
          ) ===
          String(billId)
        );
      }
    );

  if (!bill) {
    showMessage(
      "billMessage",
      "Lab bill not found.",
      "error"
    );
    return;
  }

  setElementValue(
    "billId",
    bill.billId ||
    bill.id
  );

  setElementValue(
    "patientName",
    bill.patientName
  );

  setElementValue(
    "patientId",
    bill.patientId
  );

  setElementValue(
    "doctorName",
    bill.doctorName
  );

  setElementValue(
    "billingTest",
    bill.testId
  );

  setElementValue(
    "labTest",
    bill.testName
  );

  setElementValue(
    "labQuantity",
    bill.quantity ||
    (
      bill.items &&
      bill.items[0]
        ? bill.items[0].quantity
        : 1
    )
  );

  /*
   * IMPORTANT:
   * Old bill uses its own saved price.
   * Do not read the current Admin price here.
   */
  const historicalPrice =
    bill.price ??
    bill.unitPrice ??
    (
      bill.items &&
      bill.items[0]
        ? bill.items[0].unitPrice
        : 0
    );

  setElementValue(
    "labPrice",
    historicalPrice
  );

  setElementValue(
    "billingPrice",
    historicalPrice
  );

  setElementValue(
    "labTotal",
    bill.total ??
    bill.amount ??
    0
  );

  setElementValue(
    "totalAmount",
    bill.total ??
    bill.amount ??
    0
  );

  setElementValue(
    "paymentStatus",
    bill.paymentStatus ||
    bill.status ||
    "Unpaid"
  );

  setElementValue(
    "paymentMethod",
    bill.paymentMethod ||
    ""
  );

  setElementValue(
    "paymentReference",
    bill.paymentReference ||
    bill.reference ||
    ""
  );

  setElementText(
    "billDate",
    formatDateTime(
      bill.billDate ||
      bill.createdAt
    )
  );

  setElementText(
    "billStatus",
    bill.paymentStatus ||
    bill.status ||
    "Unpaid"
  );
}


/* =========================================================
   MARK BILL AS PAID
   ========================================================= */

function markLabBillPaid(
  billId,
  paymentMethod,
  paymentReference
) {
  const bills =
    getBills();

  const index =
    bills.findIndex(
      function (bill) {
        return (
          String(
            bill.billId ||
            bill.id
          ) ===
          String(billId)
        );
      }
    );

  if (index === -1) {
    return null;
  }

  const bill =
    bills[index];

  bill.status =
    "Paid";

  bill.paymentStatus =
    "Paid";

  bill.paymentMethod =
    paymentMethod ||
    "";

  bill.paymentReference =
    paymentReference ||
    "";

  bill.reference =
    paymentReference ||
    "";

  bill.paidAt =
    new Date().toISOString();

  saveBills(
    bills
  );

  return bill;
}


/* =========================================================
   PROCESS BILL PAYMENT
   ========================================================= */

function processLabBillPayment(event) {
  if (event) {
    event.preventDefault();
  }

  const billId =
    getElementValue(
      "billId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("billId") ||
    new URLSearchParams(
      window.location.search
    ).get("id");

  const paymentMethod =
    getElementValue(
      "paymentMethod"
    );

  const paymentReference =
    getElementValue(
      "paymentReference"
    ) ||
    getElementValue(
      "reference"
    );

  if (!billId) {
    showMessage(
      "paymentMessage",
      "Bill ID is required.",
      "error"
    );
    return false;
  }

  if (!paymentMethod) {
    showMessage(
      "paymentMessage",
      "Please select a payment method.",
      "error"
    );
    return false;
  }

  const bill =
    markLabBillPaid(
      billId,
      paymentMethod,
      paymentReference
    );

  if (!bill) {
    showMessage(
      "paymentMessage",
      "Bill could not be updated.",
      "error"
    );
    return false;
  }

  setElementValue(
    "paymentStatus",
    "Paid"
  );

  setElementText(
    "billStatus",
    "Paid"
  );

  showMessage(
    "paymentMessage",
    "Lab bill marked as paid successfully.",
    "success"
  );

  return true;
}


/* =========================================================
   PRINT LAB BILL
   ========================================================= */

function printLabBill(billId) {

  const id =
    billId ||
    getElementValue(
      "billId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("billId") ||
    new URLSearchParams(
      window.location.search
    ).get("id");

  if (!id) {
    alert(
      "Bill ID not found."
    );
    return;
  }

  const bill =
    getBills().find(
      function (item) {
        return (
          String(
            item.billId ||
            item.id
          ) ===
          String(id)
        );
      }
    );

  if (!bill) {
    alert(
      "Lab bill not found."
    );
    return;
  }

  const item =
    bill.items &&
    bill.items.length
      ? bill.items[0]
      : null;

  const testName =
    bill.testName ||
    (
      item
        ? item.testName
        : ""
    );

  const quantity =
    bill.quantity ||
    (
      item
        ? item.quantity
        : 1
    );

  const unitPrice =
    bill.price ??
    bill.unitPrice ??
    (
      item
        ? item.unitPrice
        : 0
    );

  const total =
    bill.total ??
    bill.amount ??
    Number(unitPrice) *
    Number(quantity);

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

  if (!printWindow) {
    alert(
      "Please allow pop-ups to print the bill."
    );
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Laboratory Bill</title>
    </head>

    <body>

      <h2>Clinic Management System</h2>

      <h3>Laboratory Bill</h3>

      <hr>

      <p>
        <strong>Bill No:</strong>
        ${escapeHTML(
          bill.billId ||
          bill.id ||
          ""
        )}
      </p>

      <p>
        <strong>Date:</strong>
        ${escapeHTML(
          formatDateTime(
            bill.billDate ||
            bill.createdAt
          )
        )}
      </p>

      <p>
        <strong>Patient Name:</strong>
        ${escapeHTML(
          bill.patientName ||
          ""
        )}
      </p>

      <p>
        <strong>Patient ID:</strong>
        ${escapeHTML(
          bill.patientId ||
          ""
        )}
      </p>

      <p>
        <strong>Doctor:</strong>
        ${escapeHTML(
          bill.doctorName ||
          ""
        )}
      </p>

      <hr>

      <table
        border="1"
        cellpadding="8"
        cellspacing="0"
        width="100%"
      >

        <thead>
          <tr>
            <th>Laboratory Test</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              ${escapeHTML(testName)}
            </td>

            <td>
              ${escapeHTML(quantity)}
            </td>

            <td>
              ${escapeHTML(
                formatCurrency(
                  unitPrice
                )
              )}
            </td>

            <td>
              ${escapeHTML(
                formatCurrency(
                  total
                )
              )}
            </td>
          </tr>
        </tbody>

      </table>

      <h3>
        Total Amount:
        ${escapeHTML(
          formatCurrency(total)
        )}
      </h3>

      <p>
        <strong>Payment Status:</strong>
        ${escapeHTML(
          bill.paymentStatus ||
          bill.status ||
          "Unpaid"
        )}
      </p>

      <p>
        <strong>Payment Method:</strong>
        ${escapeHTML(
          bill.paymentMethod ||
          ""
        )}
      </p>

      <p>
        <strong>Payment Reference:</strong>
        ${escapeHTML(
          bill.paymentReference ||
          bill.reference ||
          ""
        )}
      </p>

      <hr>

      <p>
        Laboratory Department
      </p>

    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(
    function () {
      printWindow.print();
    },
    250
  );
}


/* =========================================================
   PRINT LAB RESULT
   ========================================================= */

function printLabResult(orderNumber) {

  const id =
    orderNumber ||
    getElementValue(
      "orderId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("orderId") ||
    new URLSearchParams(
      window.location.search
    ).get("id");

  if (!id) {
    alert(
      "Order ID not found."
    );
    return;
  }

  const order =
    findOrder(id);

  if (!order) {
    alert(
      "Laboratory order not found."
    );
    return;
  }

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

  if (!printWindow) {
    alert(
      "Please allow pop-ups to print the result."
    );
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Laboratory Result</title>
    </head>

    <body>

      <h2>Clinic Management System</h2>

      <h3>Laboratory Test Report</h3>

      <hr>

      <p>
        <strong>Order No:</strong>
        ${escapeHTML(
          order.orderNumber ||
          order.id ||
          ""
        )}
      </p>

      <p>
        <strong>Patient Name:</strong>
        ${escapeHTML(
          order.patientName ||
          ""
        )}
      </p>

      <p>
        <strong>Patient ID:</strong>
        ${escapeHTML(
          order.patientId ||
          ""
        )}
      </p>

      <p>
        <strong>Doctor:</strong>
        ${escapeHTML(
          order.doctorName ||
          ""
        )}
      </p>

      <p>
        <strong>Test:</strong>
        ${escapeHTML(
          order.testName ||
          ""
        )}
      </p>

      <p>
        <strong>Category:</strong>
        ${escapeHTML(
          order.category ||
          ""
        )}
      </p>

      <p>
        <strong>Test Date:</strong>
        ${escapeHTML(
          formatDate(
            order.orderDate
          )
        )}
      </p>

      <hr>

      <table
        border="1"
        cellpadding="10"
        cellspacing="0"
        width="100%"
      >

        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Normal Range</th>
            <th>Unit</th>
          </tr>
        </thead>

        <tbody>
          <tr>

            <td>
              ${escapeHTML(
                order.testName ||
                ""
              )}
            </td>

            <td>
              ${escapeHTML(
                order.result ||
                ""
              )}
            </td>

            <td>
              ${escapeHTML(
                order.normalRange ||
                ""
              )}
            </td>

            <td>
              ${escapeHTML(
                order.unit ||
                ""
              )}
            </td>

          </tr>
        </tbody>

      </table>

      <br>

      <p>
        <strong>Remarks:</strong>
        ${escapeHTML(
          order.remarks ||
          ""
        )}
      </p>

      <p>
        <strong>Result Entered By:</strong>
        ${escapeHTML(
          order.resultEnteredBy ||
          "Lab Technician"
        )}
      </p>

      <p>
        <strong>Completed:</strong>
        ${escapeHTML(
          formatDateTime(
            order.completedAt
          )
        )}
      </p>

      <hr>

      <p>
        Laboratory Department
      </p>

    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(
    function () {
      printWindow.print();
    },
    250
  );
}


/* =========================================================
   NEW TEST DROPDOWN
   ========================================================= */

function populateLabTestSelect() {

  const selects = [
    document.getElementById("testId"),
    document.getElementById("billingTest"),
    document.getElementById("labTest")
  ];

  const activeTests =
    getActiveLabTests();

  selects.forEach(
    function (select) {

      if (
        !select ||
        select.tagName !== "SELECT"
      ) {
        return;
      }

      const currentValue =
        select.value;

      select.innerHTML =
        '<option value="">Select Laboratory Test</option>';

      activeTests.forEach(
        function (test) {

          const option =
            document.createElement(
              "option"
            );

          option.value =
            test.id;

          option.textContent =
            test.name +
            " - " +
            formatCurrency(
              test.price
            );

          select.appendChild(
            option
          );
        }
      );

      if (currentValue) {
        select.value =
          currentValue;
      }
    }
  );
}


/* =========================================================
   SELECTED TEST DETAILS
   ========================================================= */

function updateSelectedLabTestDetails() {

  const select =
    document.getElementById(
      "testId"
    ) ||
    document.getElementById(
      "labTest"
    );

  if (!select) {
    return;
  }

  const test =
    findMasterTest(
      select.value
    );

  if (!test) {
    return;
  }

  setElementValue(
    "testCategory",
    test.category
  );

  setElementValue(
    "category",
    test.category
  );

  setElementValue(
    "testDescription",
    test.description
  );

  setElementValue(
    "description",
    test.description
  );

  setElementValue(
    "testPrice",
    test.price
  );

  setElementValue(
    "labPrice",
    test.price
  );

  setElementValue(
    "normalRange",
    test.normalRange
  );

  setElementValue(
    "testUnit",
    test.unit
  );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function goToPendingLabOrders() {
  window.location.href =
    "pending-lab-orders.html";
}


function goToCompletedLabTests() {
  window.location.href =
    "completed-tests.html";
}


function goToEnterNewLabTest() {
  window.location.href =
    "enter-new-test.html";
}


function goToLabBilling() {
  window.location.href =
    "lab-billing.html";
}


function goToCompletedTests() {
  window.location.href =
    "completed-tests.html";
}


function goToBilling() {
  window.location.href =
    "lab-billing.html";
}


/* =========================================================
   SEARCH
   ========================================================= */

function filterTable(
  tableId,
  searchValue
) {

  const table =
    document.getElementById(
      tableId
    );

  if (!table) {
    return;
  }

  const value =
    String(
      searchValue || ""
    )
      .trim()
      .toLowerCase();

  const rows =
    table.querySelectorAll(
      "tbody tr"
    );

  rows.forEach(
    function (row) {

      const text =
        String(
          row.textContent || ""
        ).toLowerCase();

      row.style.display =
        !value ||
        text.includes(value)
          ? ""
          : "none";
    }
  );
}


function searchLabOrders(
  searchValue
) {

  const value =
    String(
      searchValue || ""
    )
      .trim()
      .toLowerCase();

  const orders =
    loadLabOrdersFromStorage();

  if (!value) {
    return orders;
  }

  return orders.filter(
    function (order) {

      return (
        String(
          order.orderNumber || ""
        )
          .toLowerCase()
          .includes(value) ||

        String(
          order.patientName || ""
        )
          .toLowerCase()
          .includes(value) ||

        String(
          order.patientId || ""
        )
          .toLowerCase()
          .includes(value) ||

        String(
          order.testName || ""
        )
          .toLowerCase()
          .includes(value)
      );
    }
  );
}


function searchLabBills(
  searchValue
) {

  const value =
    String(
      searchValue || ""
    )
      .trim()
      .toLowerCase();

  const bills =
    getBills().filter(
      function (bill) {

        return (
          String(
            bill.billType || ""
          ).toUpperCase() ===
          "LAB"
        );
      }
    );

  if (!value) {
    return bills;
  }

  return bills.filter(
    function (bill) {

      return (
        String(
          bill.billId ||
          bill.id ||
          ""
        )
          .toLowerCase()
          .includes(value) ||

        String(
          bill.patientName ||
          ""
        )
          .toLowerCase()
          .includes(value) ||

        String(
          bill.patientId ||
          ""
        )
          .toLowerCase()
          .includes(value) ||

        String(
          bill.testName ||
          ""
        )
          .toLowerCase()
          .includes(value)
      );
    }
  );
}


function initializeLabSearch() {

  const pendingSearch =
    document.getElementById(
      "pendingSearch"
    );

  if (pendingSearch) {

    pendingSearch.addEventListener(
      "input",
      function () {

        filterTable(
          "pendingTestsTable",
          pendingSearch.value
        );
      }
    );
  }


  const completedSearch =
    document.getElementById(
      "completedSearch"
    );

  if (completedSearch) {

    completedSearch.addEventListener(
      "input",
      function () {

        filterTable(
          "completedTestsTable",
          completedSearch.value
        );
      }
    );
  }


  const billingSearch =
    document.getElementById(
      "billingSearch"
    );

  if (billingSearch) {

    billingSearch.addEventListener(
      "input",
      function () {

        filterTable(
          "billingTable",
          billingSearch.value
        );

        filterTable(
          "labBillingTable",
          billingSearch.value
        );
      }
    );
  }
}


/* =========================================================
   HANDLE SAMPLE / PROCESSING BUTTONS
   ========================================================= */

function handleCollectSample() {

  const orderNumber =
    getElementValue(
      "orderId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("orderId");

  if (!orderNumber) {
    return;
  }

  const order =
    collectSample(
      orderNumber
    );

  if (!order) {
    return;
  }

  loadTestDetails();

  showMessage(
    "message",
    "Sample collected successfully.",
    "success"
  );
}


function handleStartProcessing() {

  const orderNumber =
    getElementValue(
      "orderId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("orderId");

  if (!orderNumber) {
    return;
  }

  const order =
    startLabProcessing(
      orderNumber
    );

  if (!order) {
    return;
  }

  loadTestDetails();

  showMessage(
    "message",
    "Laboratory processing started.",
    "success"
  );
}


/* =========================================================
   CURRENT RESULT / BILL PRINT BUTTONS
   ========================================================= */

function printCurrentLabResult() {

  const orderNumber =
    getElementValue(
      "orderId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("orderId") ||
    new URLSearchParams(
      window.location.search
    ).get("id");

  printLabResult(
    orderNumber
  );
}


function printCurrentLabBill() {

  const billId =
    getElementValue(
      "billId"
    ) ||
    new URLSearchParams(
      window.location.search
    ).get("billId") ||
    new URLSearchParams(
      window.location.search
    ).get("id");

  printLabBill(
    billId
  );
}


/* =========================================================
   COMPATIBILITY FUNCTIONS
   ========================================================= */

function getLabTests() {
  return loadLabOrdersFromStorage();
}


function saveLabTests(tests) {

  if (!Array.isArray(tests)) {
    return false;
  }

  labOrders =
    tests;

  return writeJSON(
    LAB_ORDERS_KEY,
    tests
  );
}


function submitNewLabTest(event) {
  return addNewLabTest(event);
}


function submitLabResult(event) {
  return saveLabResult(event);
}


function submitLabBill(event) {
  return generateLabBill(event);
}


function submitBillPayment(event) {
  return processLabBillPayment(event);
}


function openLabTest(orderNumber) {
  viewLabTest(
    orderNumber
  );
}


function openLabBill(billId) {
  viewLabBill(
    billId
  );
}


/* =========================================================
   CLEAR / REFRESH HELPERS
   ========================================================= */

function clearLabOrders() {

  localStorage.removeItem(
    LAB_ORDERS_KEY
  );

  labOrders =
    [];

  loadDashboard();
  loadPendingLabOrders();
  loadCompletedTests();
}


function clearLabBills() {

  localStorage.removeItem(
    BILLING_KEY
  );

  loadLabBillingHistory();
}


function refreshLabData() {

  labOrders =
    loadLabOrdersFromStorage();

  loadDashboard();
  loadPendingLabOrders();
  loadCompletedTests();
  loadLabBillingHistory();
}


/* =========================================================
   BILL STATUS HELPERS
   ========================================================= */

function isBillPaid(bill) {

  if (!bill) {
    return false;
  }

  return (
    String(
      bill.paymentStatus ||
      bill.status ||
      ""
    ).toLowerCase() ===
    "paid"
  );
}


function getBillStatusLabel(bill) {

  if (!bill) {
    return "Unpaid";
  }

  return (
    bill.paymentStatus ||
    bill.status ||
    "Unpaid"
  );
}


/* =========================================================
   AUTO REFRESH / CROSS-TAB SYNC
   ========================================================= */

function refreshDashboardCounts() {

  if (
    document.getElementById(
      "pendingCount"
    ) ||
    document.getElementById(
      "completedCount"
    )
  ) {
    loadDashboard();
  }
}


function initializeLabAutoRefresh() {

  /*
   * Refresh when user returns to the page.
   */
  document.addEventListener(
    "visibilitychange",
    function () {

      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      labOrders =
        loadLabOrdersFromStorage();

      refreshDashboardCounts();

      if (
        document.getElementById(
          "pendingTestsTable"
        ) ||
        document.getElementById(
          "pendingTestsBody"
        )
      ) {
        loadPendingLabOrders();
      }

      if (
        document.getElementById(
          "completedTestsTable"
        ) ||
        document.getElementById(
          "completedTestsBody"
        )
      ) {
        loadCompletedTests();
      }

      if (
        document.getElementById(
          "billingTable"
        ) ||
        document.getElementById(
          "labBillingTable"
        )
      ) {
        loadLabBillingHistory();
      }
    }
  );


  /*
   * Synchronize changes made by another tab.
   */
  window.addEventListener(
    "storage",
    function (event) {

      if (
        event.key ===
          LAB_ORDERS_KEY ||
        event.key ===
          BILLING_KEY ||
        event.key ===
          LAB_TEST_MASTER_KEY
      ) {

        labOrders =
          loadLabOrdersFromStorage();

        refreshDashboardCounts();

        if (
          document.getElementById(
            "pendingTestsTable"
          ) ||
          document.getElementById(
            "pendingTestsBody"
          )
        ) {
          loadPendingLabOrders();
        }

        if (
          document.getElementById(
            "completedTestsTable"
          ) ||
          document.getElementById(
            "completedTestsBody"
          )
        ) {
          loadCompletedTests();
        }

        if (
          document.getElementById(
            "billingTable"
          ) ||
          document.getElementById(
            "labBillingTable"
          )
        ) {
          loadLabBillingHistory();
        }
      }
    }
  );
}


/* =========================================================
   BILLING LIVE EVENTS
   ========================================================= */

function initializeBillingEvents() {

  const billingTest =
    document.getElementById(
      "billingTest"
    );

  const labTest =
    document.getElementById(
      "labTest"
    );

  const quantity =
    document.getElementById(
      "labQuantity"
    ) ||
    document.getElementById(
      "quantity"
    );


  if (billingTest) {

    billingTest.addEventListener(
      "change",
      function () {

        updateLabBillingPrice();
      }
    );
  }


  if (labTest) {

    labTest.addEventListener(
      "change",
      function () {

        updateLabBillingPrice();

        updateSelectedLabTestDetails();
      }
    );
  }


  if (quantity) {

    quantity.addEventListener(
      "input",
      function () {

        updateLabBillingPrice();
      }
    );
  }
}


/* =========================================================
   TEST SELECTION EVENTS
   ========================================================= */

function initializeTestSelectionEvents() {

  const testId =
    document.getElementById(
      "testId"
    );

  if (testId) {

    testId.addEventListener(
      "change",
      function () {

        updateSelectedLabTestDetails();
      }
    );
  }
}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    /*
     * Always load the current Lab orders.
     */
    labOrders =
      loadLabOrdersFromStorage();


    /*
     * Dashboard.
     */
    if (
      document.getElementById(
        "pendingCount"
      ) ||
      document.getElementById(
        "completedCount"
      ) ||
      document.getElementById(
        "todayTestCount"
      ) ||
      document.getElementById(
        "totalTestCount"
      )
    ) {
      loadDashboard();
    }


    /*
     * Admin Lab Test Master.
     *
     * Only active tests are placed into
     * new-test and billing dropdowns.
     */
    if (
      document.getElementById(
        "testId"
      ) ||
      document.getElementById(
        "billingTest"
      ) ||
      document.getElementById(
        "labTest"
      )
    ) {
      populateLabTestSelect();
    }


    /*
     * Pending orders.
     */
    if (
      document.getElementById(
        "pendingTestsTable"
      ) ||
      document.getElementById(
        "pendingTestsBody"
      )
    ) {
      loadPendingLabOrders();
    }


    /*
     * Test details.
     */
    if (
      document.getElementById(
        "testStatus"
      ) ||
      (
        document.getElementById(
          "orderId"
        ) &&
        document.getElementById(
          "testName"
        )
      )
    ) {
      loadTestDetails();
    }


    /*
     * Result entry.
     */
    if (
      document.getElementById(
        "testResult"
      ) ||
      document.getElementById(
        "result"
      )
    ) {
      loadResultTest();
    }


    /*
     * Completed tests.
     */
    if (
      document.getElementById(
        "completedTestsTable"
      ) ||
      document.getElementById(
        "completedTestsBody"
      )
    ) {
      loadCompletedTests();
    }


    /*
     * Completed result details.
     */
    if (
      document.getElementById(
        "completedResult"
      ) ||
      document.getElementById(
        "resultDetails"
      )
    ) {
      loadCompletedTestDetails();
    }


    /*
     * Billing.
     */
    if (
      document.getElementById(
        "billingTest"
      ) ||
      document.getElementById(
        "labTotal"
      ) ||
      document.getElementById(
        "billingTable"
      ) ||
      document.getElementById(
        "labBillingTable"
      )
    ) {

      loadLabBillingTests();

      calculateLabBill();

      loadLabBillingHistory();
    }


    /*
     * Bill details.
     */
    if (
      document.getElementById(
        "billId"
      ) &&
      (
        document.getElementById(
          "paymentStatus"
        ) ||
        document.getElementById(
          "paymentMethod"
        )
      )
    ) {
      loadLabBillDetails();
    }


    initializeLabSearch();

    initializeLabAutoRefresh();

    initializeBillingEvents();

    initializeTestSelectionEvents();
  }
);


/* =========================================================
   GLOBAL FUNCTION EXPORTS
   =========================================================
   Required for HTML onclick="..." handlers.
   ========================================================= */

window.toggleSidebar =
  toggleSidebar;

window.addNewLabTest =
  addNewLabTest;

window.updateLabDashboard =
  updateLabDashboard;

window.loadDashboard =
  loadDashboard;

window.loadPendingLabOrders =
  loadPendingLabOrders;

window.loadTestDetails =
  loadTestDetails;

window.loadResultTest =
  loadResultTest;

window.saveLabResult =
  saveLabResult;

window.loadCompletedTests =
  loadCompletedTests;

window.loadCompletedTestDetails =
  loadCompletedTestDetails;

window.viewLabTest =
  viewLabTest;

window.collectSample =
  collectSample;

window.startLabProcessing =
  startLabProcessing;

window.goToResults =
  goToResults;

window.calculateLabBill =
  calculateLabBill;

window.generateLabBill =
  generateLabBill;

window.loadLabBillingTests =
  loadLabBillingTests;

window.loadLabBillingHistory =
  loadLabBillingHistory;

window.viewLabBill =
  viewLabBill;

window.markLabBillPaid =
  markLabBillPaid;

window.loadLabBillDetails =
  loadLabBillDetails;

window.processLabBillPayment =
  processLabBillPayment;

window.printLabBill =
  printLabBill;

window.printLabResult =
  printLabResult;

window.submitNewLabTest =
  submitNewLabTest;

window.submitLabResult =
  submitLabResult;

window.submitLabBill =
  submitLabBill;

window.submitBillPayment =
  submitBillPayment;

window.goToPendingLabOrders =
  goToPendingLabOrders;

window.goToCompletedLabTests =
  goToCompletedLabTests;

window.goToEnterNewLabTest =
  goToEnterNewLabTest;

window.goToLabBilling =
  goToLabBilling;

window.goToCompletedTests =
  goToCompletedTests;

window.goToBilling =
  goToBilling;

window.openLabTest =
  openLabTest;

window.openLabBill =
  openLabBill;

window.handleCollectSample =
  handleCollectSample;

window.handleStartProcessing =
  handleStartProcessing;

window.printCurrentLabResult =
  printCurrentLabResult;

window.printCurrentLabBill =
  printCurrentLabBill;

window.updateBillingTotal =
  updateBillingTotal;

window.updateLabBillingPrice =
  updateLabBillingPrice;

window.updateSelectedLabTestDetails =
  updateSelectedLabTestDetails;

window.searchLabOrders =
  searchLabOrders;

window.searchLabBills =
  searchLabBills;

window.cancelLabOrder =
  cancelLabOrder;

window.refreshLabData =
  refreshLabData;