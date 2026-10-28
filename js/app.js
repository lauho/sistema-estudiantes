const UMBRAL_STOCK_BAJO = 5;
const PRECIO_MAX = 99999999.99;

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

let productosCargados = [];

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function formatearPrecio(precio) {
  return formatoPrecio.format(Number(precio) || 0);
}

function validarProducto(datos) {
  const nombre = (datos.nombre ?? "").trim();
  const precioTexto = String(datos.precio ?? "").trim();
  const stockTexto = String(datos.stock ?? "").trim();

  if (nombre === "") {
    return { ok: false, mensaje: "El nombre es obligatorio.", datos: null };
  }

  if (precioTexto === "" || !Number.isFinite(Number(precioTexto))) {
    return { ok: false, mensaje: "El precio debe ser un número.", datos: null };
  }

  const precio = Number(precioTexto);

  if (precio < 0) {
    return {
      ok: false,
      mensaje: "El precio no puede ser negativo.",
      datos: null,
    };
  }

  if (precio > PRECIO_MAX) {
    return { ok: false, mensaje: "El precio es demasiado alto.", datos: null };
  }

  if (stockTexto === "" || !Number.isInteger(Number(stockTexto))) {
    return {
      ok: false,
      mensaje: "El stock debe ser un número entero.",
      datos: null,
    };
  }

  const stock = Number(stockTexto);

  if (stock < 0) {
    return {
      ok: false,
      mensaje: "El stock no puede ser negativo.",
      datos: null,
    };
  }

  return { ok: true, mensaje: "", datos: { nombre, precio, stock } };
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
    const stockBajo = producto.stock <= UMBRAL_STOCK_BAJO;
    const tr = document.createElement("tr");

    if (stockBajo) {
      tr.classList.add("stock-bajo");
    }

    tr.innerHTML = `
      <td>${escapar(producto.nombre)}</td>
      <td>${escapar(formatearPrecio(producto.precio))}</td>
      <td>
        <div class="acciones">
          <button
            type="button"
            class="secondary"
            data-accion="restar"
            data-id="${producto.id}"
            ${producto.stock === 0 ? "disabled" : ""}
          >−1</button>
          <span class="stock-numero">${producto.stock}</span>
          ${stockBajo ? '<small class="tag">Stock bajo</small>' : ""}
          <button
            type="button"
            class="secondary"
            data-accion="sumar"
            data-id="${producto.id}"
          >+1</button>
        </div>
      </td>
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

async function cambiarStock(id, delta) {
  const response = await fetch(
    `api/productos.php?id=${id}&delta=${delta}`,
    { method: "PATCH" },
  );

  const resultado = await response.json();

  if (!resultado.ok) {
    mostrarMensaje(resultado.mensaje, true);
    return;
  }

  mostrarMensaje("Stock actualizado: " + resultado.stock + " unidades.");
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
  const accion = boton.dataset.accion;

  if (accion === "sumar") {
    cambiarStock(id, 1);
    return;
  }

  if (accion === "restar") {
    cambiarStock(id, -1);
    return;
  }

  if (accion === "eliminar") {
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

  const validacion = validarProducto({
    nombre: document.querySelector("#editar-nombre").value,
    precio: document.querySelector("#editar-precio").value,
    stock: document.querySelector("#editar-stock").value,
  });

  if (!validacion.ok) {
    mostrarMensaje(validacion.mensaje, true);
    return;
  }

  const datos = {
    id: Number(document.querySelector("#editar-id").value),
    ...validacion.datos,
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

    const validacion = validarProducto({
      nombre: document.querySelector("#nombre").value,
      precio: document.querySelector("#precio").value,
      stock: document.querySelector("#stock").value,
    });

    if (!validacion.ok) {
      mostrarMensaje(validacion.mensaje, true);
      return;
    }

    const response = await fetch("api/productos.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validacion.datos),
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
