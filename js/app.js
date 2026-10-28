const UMBRAL_STOCK_BAJO = 5;
const PRECIO_MAX = 99999999.99;
const ESPERA_BUSQUEDA = 300;

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

let productosCargados = [];
let productosVenta = [];

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function formatearPrecio(precio) {
  return formatoPrecio.format(Number(precio) || 0);
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "";
  }

  return formatoFecha.format(new Date(fecha.replace(" ", "T")));
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
          <button
            type="button"
            class="secondary"
            data-accion="sumar"
            data-id="${producto.id}"
          >+1</button>
          ${stockBajo ? '<small class="tag">Stock bajo</small>' : ""}
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

async function cargarVentas() {
  const response = await fetch("api/ventas.php");
  const ventas = await response.json();

  renderizarVentas(ventas);
}

function renderizarVentas(ventas) {
  const tbody = document.querySelector("#ventas-body");
  tbody.innerHTML = "";

  if (ventas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">Sin ventas registradas</td></tr>';
    document.querySelector("#total-ventas").textContent = "";
    return;
  }

  let total = 0;

  ventas.forEach((venta) => {
    total += Number(venta.total);

    const productos = venta.detalle
      .map(
        (item) =>
          `${item.cantidad} × ${escapar(item.producto_nombre)} — ${escapar(formatearPrecio(item.subtotal))}`,
      )
      .join("<br>");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapar(formatearFecha(venta.fecha))}</td>
      <td>${productos}</td>
      <td>${escapar(formatearPrecio(venta.total))}</td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelector("#total-ventas").textContent =
    `Total: ${ventas.length} venta${ventas.length === 1 ? "" : "s"} — ${formatearPrecio(total)}`;
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

async function abrirModalVenta() {
  const response = await fetch("api/productos.php");
  productosVenta = await response.json();

  const contenedor = document.querySelector("#venta-lineas");
  contenedor.innerHTML = "";
  document.querySelector("#venta-mensaje").hidden = true;

  const hayStock = productosVenta.some((producto) => producto.stock > 0);

  document.querySelector("#btn-registrar-venta").disabled = !hayStock;
  document.querySelector("#agregar-linea").disabled = !hayStock;

  if (hayStock) {
    agregarLineaVenta();
  } else {
    mostrarMensajeVenta("No hay productos con stock.");
  }

  actualizarTotalVenta();
  document.querySelector("#modal-venta").showModal();
}

function crearLineaVenta() {
  const linea = document.createElement("div");
  linea.className = "venta-linea";

  const select = document.createElement("select");
  select.className = "venta-linea-producto";

  productosVenta
    .filter((producto) => producto.stock > 0)
    .forEach((producto) => {
      const option = document.createElement("option");
      option.value = producto.id;
      option.textContent = `${producto.nombre} (stock: ${producto.stock})`;
      select.appendChild(option);
    });

  const cantidad = document.createElement("input");
  cantidad.type = "number";
  cantidad.className = "venta-linea-cantidad";
  cantidad.min = "1";
  cantidad.step = "1";
  cantidad.value = "1";

  const subtotal = document.createElement("span");
  subtotal.className = "subtotal";

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "secondary";
  quitar.textContent = "×";
  quitar.title = "Quitar producto";

  select.addEventListener("change", actualizarTotalVenta);
  cantidad.addEventListener("input", actualizarTotalVenta);
  quitar.addEventListener("click", () => {
    linea.remove();
    actualizarTotalVenta();
  });

  linea.append(select, cantidad, subtotal, quitar);

  return linea;
}

function agregarLineaVenta() {
  document.querySelector("#venta-lineas").appendChild(crearLineaVenta());
  actualizarTotalVenta();
}

function actualizarTotalVenta() {
  let total = 0;

  document.querySelectorAll(".venta-linea").forEach((linea) => {
    const select = linea.querySelector(".venta-linea-producto");
    const cantidad = Number(linea.querySelector(".venta-linea-cantidad").value);
    const producto = productosVenta.find((p) => p.id === Number(select.value));

    const subtotal =
      producto && Number.isInteger(cantidad) && cantidad > 0
        ? producto.precio * cantidad
        : 0;

    linea.querySelector(".subtotal").textContent = formatearPrecio(subtotal);
    total += subtotal;
  });

  document.querySelector("#venta-total").textContent =
    `Total: ${formatearPrecio(total)}`;
}

function mostrarMensajeVenta(texto) {
  const mensaje = document.querySelector("#venta-mensaje");

  mensaje.textContent = texto;
  mensaje.hidden = false;
  mensaje.classList.add("error");
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

let temporizadorBusqueda;

document.querySelector("#busqueda").addEventListener("input", (e) => {
  const texto = e.target.value;

  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(() => {
    cargarProductos(texto);
  }, ESPERA_BUSQUEDA);
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

document.querySelector("#abrir-venta").addEventListener("click", abrirModalVenta);

document
  .querySelector("#agregar-linea")
  .addEventListener("click", agregarLineaVenta);

document.querySelector("#cerrar-venta").addEventListener("click", () => {
  document.querySelector("#modal-venta").close();
});

document.querySelector("#form-venta").addEventListener("submit", async (e) => {
  e.preventDefault();

  const lineas = [...document.querySelectorAll(".venta-linea")];

  if (lineas.length === 0) {
    mostrarMensajeVenta("Agregá al menos un producto.");
    return;
  }

  const items = [];
  const cantidades = {};

  for (const linea of lineas) {
    const producto = productosVenta.find(
      (p) => p.id === Number(linea.querySelector(".venta-linea-producto").value),
    );
    const cantidad = Number(linea.querySelector(".venta-linea-cantidad").value);

    if (!producto) {
      mostrarMensajeVenta("Elegí un producto en cada línea.");
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      mostrarMensajeVenta(
        "Las cantidades deben ser números enteros mayores a 0.",
      );
      return;
    }

    cantidades[producto.id] = (cantidades[producto.id] ?? 0) + cantidad;

    if (cantidades[producto.id] > producto.stock) {
      mostrarMensajeVenta(
        `No hay stock suficiente de ${producto.nombre}. Disponible: ${producto.stock}.`,
      );
      return;
    }

    items.push({ producto_id: producto.id, cantidad });
  }

  const response = await fetch("api/ventas.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const resultado = await response.json();

  if (!resultado.ok) {
    mostrarMensajeVenta(resultado.mensaje);
    return;
  }

  document.querySelector("#modal-venta").close();
  mostrarMensaje("Venta registrada. Total: " + formatearPrecio(resultado.total));
  cargarProductos(busquedaActual());
  cargarVentas();
});

cargarProductos();
cargarVentas();
