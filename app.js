// ====== CONFIG ======
const SUPABASE_URL = "https://ntmjsofgcsmwrwyodmnr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bWpzb2ZnY3Ntd3J3eW9kbW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTg4NTksImV4cCI6MjA4NzAzNDg1OX0.wnH9db-qSOOJ-2gvvrUcMCm0OlT9mtZrYET2BAN9bdo";

// Tu rifa
const RAFFLE_ID = "6cc50852-f1c9-418d-b6a3-5d5b6dbef350";

// WhatsApp del administrador (10 dígitos)
const ADMIN_WHATSAPP = "6681245905";

// ====== PAQUETES (CAMBIA PRECIOS A LOS TUYOS) ======
const PACKAGES = [
  { qty: 2, price: 120 },
  { qty: 3, price: 170 },
  { qty: 5, price: 250 },
  { qty: 10, price: 450 },
  { qty: 20, price: 800 },
];

// ====== ✅ ESTADOS COMPLETOS (MX + "ESTADOS UNIDOS") ======
const STATES_FULL = [
  "AGUASCALIENTES",
  "BAJA CALIFORNIA",
  "BAJA CALIFORNIA SUR",
  "CAMPECHE",
  "CHIAPAS",
  "CHIHUAHUA",
  "CIUDAD DE MÉXICO",
  "COAHUILA",
  "COLIMA",
  "DURANGO",
  "ESTADO DE MÉXICO",
  "GUANAJUATO",
  "GUERRERO",
  "HIDALGO",
  "JALISCO",
  "MICHOACÁN",
  "MORELOS",
  "NAYARIT",
  "NUEVO LEÓN",
  "OAXACA",
  "PUEBLA",
  "QUERÉTARO",
  "QUINTANA ROO",
  "SAN LUIS POTOSÍ",
  "SINALOA",
  "SONORA",
  "TABASCO",
  "TAMAULIPAS",
  "TLAXCALA",
  "VERACRUZ",
  "YUCATÁN",
  "ZACATECAS",
  "ESTADOS UNIDOS", // ✅ extra para identificar que vive allá
];

// ====== INIT ======
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM (general)
const pageLoader = document.getElementById("pageLoader");
const gridEl = document.getElementById("ticketsGrid");
const selectedChipsEl = document.getElementById("selectedChips");
const selectedCountEl = document.getElementById("selectedCount");

const ticketSearchEl = document.getElementById("ticketSearch");
const searchStatusEl = document.getElementById("searchStatus");
const btnElegirEl = document.getElementById("btnElegir");
const btnApartarEl = document.getElementById("btnApartar");

// MODAL APARTAR DOM
const apartarOverlay = document.getElementById("apartarOverlay");
const apartarClose = document.getElementById("apartarClose");
const apartarPackageText = document.getElementById("apartarPackageText");
const mWhatsapp = document.getElementById("mWhatsapp");
const mNombre = document.getElementById("mNombre");
const mApellidos = document.getElementById("mApellidos");
const mEstado = document.getElementById("mEstado");
const mApartarBtn = document.getElementById("mApartarBtn");
const mError = document.getElementById("mError");

// MODAL MAQUINITA DOM
const btnMaquinita = document.getElementById("btnMaquinita");
const maquinitaOverlay = document.getElementById("maquinitaOverlay");
const maquinitaClose = document.getElementById("maquinitaClose");
const maqSelect = document.getElementById("maqSelect");
const maqBox = document.getElementById("maqBox");
const maqBoxText = document.getElementById("maqBoxText");
const maqGif = document.getElementById("maqGif");
const maqNums = document.getElementById("maqNums");
const maqConfirm = document.getElementById("maqConfirm");

// Estado local
const selected = new Set(); // números seleccionados (int)
const ticketStatusMap = new Map(); // number -> status ("available"|"reserved"|"sold")

// paquete seleccionado
let selectedPackage = null; // {qty, price} | null
let maqGenerated = []; // números generados en maquinita

function showLoader(on) {
  if (!pageLoader) return;
  pageLoader.classList.toggle("hidden", !on);
}

function pad5(n) {
  return String(n).padStart(5, "0");
}
function onlyDigits5(value) {
  return (value || "").replace(/\D/g, "").slice(0, 5);
}
function onlyDigits10(v) {
  return (v || "").replace(/\D/g, "").slice(0, 10);
}
function money(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(n || 0)
  );
}
function getPackageByQty(qty) {
  return PACKAGES.find((p) => p.qty === qty) || { qty, price: 0 };
}
function packageLabel() {
  if (selectedPackage && selectedPackage.price > 0) {
    return `${selectedPackage.qty} BOLETOS POR ${money(selectedPackage.price)}`;
  }
  return `${selected.size} BOLETO(S) POR APARTAR`;
}

