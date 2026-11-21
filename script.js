const $ = (id) => document.getElementById(id);
let historyItems = [];
let currentExpression = "";
let sciExpression = "";
let angleMode = "DEG";

function addHistory(text) {
  historyItems.unshift(text);
  renderHistory();
}

function renderHistory() {
  const list = $("historyList");
  if (!historyItems.length) {
    list.innerHTML = "<p>No calculations yet.</p>";
    return;
  }
  list.innerHTML = historyItems.map(item =>
    `<div class="history-item">${escapeHTML(item)}</div>`
  ).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeCalculate(expression) {
  if (!expression || !/^[0-9+\-*/().%\s]+$/.test(expression)) {
    throw new Error("Invalid expression");
  }
  const result = Function('"use strict"; return (' + expression + ')')();
  if (!Number.isFinite(result)) throw new Error("Math error");
  return result;
}

// Tabs
document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(panel => panel.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.tab).classList.add("active");
  });
});

// Basic calculator
function updateDisplay() {
  $("display").value = currentExpression || "0";
}

document.querySelectorAll(".key").forEach(button => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "clear") {
      currentExpression = "";
    } else if (action === "delete") {
      currentExpression = currentExpression.slice(0, -1);
    } else if (action === "sign") {
      if (currentExpression) currentExpression = `-(${currentExpression})`;
    } else if (action === "equals") {
      try {
        const result = safeCalculate(currentExpression);
        addHistory(`${currentExpression} = ${result}`);
        currentExpression = String(Number(result.toPrecision(12)));
      } catch {
        currentExpression = "Error";
      }
    } else if (value !== undefined) {
      if (currentExpression === "Error") currentExpression = "";
      currentExpression += value;
    }
    updateDisplay();
  });
});

// Scientific calculator
function updateSciDisplay() {
  $("sciDisplay").value = sciExpression || "0";
}

$("angleMode").addEventListener("click", () => {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  $("angleMode").textContent = angleMode;
});

$("sciClear").addEventListener("click", () => {
  sciExpression = "";
  updateSciDisplay();
});

