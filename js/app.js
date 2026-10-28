let productosCargados = [];

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function mostrarMensaje(texto, esError = false) {
  const mensaje = document.querySelector("#mensaje");
  mensaje.textContent = texto;
  mensaje.hidden = false;
  mensaje.classList.toggle("error", esError);
}

function busquedaActual() {
  return document.querySelector("#busqueda").value.trim();
}

function renderizarProductos(productos) {
  productosCargados = productos;

  const tbody = document.querySelector("#tabla-body");
  tbody.innerHTML = "";

  if (productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Sin resultados</td></tr>';
  }

  productos.forEach((producto) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapar(producto.nombre)}</td>
      <td>${escapar(producto.precio)}</td>
      <td>${escapar(producto.stock)}</td>
      <td class="acciones-td">
        <div class="acciones">
          <button type="button" data-accion="editar" data-id="${producto.id}">Editar</button>
          <button type="button" class="secondary" data-accion="eliminar" data-id="${producto.id}">Eliminar</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelector("#total").textContent =
    `Total: ${productos.length} producto${productos.length === 1 ? "" : "s"}`;
}

async function cargarProductos(busqueda = "") {
  const params = new URLSearchParams();

  if (busqueda) {
    params.set("q", busqueda);
  }

  const response = await fetch(`api/productos.php?${params}`);
  const productos = await response.json();

  renderizarProductos(productos);
}

async function eliminar(id) {
  if (!confirm("¿Eliminar este producto?")) {
    return;
  }

  const response = await fetch(`api/productos.php?id=${id}`, {
    method: "DELETE",
  });

  const resultado = await response.json();

  if (!resultado.ok) {
    mostrarMensaje(resultado.mensaje, true);
    return;
  }

  mostrarMensaje("Producto eliminado correctamente. ID: " + resultado.id);
  cargarProductos(busquedaActual());
}

function abrirModal(producto) {
  document.querySelector("#editar-id").value = producto.id;
  document.querySelector("#editar-nombre").value = producto.nombre;
  document.querySelector("#editar-precio").value = producto.precio;
  document.querySelector("#editar-stock").value = producto.stock;

  document.querySelector("#modal-editar").showModal();
}

document.querySelector("#tabla-body").addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");

  if (!boton) {
    return;
  }

  const id = Number(boton.dataset.id);

  if (boton.dataset.accion === "eliminar") {
    eliminar(id);
    return;
  }

  const producto = productosCargados.find((p) => p.id === id);

  if (!producto) {
    mostrarMensaje("No se encontró el producto en el listado actual.", true);
    return;
  }

  abrirModal(producto);
});

document.querySelector("#form-editar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    id: Number(document.querySelector("#editar-id").value),
    nombre: document.querySelector("#editar-nombre").value.trim(),
    precio: document.querySelector("#editar-precio").value,
    stock: document.querySelector("#editar-stock").value,
  };

  const response = await fetch("api/productos.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const resultado = await response.json();

  if (!resultado.ok) {
    mostrarMensaje(resultado.mensaje, true);
    return;
  }

  document.querySelector("#modal-editar").close();
  mostrarMensaje("Producto actualizado correctamente. ID: " + resultado.id);
  cargarProductos(busquedaActual());
});

document.querySelector("#cerrar-modal").addEventListener("click", () => {
  document.querySelector("#modal-editar").close();
});

document.querySelector("#busqueda").addEventListener("input", (e) => {
  cargarProductos(e.target.value);
});

document
  .querySelector("#form-producto")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
      nombre: document.querySelector("#nombre").value.trim(),
      precio: document.querySelector("#precio").value,
      stock: document.querySelector("#stock").value,
    };

    const response = await fetch("api/productos.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    const resultado = await response.json();

    if (!resultado.ok) {
      mostrarMensaje(resultado.mensaje, true);
      return;
    }

    mostrarMensaje("Producto creado correctamente. ID: " + resultado.id);
    e.target.reset();
    cargarProductos(busquedaActual());
  });

cargarProductos();