// ====== ✅ LLENAR ESTADOS EN EL SELECT (UNA SOLA VEZ) ======
function fillStates(){
  if (!mEstado) return;
  // si ya tiene opciones (porque pegaste HTML con estados), lo reemplazamos completo
  mEstado.innerHTML =
    `<option value="">SELECCIONA ESTADO</option>` +
    STATES_FULL.map(s => `<option>${s}</option>`).join("");
}

// ====== MAYÚSCULAS EN MODAL ======
function forceUpper(el){
  if (!el) return;
  el.addEventListener("input", () => {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = (el.value || "").toUpperCase();
    try { el.setSelectionRange(start, end); } catch {}
  });
}
forceUpper(mNombre);
forceUpper(mApellidos);

// ====== RENDER SELECTED (chips) ======
function renderSelected() {
  selectedCountEl.textContent = String(selected.size);
  selectedChipsEl.innerHTML = "";

  [...selected]
    .sort((a, b) => a - b)
    .forEach((num) => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = pad5(num);
      chip.title = "Click para eliminar";
      chip.addEventListener("click", () => {
        selected.delete(num);
        // si toca manualmente, pierde paquete
        selectedPackage = null;
        renderSelected();
        const btn = document.querySelector(`[data-ticket="${num}"]`);
        if (btn) btn.classList.remove("selected");
        if (apartarPackageText) apartarPackageText.textContent = packageLabel();
      });
      selectedChipsEl.appendChild(chip);
    });
}

// ====== GRID ======
function addToSelection(num) {
  const st = ticketStatusMap.get(num);
  if (st !== "available") return;

  if (selected.has(num)) {
    selected.delete(num);
    const btn = document.querySelector(`[data-ticket="${num}"]`);
    if (btn) btn.classList.remove("selected");
  } else {
    selected.add(num);
    const btn = document.querySelector(`[data-ticket="${num}"]`);
    if (btn) btn.classList.add("selected");
  }

  // si el usuario toca manualmente, ya no es paquete
  selectedPackage = null;

  renderSelected();
  if (apartarPackageText) apartarPackageText.textContent = packageLabel();
}

function renderGrid(numbers) {
  gridEl.innerHTML = "";
  numbers.forEach((num) => {
    const status = ticketStatusMap.get(num) || "available";
    const btn = document.createElement("div");
    btn.className = "ticket" + (status !== "available" ? " disabled" : "");
    btn.dataset.ticket = String(num);
    btn.textContent = pad5(num);

    if (selected.has(num)) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      const st = ticketStatusMap.get(num) || "available";
      if (st !== "available") return;
      addToSelection(num);
    });

    gridEl.appendChild(btn);
  });
}

// ====== LOAD TICKETS ======
async function loadTickets() {
  showLoader(true);

  const { data, error } = await supa
    .from("tickets")
    .select("number,status")
    .eq("raffle_id", RAFFLE_ID)
    .order("number", { ascending: true });

  showLoader(false);

  if (error) {
    console.error("LOAD TICKETS ERROR:", error);
    alert("Error cargando boletos. Revisa consola (F12).");
    return;
  }

  ticketStatusMap.clear();
  data.forEach((row) => ticketStatusMap.set(row.number, row.status));
  renderGrid(data.map((r) => r.number));
}

// ====== SEARCH (solo 5 dígitos) ======
let lastSearchValue = "";
let searchTimer = null;

ticketSearchEl.addEventListener("input", () => {
  const cleaned = onlyDigits5(ticketSearchEl.value);
  ticketSearchEl.value = cleaned;

  btnElegirEl.disabled = true;
  searchStatusEl.textContent = "";
  searchStatusEl.className = "search-status";

  if (cleaned.length < 5) return;

  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(cleaned), 250);
});

async function runSearch(fiveDigits) {
  if (fiveDigits === lastSearchValue) return;
  lastSearchValue = fiveDigits;

  const num = parseInt(fiveDigits, 10);
  searchStatusEl.textContent = "Verificando…";
  searchStatusEl.className = "search-status";

  const { data, error } = await supa.rpc("check_ticket", {
    p_raffle_id: RAFFLE_ID,
    p_number: num,
  });

  if (error) {
    console.error("CHECK TICKET ERROR:", error);
    searchStatusEl.textContent = "Error verificando.";
    searchStatusEl.className = "search-status bad";
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row || row.status === "not_found") {
    searchStatusEl.textContent = `✖ Número inválido o no existe: ${pad5(num)}`;
    searchStatusEl.className = "search-status bad";
    btnElegirEl.disabled = true;
    return;
  }

  ticketStatusMap.set(num, row.status);

  if (row.is_available) {
    searchStatusEl.textContent = `✔ Número disponible: ${pad5(num)}`;
    searchStatusEl.className = "search-status ok";
    btnElegirEl.disabled = false;

    btnElegirEl.onclick = () => {
      addToSelection(num);
      ticketSearchEl.value = "";
      lastSearchValue = "";
      btnElegirEl.disabled = true;
      searchStatusEl.textContent = "";
      searchStatusEl.className = "search-status";
    };
  } else {
    searchStatusEl.textContent = `✖ Número NO disponible: ${pad5(num)}`;
    searchStatusEl.className = "search-status bad";
    btnElegirEl.disabled = true;

    const btn = document.querySelector(`[data-ticket="${num}"]`);
    if (btn) btn.classList.add("disabled");
  }
}

