const CANTIDAD_NOTAS = 4;
const NOTA_MIN = 1;
const NOTA_MAX = 10;
const UMBRAL_APROBADO = 6;

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function notasDesdeTexto(valor) {
  if (!valor) {
    return Array(CANTIDAD_NOTAS).fill("");
  }

  const partes = valor.split(",").slice(0, CANTIDAD_NOTAS);
  while (partes.length < CANTIDAD_NOTAS) {
    partes.push("");
  }

  return partes.map((n) => n.trim());
}

function parsearNotas(texto) {
  const crudo = (texto ?? "").trim();

  if (crudo === "") {
    return { ok: false, mensaje: "Ingresa las 4 notas separadas por coma." };
  }

  const partes = crudo.split(",").map((n) => n.trim());

  if (partes.length !== CANTIDAD_NOTAS) {
    return {
      ok: false,
      mensaje: `Esperaba 4 notas separadas por coma y recibió ${partes.length}. Usá punto para los decimales: 8.5,7,9,10`,
    };
  }

  const notas = [];

  for (const parte of partes) {
    if (parte === "" || !/^-?\d+(\.\d+)?$/.test(parte)) {
      return { ok: false, mensaje: `"${parte}" no es un número válido.` };
    }

    const numero = Number(parte);

    if (numero < NOTA_MIN || numero > NOTA_MAX) {
      return {
        ok: false,
        mensaje: `La nota ${parte} está fuera del rango de ${NOTA_MIN} a ${NOTA_MAX}.`,
      };
    }

    notas.push(numero);
  }

  return { ok: true, mensaje: "", notas };
}

function actualizarPreview(inputId, previewId) {
  const input = document.querySelector(`#${inputId}`);
  const preview = document.querySelector(`#${previewId}`);
  const resultado = parsearNotas(input.value);

  if (input.value.trim() === "") {
    preview.textContent = "";
    preview.classList.remove("error");
    return;
  }

  if (!resultado.ok) {
    preview.textContent = resultado.mensaje;
    preview.classList.add("error");
    return;
  }

  const promedio = calcularPromedio(resultado.notas);
  const aprobado = promedio >= UMBRAL_APROBADO;

  preview.textContent = `Promedio: ${promedio.toFixed(2)} (${aprobado ? "Aprobado" : "Desaprobado"})`;
  preview.classList.remove("error");
}

function calcularPromedio(notas) {
  const numeros = notas
    .filter((n) => n !== "")
    .map(Number)
    .filter((n) => !Number.isNaN(n));

  if (numeros.length === 0) {
    return null;
  }

  return numeros.reduce((a, b) => a + b, 0) / CANTIDAD_NOTAS;
}

function mostrarMensaje(texto, esError = false) {
  const mensaje = document.querySelector("#mensaje");
  mensaje.textContent = texto;
  mensaje.hidden = false;
  mensaje.classList.toggle("error", esError);
}