document.querySelectorAll("[data-sci]").forEach(button => {
  button.addEventListener("click", () => {
    const key = button.dataset.sci;

    if (key === "clear") sciExpression = "";
    else if (key === "back") sciExpression = sciExpression.slice(0, -1);
    else if (key === "equals") {
      try {
        const result = calculateScientific(sciExpression);
        addHistory(`${sciExpression} = ${result}`);
        sciExpression = String(Number(result.toPrecision(12)));
      } catch {
        sciExpression = "Error";
      }
    } else if (key === "pi") sciExpression += "π";
    else if (key === "square") sciExpression += "^2";
    else if (key === "factorial") sciExpression += "!";
    else if (["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "log", "ln"].includes(key)) {
      sciExpression += key + "(";
    } else {
      if (sciExpression === "Error") sciExpression = "";
      sciExpression += key;
    }
    updateSciDisplay();
  });
});

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error("Invalid factorial");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function calculateScientific(expression) {
  if (!expression) throw new Error("Empty expression");

  let exp = expression.replace(/π/g, "Math.PI");
  exp = exp.replace(/(\d+(?:\.\d+)?)!/g, "factorial($1)");
  exp = exp.replace(/\^/g, "**");

  const functions = ["asin", "acos", "atan", "sin", "cos", "tan", "sqrt", "log", "ln"];
  functions.forEach(fn => {
    const map = {
      sin: "sin", cos: "cos", tan: "tan",
      asin: "asin", acos: "acos", atan: "atan",
      sqrt: "sqrt", log: "log10", ln: "log"
    };
    exp = exp.replace(new RegExp(`\\b${fn}\\(`, "g"), `Math.${map[fn]}(`);
  });

  exp = exp.replace(/Math\.(sin|cos|tan)\(([^()]*)\)/g, (match, fn, arg) => {
    return angleMode === "DEG"
      ? `Math.${fn}((${arg})*Math.PI/180)`
      : match;
  });

  exp = exp.replace(/Math\.(asin|acos|atan)\(([^()]*)\)/g, (match, fn, arg) => {
    return angleMode === "DEG"
      ? `(Math.${fn}(${arg})*180/Math.PI)`
      : match;
  });

  if (!/^[0-9+\-*/().\sA-Za-z_*]+$/.test(exp)) throw new Error("Invalid input");
  const result = Function("factorial", '"use strict"; return (' + exp + ')')(factorial);
  if (!Number.isFinite(result)) throw new Error("Math error");
  return result;
}

// Age calculator
$("calculateAge").addEventListener("click", () => {
  const input = $("birthDate").value;
  if (!input) {
    $("ageResult").textContent = "Please select your date of birth.";
    return;
  }

  const birth = new Date(input + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birth > today) {
    $("ageResult").textContent = "Date of birth cannot be in the future.";
    return;
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday <= today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const daysLeft = Math.ceil((nextBirthday - today) / 86400000);

  $("ageResult").textContent =
    `Your age: ${years} years, ${months} months, ${days} days. ` +
    `${daysLeft} days until your next birthday.`;
});

// Currency converter
$("convertCurrency").addEventListener("click", async () => {
  const amount = Number($("currencyAmount").value);
  const from = $("fromCurrency").value;
  const to = $("toCurrency").value;
  const output = $("currencyResult");

  if (!Number.isFinite(amount) || amount < 0) {
    output.textContent = "Please enter a valid amount.";
    return;
  }

  output.textContent = "Converting...";
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    if (data.result !== "success" || !data.rates[to]) throw new Error("Rate unavailable");

    const converted = amount * data.rates[to];
    output.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
    addHistory(`${amount} ${from} = ${converted.toFixed(2)} ${to}`);
  } catch {
    output.textContent = "Could not get exchange rates. Please check your internet and try again.";
  }
});

// Unit converter
const unitOptions = {
  length: {
    m: 1, km: 1000, cm: 0.01, mm: 0.001,
    mile: 1609.344, foot: 0.3048, inch: 0.0254
  },
  weight: {
    kg: 1, g: 0.001, mg: 0.000001,
    lb: 0.45359237, oz: 0.0283495
  },
  temperature: {
    c: "Celsius", f: "Fahrenheit", k: "Kelvin"
  }
};

function populateUnits() {
  const type = $("unitType").value;
  const options = Object.keys(unitOptions[type]);
  $("unitFrom").innerHTML = options.map(x => `<option value="${x}">${x}</option>`).join("");
  $("unitTo").innerHTML = options.map(x => `<option value="${x}">${x}</option>`).join("");
  if (options.length > 1) $("unitTo").selectedIndex = 1;
}

$("unitType").addEventListener("change", populateUnits);
populateUnits();

function convertTemperature(value, from, to) {
  let celsius;
  if (from === "c") celsius = value;
  if (from === "f") celsius = (value - 32) * 5 / 9;
  if (from === "k") celsius = value - 273.15;

  if (to === "c") return celsius;
  if (to === "f") return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}

$("convertUnit").addEventListener("click", () => {
  const value = Number($("unitAmount").value);
  const type = $("unitType").value;
  const from = $("unitFrom").value;
  const to = $("unitTo").value;
  const output = $("unitResult");

  if (!Number.isFinite(value)) {
    output.textContent = "Please enter a valid number.";
    return;
  }

  let result;
  if (type === "temperature") {
    result = convertTemperature(value, from, to);
    if (to === "k" && result < 0) {
      output.textContent = "Kelvin cannot be below zero.";
      return;
    }
  } else {
    result = value * unitOptions[type][from] / unitOptions[type][to];
  }

  output.textContent = `${value} ${from} = ${Number(result.toFixed(8))} ${to}`;
  addHistory(`${value} ${from} = ${Number(result.toFixed(8))} ${to}`);
});

// Clear history
$("clearHistory").addEventListener("click", () => {
  historyItems = [];
  renderHistory();
});
