const STORAGE_KEY = "personalExpenseTrackerTransactions";

const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterInput = document.getElementById("filter");
const tableBody = document.getElementById("transactionTable");
const message = document.getElementById("formMessage");

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : [];
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Could not read saved transactions:", error);
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatMoney(value) {
  return "LKR " + Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function updateSummary() {
  const totalIncome = transactions
    .filter(item => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter(item => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  document.getElementById("totalIncome").textContent = formatMoney(totalIncome);
  document.getElementById("totalExpenses").textContent = formatMoney(totalExpenses);
  document.getElementById("currentBalance").textContent = formatMoney(totalIncome - totalExpenses);
}

function renderTransactions() {
  const selectedFilter = filterInput.value;
  const visibleTransactions = transactions
    .filter(item => selectedFilter === "All" || item.type === selectedFilter)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  tableBody.innerHTML = "";
  document.getElementById("recordCount").textContent =
    `${visibleTransactions.length} ${visibleTransactions.length === 1 ? "record" : "records"}`;

  if (visibleTransactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = transactions.length === 0
      ? "No transactions yet. Add your first record."
      : "No transactions match this filter.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  visibleTransactions.forEach(item => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = item.date;

    const descriptionCell = document.createElement("td");
    descriptionCell.className = "description-cell";
    descriptionCell.textContent = item.description;

    const typeCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `type-pill ${item.type === "Income" ? "type-income" : "type-expense"}`;
    pill.textContent = item.type;
    typeCell.appendChild(pill);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = item.category;

    const amountCell = document.createElement("td");
    amountCell.className = `amount-cell ${item.type === "Income" ? "amount-income" : "amount-expense"}`;
    amountCell.textContent = (item.type === "Income" ? "+" : "−") + formatMoney(item.amount);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${item.description}`);
    deleteButton.addEventListener("click", () => deleteTransaction(item.id));
    actionCell.appendChild(deleteButton);

    row.append(dateCell, descriptionCell, typeCell, categoryCell, amountCell, actionCell);
    tableBody.appendChild(row);
  });
}

function refreshApp() {
  updateSummary();
  renderTransactions();
  saveTransactions();
}

function deleteTransaction(id) {
  transactions = transactions.filter(item => item.id !== id);
  refreshApp();
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  const type = typeInput.value;

  if (!description || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    message.textContent = "Please complete every field and enter an amount greater than zero.";
    return;
  }

  const transaction = {
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
    type,
    description,
    amount,
    category,
    date
  };

  transactions.push(transaction);
  refreshApp();

  form.reset();
  typeInput.value = "Expense";
  dateInput.value = new Date().toISOString().slice(0, 10);
  message.textContent = "Transaction added successfully.";
});

form.addEventListener("reset", function () {
  message.textContent = "";
  setTimeout(() => {
    typeInput.value = "Expense";
    dateInput.value = new Date().toISOString().slice(0, 10);
  }, 0);
});

filterInput.addEventListener("change", renderTransactions);

document.getElementById("loadSample").addEventListener("click", function () {
  const sampleData = [
    { id: "sample-1", type: "Income", description: "Monthly Allowance", amount: 25000, category: "Allowance", date: "2026-11-01" },
    { id: "sample-2", type: "Expense", description: "Lunch", amount: 800, category: "Food", date: "2026-11-02" },
    { id: "sample-3", type: "Expense", description: "Bus Fare", amount: 250, category: "Transport", date: "2026-11-03" },
    { id: "sample-4", type: "Income", description: "Part-time Work", amount: 5000, category: "Salary", date: "2026-11-04" }
  ];

  const existingIds = new Set(transactions.map(item => item.id));
  sampleData.forEach(item => {
    if (!existingIds.has(item.id)) transactions.push(item);
  });

  filterInput.value = "All";
  refreshApp();
  message.textContent = "Sample transactions loaded. Existing records were kept.";
});

document.getElementById("today").textContent = new Date().toLocaleDateString("en-LK", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

dateInput.value = new Date().toISOString().slice(0, 10);
refreshApp();
