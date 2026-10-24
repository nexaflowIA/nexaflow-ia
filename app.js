(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "nexaflow-ia-data-v1";
  const blank = () => ({clients: [], tasks: [], projects: [], events: []});
  let data = loadData();
  function loadData() {
    try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); return parsed && typeof parsed === "object" ? {...blank(), ...parsed} : blank(); }
    catch { return blank(); }
  }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { $("data-message").textContent = "No se pudieron guardar los cambios. Descarga una copia y libera espacio del navegador."; } render(); }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function empty(text) { return `<div class="empty-state">${esc(text)}</div>`; }
  function removeButton(type, id) { return `<button class="item-delete" data-delete="${type}" data-id="${esc(id)}" aria-label="Eliminar">×</button>`; }
  function renderList(id, items, type, makeItem, emptyText) {
    $(id).innerHTML = items.length ? items.map(item => makeItem(item) + removeButton(type, item.id)).map(html => `<div class="item-wrap">${html}</div>`).join("") : empty(emptyText);
    $(id).querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => { if (confirm("¿Quieres eliminar este elemento?")) { data[btn.dataset.delete] = data[btn.dataset.delete].filter(x => x.id !== btn.dataset.id); save(); } }));
  }
  function render() {
    renderList("clients-list", data.clients, "clients", x => `<div class="item"><div class="item-main"><div class="item-title">${esc(x.name)}</div><div class="item-sub">${esc(x.contact || "")}${x.note ? " · " + esc(x.note) : ""}</div></div>`, "Todavía no has añadido clientes.");
    renderList("tasks-list", data.tasks, "tasks", x => `<div class="item"><input class="item-check" type="checkbox" data-task="${esc(x.id)}" ${x.done ? "checked" : ""} aria-label="Marcar tarea terminada"><div class="item-main ${x.done ? "done" : ""}"><div class="item-title">${esc(x.title)}</div><div class="item-sub">${x.due ? "Fecha: " + esc(x.due) : "Sin fecha límite"}</div><span class="tag ${x.priority === "Alta" ? "high" : ""}">${esc(x.priority)}</span></div>`, "No hay tareas pendientes.");
    renderList("projects-list", data.projects, "projects", x => `<div class="item"><div class="item-main"><div class="item-title">${esc(x.title)}</div><div class="item-sub">${esc(x.next || "Sin siguiente paso definido")}</div></div>`, "Añade tu primer proyecto.");
    renderList("events-list", data.events, "events", x => `<div class="item"><div class="item-main"><div class="item-title">${esc(x.title)}</div><div class="item-sub">${esc(x.date)}${x.time ? " · " + esc(x.time) : ""}</div></div>`, "Tu agenda está vacía.");
    $("tasks-list").querySelectorAll("[data-task]").forEach(box => box.addEventListener("change", () => { const t = data.tasks.find(x => x.id === box.dataset.task); if (t) t.done = box.checked; save(); }));
    const pending = data.tasks.filter(t => !t.done);
    $("hero-tasks").textContent = pending.length;
    $("hero-projects").textContent = data.projects.length;
    $("next-step").textContent = pending[0] ? pending[0].title : "Añade tu primera tarea en el panel.";
    const done = data.tasks.filter(t => t.done).length;
    $("progress-bar").style.width = data.tasks.length ? `${Math.round(done / data.tasks.length * 100)}%` : "0%";
    $("progress-label").textContent = data.tasks.length ? `${done} de ${data.tasks.length} tareas completadas` : "Empieza hoy, paso a paso.";
  }
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  function formValues(form) { return Object.fromEntries(new FormData(form).entries()); }
  $("client-form").addEventListener("submit", e => { e.preventDefault(); const v = formValues(e.currentTarget); data.clients.unshift({id:uid(), ...v}); e.currentTarget.reset(); save(); });
  $("task-form").addEventListener("submit", e => { e.preventDefault(); const v = formValues(e.currentTarget); data.tasks.unshift({id:uid(), ...v, done:false}); e.currentTarget.reset(); save(); });
  $("project-form").addEventListener("submit", e => { e.preventDefault(); const v = formValues(e.currentTarget); data.projects.unshift({id:uid(), ...v}); e.currentTarget.reset(); save(); });
  $("event-form").addEventListener("submit", e => { e.preventDefault(); const v = formValues(e.currentTarget); data.events.push({id:uid(), ...v}); data.events.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time)); e.currentTarget.reset(); save(); });
  $("export-data").addEventListener("click", () => { const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "NexaFlow-IA-copia-datos.json"; a.click(); URL.revokeObjectURL(url); $("data-message").textContent = "Copia descargada. Guárdala en Archivos."; });
  $("import-button").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async e => { const file = e.target.files[0]; if (!file) return; try { const parsed = JSON.parse(await file.text()); for (const k of ["clients","tasks","projects","events"]) if (!Array.isArray(parsed[k])) throw new Error(); data = {...blank(), ...parsed}; save(); $("data-message").textContent = "Copia importada correctamente."; } catch { $("data-message").textContent = "Ese archivo no parece una copia válida de NexaFlow IA."; } e.target.value = ""; });
  $("clear-data").addEventListener("click", () => { if (confirm("Esto borrará clientes, tareas, proyectos y agenda guardados en este navegador. ¿Continuar?")) { data = blank(); save(); $("data-message").textContent = "Se han borrado los datos de este navegador."; } });
  $("today").textContent = new Intl.DateTimeFormat("es-ES", {day:"numeric", month:"short"}).format(new Date());
  $("year").textContent = new Date().getFullYear();
  $("menu-toggle").addEventListener("click", () => $("nav").classList.toggle("open"));
  $("nav").querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("nav").classList.remove("open")));
  function localReply(message) {
    const m = message.toLowerCase();
    if (/priori|organizar|por dónde empiezo|empezar/.test(m)) return "Prueba este orden:\n1. Anota todo lo pendiente.\n2. Marca como prioridad alta lo urgente y lo que desbloquea a otras personas.\n3. Elige solo tres tareas importantes para hoy.\n4. Reserva un bloque de tiempo para la primera y revisa al final del día.";
    if (/correo|email|mensaje|escribir/.test(m)) return "Puedes usar esta estructura:\n\nAsunto: [tema concreto]\n\nHola [nombre]:\n\nTe escribo para [motivo]. [Añade aquí los detalles importantes].\n\nQuedo pendiente de tu respuesta.\n\nUn saludo,\n[Tu nombre]\n\nSi me dices a quién va dirigido y qué quieres comunicar, te preparo un borrador.";
    if (/proyecto|planificar|plan/.test(m)) return "Para ordenar un proyecto, define: 1) resultado que quieres conseguir; 2) tres pasos concretos; 3) persona responsable; 4) fecha objetivo; y 5) cómo sabrás que está terminado. Añade cada paso como tarea para hacer seguimiento.";
    if (/cliente|ventas|comercial/.test(m)) return "Para hacer seguimiento a un cliente, registra el último contacto, qué necesita, el próximo paso y una fecha de seguimiento. Mantén las notas profesionales y evita guardar datos sensibles innecesarios.";
    if (/agenda|reunión|cita|tiempo/.test(m)) return "Agrupa las citas por fecha, deja un pequeño margen entre reuniones y reserva tiempo para tareas que requieren concentración. Añade a la agenda el objetivo de cada reunión y el siguiente paso.";
    return "Puedo ayudarte con tareas, correos, proyectos, seguimiento de clientes y planificación. Para orientarte mejor, dime el objetivo, qué has intentado y qué resultado necesitas. Esta versión incluye ayuda básica local; no tiene una IA generativa conectada por defecto.";
  }
  function addMessage(text, who) { const div = document.createElement("div"); div.className = `message ${who}`; div.textContent = text; $("messages").appendChild(div); $("messages").scrollTop = $("messages").scrollHeight; }
  $("chat-form").addEventListener("submit", async e => {
    e.preventDefault(); const input = $("question"); const message = input.value.trim(); if (!message) return;
    addMessage(message, "user"); input.value = ""; $("chat-status").textContent = "Preparando respuesta…";
    // If the optional Netlify function is configured, try it; otherwise use the free local helper.
    try {
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch("/.netlify/functions/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message}), signal:controller.signal});
      clearTimeout(timeout);
      const result = await response.json();
      if (response.ok && result.reply) { addMessage(result.reply, "bot"); $("chat-status").textContent = "Asistente conectado"; return; }
    } catch (_) {}
    addMessage(localReply(message), "bot"); $("chat-status").textContent = "Ayuda básica disponible sin coste de API";
  });
  render();
})();