function renderizarEstudiantes(estudiantes) {
  const tbody = document.querySelector("#tabla-body");
  tbody.innerHTML = "";

  if (estudiantes.length === 0) {
    tbody.innerHTML = '<tr data-vacio="1"><td colspan="6">Sin resultados</td></tr>';
    filtrarEstado();
    return;
  }

  estudiantes.forEach((est) => {
    const notas = notasDesdeTexto(est.notas);
    const promedio = calcularPromedio(notas);
    const aprobado = promedio !== null && promedio >= UMBRAL_APROBADO;
    const sinNotas = (est.notas ?? "").trim() === "";
    const estado = promedio === null ? "" : aprobado ? "Aprobado" : "Desaprobado";
    const inactivo = est.activo === 0;

    const tr = document.createElement("tr");
    tr.dataset.estado = estado;
    tr.dataset.nombre = est.nombre;
    tr.dataset.apellido = est.apellido;
    tr.dataset.email = est.email;
    tr.dataset.promedio = promedio === null ? "" : String(promedio);
    tr.innerHTML = `
      <td>${escapar(est.nombre)}${inactivo ? ' <small class="tag">Inactivo</small>' : ""}</td>
      <td>${escapar(est.apellido)}</td>
      <td>${escapar(est.email)}</td>
      <td>${sinNotas ? "-" : escapar(notas.join(", "))}</td>
      <td>${
        promedio === null
          ? "-"
          : `${promedio.toFixed(2)} (${aprobado ? "Aprobado" : "Desaprobado"})`
      }</td>
      <td class="acciones-td">
        <div class="acciones">
          <button type="button" data-accion="editar" data-id="${est.id}">Editar</button>
          ${
            inactivo
              ? `<button type="button" data-accion="reactivar" data-id="${est.id}">Reactivar</button>`
              : `<button type="button" class="secondary" data-accion="eliminar" data-id="${est.id}">Eliminar</button>`
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  filtrarEstado();
}

function filtrarEstado() {
  const seleccion = document.querySelector("#filtro-estado").value;
  const filas = document.querySelectorAll("#tabla-body tr");

  filas.forEach((fila) => {
    if (fila.dataset.vacio) {
      fila.hidden = false;
      return;
    }

    fila.hidden = seleccion !== "" && fila.dataset.estado !== seleccion;
  });
}

function ordenarTabla(columna) {
  const tbody = document.querySelector("#tabla-body");
  const encabezado = document.querySelector(`th[data-orden="${columna}"]`);
  const ascendente = encabezado.dataset.dir !== "asc";

  const filas = Array.from(tbody.querySelectorAll("tr:not([data-vacio])"));
  const numerica = columna === "promedio";

  filas.sort((a, b) => {
    const va = a.dataset[columna] ?? "";
    const vb = b.dataset[columna] ?? "";

    if (numerica) {
      const na = va === "" ? null : Number(va);
      const nb = vb === "" ? null : Number(vb);

      if (na === null && nb === null) return 0;
      if (na === null) return 1;
      if (nb === null) return -1;

      return ascendente ? na - nb : nb - na;
    }

    const cmp = va.localeCompare(vb, "es");

    return ascendente ? cmp : -cmp;
  });

  filas.forEach((fila) => tbody.appendChild(fila));

  document.querySelectorAll("th.ordenable").forEach((th) => {
    delete th.dataset.dir;
    th.setAttribute("aria-sort", "none");
  });

  encabezado.dataset.dir = ascendente ? "asc" : "desc";
  encabezado.setAttribute(
    "aria-sort",
    ascendente ? "ascending" : "descending",
  );
}

function activarOrden() {
  document.querySelectorAll("th.ordenable").forEach((th) => {
    th.addEventListener("click", () =>
      ordenarTabla(th.dataset.orden),
    );

    th.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        ordenarTabla(th.dataset.orden);
      }
    });
  });
}

async function cargarEstudiantes(busqueda = "") {
  const params = new URLSearchParams();

  if (busqueda) {
    params.set("q", busqueda);
  }

  params.set("activo", document.querySelector("#filtro-activo").value);

  const response = await fetch(`api/estudiantes.php?${params}`);
  const estudiantes = await response.json();

  renderizarEstudiantes(estudiantes);
}

async function eliminar(id, boton) {
  if (!confirm("¿Eliminar este estudiante?")) {
    return;
  }

  const response = await fetch(`api/estudiantes.php?id=${id}`, {
    method: "DELETE",
  });

  const resultado = await response.json();

  if (resultado.ok) {
    boton.closest("tr").remove();
    mostrarMensaje("Estudiante eliminado correctamente. ID: " + resultado.id);
  } else {
    mostrarMensaje(resultado.mensaje, true);
  }
}

async function buscarEstudiante(id) {
  const params = new URLSearchParams();
  params.set("activo", document.querySelector("#filtro-activo").value);

  const response = await fetch(`api/estudiantes.php?${params}`);
  const estudiantes = await response.json();

  return estudiantes.find((e) => e.id == id);
}

async function reactivar(id, boton) {
  const response = await fetch(`api/estudiantes.php?id=${id}`, {
    method: "PATCH",
  });

  const resultado = await response.json();

  if (!resultado.ok) {
    mostrarMensaje(resultado.mensaje, true);
    return;
  }

  mostrarMensaje("Estudiante reactivado correctamente. ID: " + resultado.id);
  cargarEstudiantes(document.querySelector("#busqueda").value);
}

function abrirModal(estudiante) {
  document.querySelector("#editar-id").value = estudiante.id;
  document.querySelector("#editar-nombre").value = estudiante.nombre;
  document.querySelector("#editar-apellido").value = estudiante.apellido;
  document.querySelector("#editar-email").value = estudiante.email;

  document.querySelector("#editar-notas").value = estudiante.notas ?? "";
  actualizarPreview("editar-notas", "editar-notas-preview");

  document.querySelector("#modal-editar").showModal();
}

document.querySelector("#tabla-body").addEventListener("click", async (e) => {
  const boton = e.target.closest("button[data-accion]");

  if (!boton) {
    return;
  }

  const id = boton.dataset.id;

  if (boton.dataset.accion === "eliminar") {
    eliminar(id, boton);
    return;
  }

  if (boton.dataset.accion === "reactivar") {
    reactivar(id, boton);
    return;
  }

  const estudiante = await buscarEstudiante(id);

  if (!estudiante) {
    mostrarMensaje("No se encontró el estudiante en el listado actual.", true);
    return;
  }

  abrirModal(estudiante);
});

document.querySelector("#form-editar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const notas = parsearNotas(document.querySelector("#editar-notas").value);

  if (!notas.ok) {
    mostrarMensaje(notas.mensaje, true);
    return;
  }

  const datos = {
    id: document.querySelector("#editar-id").value,
    nombre: document.querySelector("#editar-nombre").value.trim(),
    apellido: document.querySelector("#editar-apellido").value.trim(),
    email: document.querySelector("#editar-email").value.trim(),
    notas: notas.notas,
  };

  const response = await fetch("api/estudiantes.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const resultado = await response.json();

  if (resultado.ok) {
    document.querySelector("#modal-editar").close();
    mostrarMensaje("Estudiante actualizado correctamente. ID: " + resultado.id);
    cargarEstudiantes(document.querySelector("#busqueda").value);
  } else {
    mostrarMensaje(resultado.mensaje, true);
  }
});

document.querySelector("#cerrar-modal").addEventListener("click", () => {
  document.querySelector("#modal-editar").close();
});

document.querySelector("#busqueda").addEventListener("input", (e) => {
  cargarEstudiantes(e.target.value);
});

document.querySelector("#filtro-estado").addEventListener("change", filtrarEstado);

document.querySelector("#filtro-activo").addEventListener("change", (e) => {
  cargarEstudiantes(document.querySelector("#busqueda").value);
});

activarOrden();

document.querySelector("#notas").addEventListener("input", () => {
  actualizarPreview("notas", "notas-preview");
});

document.querySelector("#editar-notas").addEventListener("input", () => {
  actualizarPreview("editar-notas", "editar-notas-preview");
});

document
  .querySelector("#form-estudiante")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const notas = parsearNotas(document.querySelector("#notas").value);

    if (!notas.ok) {
      mostrarMensaje(notas.mensaje, true);
      return;
    }

    const datos = {
      nombre: document.querySelector("#nombre").value.trim(),
      apellido: document.querySelector("#apellido").value.trim(),
      email: document.querySelector("#email").value.trim(),
      notas: notas.notas,
    };

    const response = await fetch("api/estudiantes.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    const resultado = await response.json();

    if (resultado.ok) {
      mostrarMensaje("Estudiante creado correctamente. ID: " + resultado.id);
      e.target.reset();
      actualizarPreview("notas", "notas-preview");
      cargarEstudiantes();
    } else {
      mostrarMensaje(resultado.mensaje, true);
    }
  });

cargarEstudiantes();