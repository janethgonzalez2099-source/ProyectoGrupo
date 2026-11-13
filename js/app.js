const STORAGE_KEY = "moneymind_transactions_v1";
const GOAL_KEY = "moneymind_goal_v1";
const THEME_KEY = "moneymind_theme_v1";

const money = value => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
const today = new Date();
const dateKey = date => new Date(date).toISOString().slice(0, 10);
const sampleTransactions = [
  { id: 1, type: "income", description: "Apoyo semanal", amount: 600, category: "Salario", date: dateKey(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 5))) },
  { id: 2, type: "expense", description: "Comida", amount: 85, category: "Comida", date: dateKey(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 4))) },
  { id: 3, type: "expense", description: "Transporte", amount: 32, category: "Transporte", date: dateKey(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 3))) },
  { id: 4, type: "expense", description: "Café con amigos", amount: 68, category: "Entretenimiento", date: dateKey(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 1))) }
];

function readStorage(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
let transactions = readStorage(STORAGE_KEY, sampleTransactions);
let goal = readStorage(GOAL_KEY, { name: "Comprar audífonos", target: 2500, current: 500 });

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}
function monthTransactions() {
  const month = today.getMonth(), year = today.getFullYear();
  return transactions.filter(item => { const d = new Date(item.date + "T12:00:00"); return d.getMonth() === month && d.getFullYear() === year; });
}
function renderSummary() {
  const current = monthTransactions();
  const income = current.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const expense = current.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const allIncome = transactions.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const allExpense = transactions.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const balance = allIncome - allExpense;
  document.querySelector("#balanceValue").textContent = money(balance);
  document.querySelector("#incomeValue").textContent = money(income);
  document.querySelector("#expenseValue").textContent = money(expense);
  document.querySelector("#artBalance").textContent = money(balance);
  renderInsight(current);
}
function renderInsight(items) {
  const expenses = items.filter(x => x.type === "expense");
  if (!expenses.length) {
    document.querySelector("#insightText").textContent = "Aún no registras gastos este mes. Agrega tus movimientos para descubrir tus hábitos y oportunidades de ahorro.";
    return;
  }
  const totals = {};
  expenses.forEach(x => totals[x.category] = (totals[x.category] || 0) + x.amount);
  const [category, amount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const share = Math.round(amount / total * 100);
  document.querySelector("#insightText").textContent = "Tu categoría con mayor gasto es " + category.toLowerCase() + ". Representa el " + share + "% de tus gastos registrados (" + money(amount) + "). Revisa si puedes ajustar un poco ese hábito.";
}
function renderTransactions() {
  const list = document.querySelector("#transactionList");
  const empty = document.querySelector("#emptyTransactions");
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5);
  list.innerHTML = "";
  empty.classList.toggle("hidden", sorted.length > 0);
  sorted.forEach(item => {
    const row = document.createElement("div");
    row.className = "transaction-row";
    const symbol = item.type === "income" ? "↙" : categorySymbol(item.category);
    const date = new Date(item.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    row.innerHTML = '<span class="transaction-icon">' + symbol + '</span><span class="transaction-meta"><strong></strong><small></small></span><span class="transaction-amount ' + item.type + '">' + (item.type === "income" ? "+" : "−") + money(item.amount) + '</span>';
    row.querySelector("strong").textContent = item.description;
    row.querySelector("small").textContent = item.category + " · " + date;
    list.appendChild(row);
  });
}
function categorySymbol(category) {
  return ({ Comida: "♨", Transporte: "↗", Educación: "▤", Entretenimiento: "♫", Compras: "◇", Salud: "＋", Otros: "·" })[category] || "·";
}
function renderChart() {
  const chart = document.querySelector("#weeklyChart");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const key = dateKey(d);
    const dayItems = transactions.filter(x => x.date === key);
    return { label: d.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", ""), income: dayItems.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0), expense: dayItems.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0) };
  });
  const max = Math.max(1, ...days.flatMap(x => [x.income, x.expense]));
  chart.innerHTML = "";
  days.forEach(day => {
    const group = document.createElement("div"); group.className = "chart-day";
    const income = document.createElement("span"); income.className = "chart-bar income"; income.style.height = Math.max(day.income ? 5 : 2, day.income / max * 100) + "%"; income.title = "Ingresos: " + money(day.income);
    const expense = document.createElement("span"); expense.className = "chart-bar expense"; expense.style.height = Math.max(day.expense ? 5 : 2, day.expense / max * 100) + "%"; expense.title = "Gastos: " + money(day.expense);
    const label = document.createElement("small"); label.textContent = day.label;
    group.append(income, expense, label); chart.appendChild(group);
  });
}
function renderGoal() {
  document.querySelector("#goalName").textContent = goal.name;
  document.querySelector("#goalCurrent").textContent = money(goal.current);
  document.querySelector("#goalTarget").textContent = money(goal.target);
  const percent = Math.min(100, Math.round(goal.current / goal.target * 100));
  document.querySelector("#goalProgress").style.width = percent + "%";
  document.querySelector("#goalPercent").textContent = percent + "% completado";
}
function render() { renderSummary(); renderTransactions(); renderChart(); renderGoal(); }

document.querySelector("#transactionForm").addEventListener("submit", event => {
  event.preventDefault();
  const description = document.querySelector("#description").value.trim();
  const amount = Number(document.querySelector("#amount").value);
  if (!description || !Number.isFinite(amount) || amount <= 0) return;
  transactions.push({ id: Date.now(), type: document.querySelector("#type").value, description, amount, category: document.querySelector("#category").value, date: dateKey(today) });
  save(); render(); event.target.reset();
  document.querySelector("#formFeedback").textContent = "✓ Movimiento guardado correctamente.";
  setTimeout(() => document.querySelector("#formFeedback").textContent = "", 3500);
});
document.querySelector("#editGoal").addEventListener("click", () => {
  const name = prompt("¿Qué quieres lograr?", goal.name);
  if (name === null) return;
  const target = Number(prompt("¿Cuánto necesitas ahorrar? (MXN)", goal.target));
  if (!name.trim() || !Number.isFinite(target) || target <= 0) return;
  const current = Number(prompt("¿Cuánto llevas ahorrado? (MXN)", goal.current));
  if (!Number.isFinite(current) || current < 0) return;
  goal = { name: name.trim(), target, current }; save(); renderGoal();
});
document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
});
if (readStorage(THEME_KEY, "light") === "dark") document.body.classList.add("dark");
document.querySelector("#todayLabel").textContent = today.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
document.querySelector("#mobileMenu").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-item").forEach(link => link.addEventListener("click", () => document.querySelector("#sidebar").classList.remove("open")));
render();
