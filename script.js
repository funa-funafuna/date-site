const screens = {
  question: document.getElementById("screen-question"),
  date: document.getElementById("screen-date"),
  menu: document.getElementById("screen-menu"),
  summary: document.getElementById("screen-summary"),
};

const choiceZone = document.getElementById("choice-zone");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const questionHint = document.getElementById("question-hint");
const secretMark = document.querySelector(".secret-mark");
const calendarTitle = document.getElementById("calendar-title");
const calendarGrid = document.getElementById("calendar-grid");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const timeSelect = document.getElementById("time-select");
const datePreview = document.getElementById("date-preview");
const toMenuButton = document.getElementById("to-menu-button");
const menuGrid = document.getElementById("menu-grid");
const summaryDate = document.getElementById("summary-date");
const summaryMenu = document.getElementById("summary-menu");
const restartButton = document.getElementById("restart-button");

const menus = [
  { name: "寿司", icon: "🍣", summaryIcon: "🍣" },
  { name: "焼肉", icon: "🥩", summaryIcon: "🥩" },
  { name: "ラーメン", icon: "🍜", summaryIcon: "🍜" },
  { name: "鰻", icon: "❤️", summaryIcon: "❤️" },
  { name: "パスタ", icon: "🍝", summaryIcon: "🍝" },
  { name: "スイーツ", icon: "🍰", summaryIcon: "🍰" },
];

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const today = stripTime(new Date());
const state = {
  activeMonth: new Date(today.getFullYear(), today.getMonth(), 1),
  selectedDate: null,
  selectedTime: "18:00",
  selectedMenu: null,
  noAttempts: 0,
};

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
}

function formatTime(time) {
  const [hour, minute] = time.split(":");
  return `${Number(hour)}時${minute}分から`;
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => {
    screen.hidden = true;
    screen.classList.remove("is-active", "is-entering");
  });

  screens[name].hidden = false;
  screens[name].classList.add("is-active");
  requestAnimationFrame(() => screens[name].classList.add("is-entering"));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getNoButtonPosition(zoneRect, buttonWidth, buttonHeight, noScale) {
  const maxLeft = Math.max(0, zoneRect.width - buttonWidth * noScale);
  const maxTop = Math.max(0, zoneRect.height - buttonHeight * noScale);

  if (state.noAttempts <= 4 && secretMark) {
    const screenRect = screens.question.getBoundingClientRect();
    const secretRect = secretMark.getBoundingClientRect();
    const radius = Math.min(86, Math.max(48, secretRect.width * 0.32));
    const angle = Math.random() * Math.PI * 2;
    const distance = radius * (0.45 + Math.random() * 0.75);
    const rawLeft =
      secretRect.left + secretRect.width / 2 - zoneRect.left + Math.cos(angle) * distance - (buttonWidth * noScale) / 2;
    const rawTop =
      secretRect.top + secretRect.height / 2 - zoneRect.top + Math.sin(angle) * distance - (buttonHeight * noScale) / 2;
    const minLeft = screenRect.left - zoneRect.left + 8;
    const maxSecretLeft = screenRect.right - zoneRect.left - buttonWidth * noScale - 8;
    const minTop = screenRect.top - zoneRect.top + 8;
    const maxSecretTop = screenRect.bottom - zoneRect.top - buttonHeight * noScale - 8;

    return {
      left: clamp(rawLeft, minLeft, maxSecretLeft),
      top: clamp(rawTop, minTop, maxSecretTop),
    };
  }

  return {
    left: Math.random() * maxLeft,
    top: Math.random() * maxTop,
  };
}

function dodgeNoButton(event) {
  if (event) {
    event.preventDefault();
  }

  state.noAttempts += 1;
  const zoneRect = choiceZone.getBoundingClientRect();
  const buttonWidth = noButton.offsetWidth;
  const buttonHeight = noButton.offsetHeight;
  const noScale = Math.max(0.34, 1 - state.noAttempts * 0.1);
  const yesScale = Math.min(1.65, 1 + state.noAttempts * 0.12);
  const yesWidth = Math.min(zoneRect.width - 52, 124 + state.noAttempts * 8);
  const noPosition = getNoButtonPosition(zoneRect, buttonWidth, buttonHeight, noScale);

  noButton.style.left = `${noPosition.left}px`;
  noButton.style.top = `${noPosition.top}px`;
  noButton.style.transform = `scale(${noScale}) rotate(${state.noAttempts % 2 ? -7 : 7}deg)`;

  yesButton.style.width = `${yesWidth}px`;
  yesButton.style.minHeight = `${Math.min(86, 60 + state.noAttempts * 4)}px`;
  yesButton.style.left = `${(zoneRect.width - yesWidth) / 2}px`;
  yesButton.style.top = `${Math.max(36, 72 - state.noAttempts * 3)}px`;
  yesButton.style.borderWidth = `${Math.min(6, 2 + state.noAttempts)}px`;
  yesButton.style.fontSize = `${Math.min(1.7, 1.18 + state.noAttempts * 0.1)}rem`;
  yesButton.style.transform = `scale(${yesScale})`;

  const hints = [
    "NOは今日は休みみたい。",
    "押せそうで押せないよ。",
    "そろそろYESにしよ？",
    "YESが待ってるよ。",
  ];
  questionHint.textContent = hints[Math.min(state.noAttempts - 1, hints.length - 1)];
}