// ===== MODAL APARTAR helpers =====
function openModal() {
  if (!apartarOverlay) {
    alert("No encuentro el modal. Asegúrate de pegar el HTML del modal en index.html");
    return;
  }

  // ✅ llena estados completos
  fillStates();

  apartarPackageText.textContent = packageLabel();
  mError.textContent = "";

  mWhatsapp.value = "";
  mNombre.value = "";
  mApellidos.value = "";
  mEstado.value = "";

  // Bloqueados hasta whatsapp válido
  mNombre.disabled = true;
  mApellidos.disabled = true;
  mEstado.disabled = true;

  apartarOverlay.classList.remove("hidden");
  mWhatsapp.focus();
}

function closeModal() {
  apartarOverlay.classList.add("hidden");
}

if (apartarClose) apartarClose.addEventListener("click", closeModal);
if (apartarOverlay) {
  apartarOverlay.addEventListener("click", (e) => {
    if (e.target === apartarOverlay) closeModal();
  });
}

// ===== APARTAR button opens modal =====
btnApartarEl.addEventListener("click", () => {
  if (selected.size === 0) {
    alert("Primero selecciona al menos 1 boleto.");
    return;
  }
  openModal();
});

// ===== Precarga por WhatsApp =====
let customerLookupTimer = null;

mWhatsapp?.addEventListener("input", () => {
  mWhatsapp.value = onlyDigits10(mWhatsapp.value);
  mError.textContent = "";

  // reset campos
  mNombre.value = "";
  mApellidos.value = "";
  mEstado.value = "";
  mNombre.disabled = true;
  mApellidos.disabled = true;
  mEstado.disabled = true;

  if (mWhatsapp.value.length < 10) return;

  if (customerLookupTimer) clearTimeout(customerLookupTimer);
  customerLookupTimer = setTimeout(loadCustomerByWhatsapp, 250);
});

