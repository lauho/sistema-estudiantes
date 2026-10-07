async function cargarEstudiantes(busqueda = "") {
  const url = busqueda
    ? `api/estudiantes.php?q=${encodeURIComponent(busqueda)}`
    : "api/estudiantes.php";

  const response = await fetch(url);
  const estudiantes = await response.json();

  const tbody = document.querySelector("#tabla-body");
  tbody.innerHTML = "";

  if (estudiantes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Sin resultados</td></tr>';
    return;
  }

  estudiantes.forEach((est) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${est.nombre}</td>
      <td>${est.apellido}</td>
      <td>${est.email}</td>
      <td>
        <button type="button" onclick="abrirModal(${est.id}, '${est.nombre}', '${est.apellido}', '${est.email}')">Editar</button>
        <button type="button" class="secondary" onclick="eliminar(${est.id}, this)">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function mostrarMensaje(texto) {
  const mensaje = document.querySelector("#mensaje");
  mensaje.textContent = texto;
  mensaje.hidden = false;
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
    mostrarMensaje(resultado.mensaje);
  }
}

function abrirModal(id, nombre, apellido, email) {
  document.querySelector("#editar-id").value = id;
  document.querySelector("#editar-nombre").value = nombre;
  document.querySelector("#editar-apellido").value = apellido;
  document.querySelector("#editar-email").value = email;

  document.querySelector("#modal-editar").showModal();
}

document.querySelector("#form-editar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    id: document.querySelector("#editar-id").value,
    nombre: document.querySelector("#editar-nombre").value.trim(),
    apellido: document.querySelector("#editar-apellido").value.trim(),
    email: document.querySelector("#editar-email").value.trim(),
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
    mostrarMensaje(resultado.mensaje);
  }
});

document.querySelector("#cerrar-modal").addEventListener("click", () => {
  document.querySelector("#modal-editar").close();
});

document.querySelector("#busqueda").addEventListener("input", (e) => {
  cargarEstudiantes(e.target.value);
});

document
  .querySelector("#form-estudiante")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre: document.querySelector("#nombre").value.trim(),
      apellido: document.querySelector("#apellido").value.trim(),
      email: document.querySelector("#email").value.trim(),
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
      cargarEstudiantes();
    } else {
      mostrarMensaje(resultado.mensaje);
    }
  });

cargarEstudiantes();
