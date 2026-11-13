const STORAGE_KEY = "moneymind_transactions_v1";
const GOAL_KEY = "moneymind_goal_v1";
const THEME_KEY = "moneymind_theme_v1";

const money = value => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
const today = new Date();
const localDateKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const dateKey = date => localDateKey(date);
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
const hasSavedTransactions = localStorage.getItem(STORAGE_KEY) !== null;
let transactions = readStorage(STORAGE_KEY, sampleTransactions);
let showingDemoData = !hasSavedTransactions;
let editingId = null;
let goal = readStorage(GOAL_KEY, { name: "Comprar audífonos", target: 2500, current: 500 });

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
  showingDemoData = false;
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
  document.querySelector("#dataStatus").textContent = showingDemoData ? "✦ Datos de ejemplo" : "✦ Datos guardados";
  renderInsight(current);
  renderPieChart(current);
}
function renderInsight(items) {
  const expenses = items.filter(x => x.type === "expense");
  if (!expenses.length) {
    document.querySelector("#insightText").textContent = "Antes de comprar algo, pregúntate si lo necesitas ahora o si ese dinero puede acercarte a una meta de ahorro.";
    return;
  }
  const totals = {};
  expenses.forEach(x => totals[x.category] = (totals[x.category] || 0) + x.amount);
  const [category, amount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const share = Math.round(amount / total * 100);
  const tips = {
    comida: "Planear tus comidas y llevar algo preparado puede ayudarte a reducir los gastos pequeños de cada día.",
    transporte: "Agrupar tus pendientes o compartir trayectos puede ayudarte a gastar menos en transporte.",
    educación: "Compara precios y aprovecha materiales gratuitos antes de realizar una compra para tus estudios.",
    entretenimiento: "Define un presupuesto para salidas y diversión; así disfrutas sin descuidar tus otras metas.",
    compras: "Antes de comprar, espera un momento y compara opciones. Evitar compras impulsivas también es ahorrar.",
    salud: "Reserva una parte de tu presupuesto para cuidados y gastos de salud inesperados.",
    salario: "Procura separar una pequeña parte de cada ingreso para tu ahorro antes de empezar a gastar.",
    otros: "Anota los gastos pequeños y revisa cuáles puedes reducir al final de la semana."
  };
  document.querySelector("#insightText").textContent = (tips[category.toLowerCase()] || "Revisa tus gastos con frecuencia y separa una cantidad para tus metas de ahorro.") + " Tu mayor categoría este mes es " + category.toLowerCase() + " (" + share + "% de tus gastos).";
}
function renderPieChart(items) {
  const expenses = items.filter(item => item.type === "expense");
  const totals = {};
  expenses.forEach(item => { totals[item.category] = (totals[item.category] || 0) + item.amount; });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const pie = document.querySelector("#expensePie");
  const legend = document.querySelector("#pieLegend");
  const note = document.querySelector("#pieNote");
  document.querySelector("#pieTotal").textContent = money(total);
  legend.innerHTML = "";
  if (!entries.length || total <= 0) {
    pie.style.background = "conic-gradient(var(--line) 0deg 360deg)";
    note.textContent = "Todavía no hay gastos registrados este mes.";
    return;
  }
  let angle = 0;
  const slices = entries.map(([category, amount], index) => {
    const start = angle;
    angle += amount / total * 360;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const percent = Math.round(amount / total * 100);
    const item = document.createElement("div");
    item.className = "pie-legend-item";
    const dot = document.createElement("span"); dot.className = "pie-legend-dot"; dot.style.background = color;
    const name = document.createElement("span"); name.className = "pie-legend-name"; name.textContent = category;
    const value = document.createElement("span"); value.className = "pie-legend-value"; value.textContent = percent + "% · " + money(amount);
    item.append(dot, name, value);
    legend.appendChild(item);
    return color + " " + start + "deg " + angle + "deg";
  });
  pie.style.background = "conic-gradient(" + slices.join(", ") + ")";
  pie.setAttribute("aria-label", "Distribución de gastos del mes: " + entries.map(([category, amount]) => category + " " + Math.round(amount / total * 100) + "%").join(", "));
  note.textContent = "Distribución calculada con tus gastos registrados durante este mes.";
}
const PIE_COLORS = ["#28b889","#8373e6","#f0a36e","#4f9bd8","#e36d8d","#8baf57","#d0a34b","#8290a5"];

function getFilteredTransactions() {
  const search = document.querySelector("#searchFilter").value.trim().toLocaleLowerCase("es-MX");
  const type = document.querySelector("#typeFilter").value;
  const category = document.querySelector("#categoryFilter").value;
  const start = document.querySelector("#startDateFilter").value;
  const end = document.querySelector("#endDateFilter").value;
  return [...transactions].filter(item => {
    const matchesSearch = !search || (item.description + " " + item.category).toLocaleLowerCase("es-MX").includes(search);
    return matchesSearch && (type === "all" || item.type === type) && (category === "all" || item.category === category) && (!start || item.date >= start) && (!end || item.date <= end);
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
function renderTransactions() {
  const list = document.querySelector("#transactionList");
  const empty = document.querySelector("#emptyTransactions");
  const filtered = getFilteredTransactions();
  list.innerHTML = "";
  empty.classList.toggle("hidden", filtered.length > 0);
  document.querySelector("#historyCount").textContent = filtered.length + (filtered.length === 1 ? " movimiento" : " movimientos") + " · " + (showingDemoData ? "datos de ejemplo" : "datos guardados");
  filtered.forEach(item => {
    const row = document.createElement("div");
    row.className = "transaction-row";
    const symbol = item.type === "income" ? "↙" : categorySymbol(item.category);
    const date = new Date(item.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.textContent = symbol;
    const meta = document.createElement("span");
    meta.className = "transaction-meta";
    const title = document.createElement("strong");
    title.textContent = item.description;
    const detail = document.createElement("small");
    detail.textContent = item.category + " · " + date;
    meta.append(title, detail);
    const amount = document.createElement("span");
    amount.className = "transaction-amount " + item.type;
    amount.textContent = (item.type === "income" ? "+" : "−") + money(item.amount);
    const actions = document.createElement("span");
    actions.className = "transaction-actions";
    const edit = document.createElement("button");
    edit.type = "button"; edit.className = "transaction-action"; edit.textContent = "Editar";
    edit.setAttribute("aria-label", "Editar " + item.description);
    edit.addEventListener("click", () => startEditing(item.id));
    const remove = document.createElement("button");
    remove.type = "button"; remove.className = "transaction-action delete"; remove.textContent = "Eliminar";
    remove.setAttribute("aria-label", "Eliminar " + item.description);
    remove.addEventListener("click", () => deleteTransaction(item.id));
    actions.append(edit, remove);
    row.append(icon, meta, amount, actions);
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
function resetTransactionForm() {
  const form = document.querySelector("#transactionForm");
  form.reset();
  document.querySelector("#transactionDate").value = dateKey(today);
  editingId = null;
  document.querySelector("#submitTransaction").textContent = "＋ Guardar movimiento";
  document.querySelector("#cancelEdit").classList.add("hidden");
}
function startEditing(id) {
  const item = transactions.find(x => x.id === id);
  if (!item) return;
  editingId = id;
  document.querySelector("#type").value = item.type;
  document.querySelector("#description").value = item.description;
  document.querySelector("#amount").value = item.amount;
  document.querySelector("#category").value = item.category;
  document.querySelector("#transactionDate").value = item.date;
  document.querySelector("#submitTransaction").textContent = "Guardar cambios";
  document.querySelector("#cancelEdit").classList.remove("hidden");
  document.querySelector("#formFeedback").textContent = "Editando: " + item.description;
  document.querySelector("#addTransaction").scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelector("#description").focus({ preventScroll: true });
}
function deleteTransaction(id) {
  const item = transactions.find(x => x.id === id);
  if (!item || !confirm('¿Eliminar el movimiento "' + item.description + '"? Esta acción no se puede deshacer.')) return;
  transactions = transactions.filter(x => x.id !== id);
  save(); render();
  document.querySelector("#formFeedback").textContent = "Movimiento eliminado.";
}
document.querySelector("#transactionForm").addEventListener("submit", event => {
  event.preventDefault();
  const description = document.querySelector("#description").value.trim();
  const amount = Number(document.querySelector("#amount").value);
  const date = document.querySelector("#transactionDate").value;
  if (!description || !Number.isFinite(amount) || amount <= 0 || !date) return;
  const wasEditing = editingId !== null;
  const record = { id: editingId ?? Date.now(), type: document.querySelector("#type").value, description, amount: Math.round(amount * 100) / 100, category: document.querySelector("#category").value, date };
  if (wasEditing) transactions = transactions.map(item => item.id === editingId ? record : item);
  else transactions.push(record);
  save(); render(); resetTransactionForm();
  document.querySelector("#formFeedback").textContent = wasEditing ? "✓ Movimiento actualizado correctamente." : "✓ Movimiento guardado correctamente.";
});
document.querySelector("#cancelEdit").addEventListener("click", () => {
  resetTransactionForm();
  document.querySelector("#formFeedback").textContent = "Edición cancelada.";
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
document.querySelectorAll("#searchFilter, #typeFilter, #categoryFilter, #startDateFilter, #endDateFilter").forEach(control => control.addEventListener("input", renderTransactions));
document.querySelector("#resetFilters").addEventListener("click", () => {
  document.querySelector("#searchFilter").value = "";
  document.querySelector("#typeFilter").value = "all";
  document.querySelector("#categoryFilter").value = "all";
  document.querySelector("#startDateFilter").value = "";
  document.querySelector("#endDateFilter").value = "";
  renderTransactions();
});
document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
});
if (readStorage(THEME_KEY, "light") === "dark") document.body.classList.add("dark");
document.querySelector("#todayLabel").textContent = today.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
document.querySelector("#transactionDate").value = dateKey(today);
document.querySelector("#mobileMenu").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-item").forEach(link => link.addEventListener("click", () => document.querySelector("#sidebar").classList.remove("open")));
render();