async function loadCustomerByWhatsapp() {
  const w = mWhatsapp.value;
  if (w.length !== 10) return;

  const { data, error } = await supa.rpc("get_customer_by_whatsapp", {
    p_whatsapp: w,
  });

  if (error) {
    console.error("GET CUSTOMER ERROR:", error);
    mNombre.disabled = false;
    mApellidos.disabled = false;
    mEstado.disabled = false;
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (row) {
    mNombre.value = (row.first_name || "").toUpperCase();
    mApellidos.value = (row.last_name || "").toUpperCase();

    // ✅ si el estado guardado existe en la lista, lo selecciona. Si no, lo deja vacío.
    const savedState = (row.state || "").toUpperCase();
    const okState = STATES_FULL.includes(savedState);
    mEstado.value = okState ? savedState : "";
  }

  mNombre.disabled = false;
  mApellidos.disabled = false;
  mEstado.disabled = false;
}

// ===== Confirm Apartar =====
mApartarBtn?.addEventListener("click", async () => {
  mError.textContent = "";

  const w = mWhatsapp.value.trim(); // ✅ sin prefijos, 10 dígitos
  const fn = (mNombre.value || "").trim().toUpperCase();
  const ln = (mApellidos.value || "").trim().toUpperCase();
  const st = (mEstado.value || "").trim().toUpperCase();

  if (w.length !== 10) {
    mError.textContent = "WhatsApp debe tener 10 dígitos.";
    return;
  }
  if (!fn || !ln || !st) {
    mError.textContent = "Completa nombre, apellidos y estado.";
    return;
  }
  if (selected.size === 0) {
    mError.textContent = "No hay boletos seleccionados.";
    return;
  }

  const numbers = [...selected].sort((a, b) => a - b);

  // Botón pulsando
  mApartarBtn.classList.add("pulsing");
  mApartarBtn.disabled = true;

  try {
    const { error } = await supa.rpc("reserve_tickets", {
      p_raffle_id: RAFFLE_ID,
      p_numbers: numbers,
      p_whatsapp: w,      // ✅ se queda 10 dígitos
      p_first_name: fn,
      p_last_name: ln,
      p_state: st,        // ✅ puede ser "ESTADOS UNIDOS"
    });

    if (error) {
      console.error("RESERVE TICKETS ERROR:", error);
      mError.textContent = error.message || "Error al apartar.";
      await loadTickets();
      return;
    }

    closeModal();

    // sincroniza UI
    selected.clear();
    renderSelected();
    await loadTickets();

    const pkgText =
      selectedPackage && selectedPackage.price > 0
        ? `${selectedPackage.qty} BOLETOS - ${money(selectedPackage.price)}`
        : `${numbers.length} BOLETOS`;

    // WhatsApp al admin
    const msg =
      `Hola, se apartaron boletos:\n` +
      `${numbers.map(pad5).join(", ")}\n\n` +
      `Paquete: ${pkgText}\n` +
      `Cliente: ${fn} ${ln}\n` +
      `WhatsApp: ${w}\n` +
      `Estado: ${st}\n\n` +
      `Apartado por 12 horas.`;

    const url = `https://wa.me/52${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    // limpiar paquete
    selectedPackage = null;
  } finally {
    mApartarBtn.classList.remove("pulsing");
    mApartarBtn.disabled = false;
  }
});

// ====== MAQUINITA (como el video) ======
function openMaquinita() {
  maqSelect.innerHTML =
    `<option value="">Selecciona</option>` +
    PACKAGES
      .map((p) => `<option value="${p.qty}">${p.qty} Boletos por ${money(p.price)}</option>`)
      .join("");

  maqGenerated = [];
  maqNums.textContent = "";
  maqConfirm.classList.add("hidden");
  maqGif.classList.add("hidden");
  maqBoxText.textContent = "Selecciona un paquete arriba";
  maquinitaOverlay.classList.remove("hidden");
}

function closeMaquinita() {
  maquinitaOverlay.classList.add("hidden");
}

btnMaquinita?.addEventListener("click", openMaquinita);
maquinitaClose?.addEventListener("click", closeMaquinita);
maquinitaOverlay?.addEventListener("click", (e) => {
  if (e.target === maquinitaOverlay) closeMaquinita();
});

maqSelect?.addEventListener("change", () => {
  const qty = parseInt(maqSelect.value, 10);
  maqGenerated = [];
  maqNums.textContent = "";
  maqConfirm.classList.add("hidden");
  maqGif.classList.add("hidden");

  if (!qty) {
    maqBoxText.textContent = "Selecciona un paquete arriba";
    return;
  }
  maqBoxText.textContent = `HAZ CLICK AQUÍ PARA GENERAR ${qty} BOLETOS AL AZAR!`;
});

async function generateMaquinita() {
  const qty = parseInt(maqSelect.value, 10);
  if (!qty) return;

  // UI: mostrar gif dentro del cuadro
  maqNums.textContent = "";
  maqConfirm.classList.add("hidden");
  maqBoxText.textContent = "";
  maqGif.classList.remove("hidden");

  await new Promise((r) => setTimeout(r, 1200));

  const { data, error } = await supa.rpc("pick_random_available", {
    p_raffle_id: RAFFLE_ID,
    p_qty: qty,
  });

  maqGif.classList.add("hidden");

  if (error) {
    console.error("pick_random_available error FULL:", JSON.stringify(error, null, 2), error);

    const msg =
      (error && (error.message || error.error_description || error.details)) ||
      "Error desconocido en pick_random_available.";

    maqBoxText.textContent = "ERROR: " + msg;
    return;
  }

  const nums = (data || []).map((x) => x.number);
  if (nums.length !== qty) {
    maqBoxText.textContent = "No hubo suficientes boletos disponibles.";
    return;
  }

  maqGenerated = nums.sort((a, b) => a - b);
  maqNums.textContent = maqGenerated.map(pad5).join(", ");
  maqBoxText.textContent = `HAZ CLICK AQUÍ PARA GENERAR ${qty} BOLETOS AL AZAR!`;
  maqConfirm.classList.remove("hidden");
}

maqBox?.addEventListener("click", () => {
  const qty = parseInt(maqSelect.value, 10);
  if (!qty) return;
  generateMaquinita();
});

maqConfirm?.addEventListener("click", () => {
  if (!maqGenerated.length) return;

  const qty = parseInt(maqSelect.value, 10);
  selectedPackage = getPackageByQty(qty);

  selected.clear();
  document.querySelectorAll(".ticket.selected").forEach((el) => el.classList.remove("selected"));

  maqGenerated.forEach((n) => selected.add(n));
  renderSelected();

  maqGenerated.forEach((n) => {
    const el = document.querySelector(`[data-ticket="${n}"]`);
    if (el) el.classList.add("selected");
  });

  closeMaquinita();
  openModal();
});

// ===== START =====
renderSelected();
loadTickets();