function fillTimeOptions() {
  for (let hour = 10; hour <= 22; hour += 1) {
    ["00", "30"].forEach((minute) => {
      if (hour === 22 && minute === "30") {
        return;
      }
      const value = `${String(hour).padStart(2, "0")}:${minute}`;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = `${hour}時${minute}分`;
      if (value === state.selectedTime) {
        option.selected = true;
      }
      timeSelect.append(option);
    });
  }
}

function renderCalendar() {
  calendarGrid.replaceChildren();

  const year = state.activeMonth.getFullYear();
  const month = state.activeMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthIsPast = new Date(year, month, 0) < today;

  calendarTitle.textContent = `${year}年${month + 1}月`;
  prevMonthButton.disabled = previousMonthIsPast;

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    const empty = document.createElement("span");
    empty.className = "empty-day";
    calendarGrid.append(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    const button = document.createElement("button");
    button.className = "day-button";
    button.type = "button";
    button.textContent = day;
    button.disabled = current < today;
    button.setAttribute("aria-label", `${formatDate(current)}を選択`);

    if (dateKey(current) === dateKey(today)) {
      button.classList.add("is-today");
    }

    if (state.selectedDate && dateKey(current) === dateKey(state.selectedDate)) {
      button.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      state.selectedDate = current;
      updateDatePreview();
      renderCalendar();
    });

    calendarGrid.append(button);
  }
}

function updateDatePreview() {
  if (!state.selectedDate) {
    datePreview.textContent = "日付を選んでね。";
    toMenuButton.disabled = true;
    return;
  }

  datePreview.textContent = `${formatDate(state.selectedDate)} ${formatTime(state.selectedTime)}`;
  toMenuButton.disabled = false;
}

function renderMenus() {
  menuGrid.replaceChildren();

  menus.forEach((menu) => {
    const button = document.createElement("button");
    button.className = "menu-card";
    button.type = "button";
    button.innerHTML = `
      <span class="menu-illustration" aria-hidden="true">${menu.icon}</span>
      <span class="menu-name">${menu.name}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedMenu = menu;
      showSummary();
    });
    menuGrid.append(button);
  });
}

function showSummary() {
  summaryDate.textContent = `${formatDate(state.selectedDate)} ${formatTime(state.selectedTime)}`;
  summaryMenu.textContent = [state.selectedMenu.summaryIcon, state.selectedMenu.name].filter(Boolean).join(" ");
  showScreen("summary");
}

function resetFlow() {
  state.selectedDate = null;
  state.selectedMenu = null;
  state.selectedTime = "18:00";
  state.activeMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  timeSelect.value = state.selectedTime;
  updateDatePreview();
  renderCalendar();
  showScreen("date");
}

yesButton.addEventListener("click", () => {
  showScreen("date");
});
noButton.addEventListener("pointerenter", dodgeNoButton);
noButton.addEventListener("pointerdown", dodgeNoButton);
noButton.addEventListener("focus", dodgeNoButton);
noButton.addEventListener("click", dodgeNoButton);

prevMonthButton.addEventListener("click", () => {
  state.activeMonth = new Date(state.activeMonth.getFullYear(), state.activeMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  state.activeMonth = new Date(state.activeMonth.getFullYear(), state.activeMonth.getMonth() + 1, 1);
  renderCalendar();
});

timeSelect.addEventListener("change", () => {
  state.selectedTime = timeSelect.value;
  updateDatePreview();
});

toMenuButton.addEventListener("click", () => {
  if (state.selectedDate) {
    showScreen("menu");
  }
});

restartButton.addEventListener("click", resetFlow);
window.addEventListener("resize", () => {
  if (screens.question.hidden) {
    return;
  }
  noButton.style.left = "";
  noButton.style.top = "";
  noButton.style.transform = "";
  yesButton.style.width = "";
  yesButton.style.minHeight = "";
  yesButton.style.left = "";
  yesButton.style.top = "";
  yesButton.style.borderWidth = "";
  yesButton.style.fontSize = "";
  yesButton.style.transform = "";
});

fillTimeOptions();
renderCalendar();
renderMenus();
updateDatePreview();
