let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let precioMaximo = "todos";
let ordenActual = "normal";

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const filtroPrecio = document.querySelector("#filtroPrecio");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");
const contadorNum = document.querySelector("#contador-num");

async function cargarExperiencias() {
    try {
        estado.textContent = "Cargando experiencias...";
        const respuesta = await fetch("./data/experiencias.json");
        if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias");
        experiencias = await respuesta.json();
        estado.textContent = `${experiencias.length} experiencias cargadas correctamente.`;
        actualizarCatalogo();
    } catch (error) {
        estado.textContent = "Error al cargar la información del servidor local.";
        console.error(error);
    }
}

function obtenerResultados() {
    let resultados = [...experiencias];

    // Filtro por categoría
    if (categoriaActual !== "todas") {
        resultados = resultados.filter(e => e.categoria === categoriaActual);
    }

    // Filtro por texto de búsqueda
    if (textoBusqueda !== "") {
        resultados = resultados.filter(e => 
            e.nombre.toLowerCase().includes(textoBusqueda)
        );
    }

    // Filtro por precio máximo
    if (precioMaximo !== "todos") {
        const limite = Number(precioMaximo);
        resultados = resultados.filter(e => e.precio <= limite);
    }

    // Ordenamiento por precio
    if (ordenActual === "ascendente") {
        resultados.sort((a, b) => a.precio - b.precio);
    } else if (ordenActual === "descendente") {
        resultados.sort((a, b) => b.precio - a.precio);
    }

    return resultados;
}

function actualizarCatalogo() {
    const resultados = obtenerResultados();
    
    // Actualizar el número en el badge superior
    contadorNum.textContent = resultados.length;

    if (resultados.length === 0) {
        catalogo.innerHTML = '<p class="sin-resultados">No se encontraron experiencias con los filtros seleccionados.</p>';
        estado.textContent = "0 resultados encontrados";
        return;
    }

    catalogo.innerHTML = resultados.map(e => `
        <article class="tarjeta">
            <div class="imagen">${e.icono}</div>
            <div class="informacion">
                <span class="categoria">${e.categoria}</span>
                <h3>${e.nombre}</h3>
                <p class="cupo-txt">Cupo disponible: ${e.cupo} personas</p>
                <p class="precio">$${e.precio} <span style="font-size:0.8rem; font-weight:normal; color:var(--gris);">MXN</span></p>
                <div class="acciones-tarjeta">
                    <label>Asistentes:
                        <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
                    </label>
                    <button class="btn-reservar" data-id="${e.id}">Agregar a reserva</button>
                </div>
            </div>
        </article>
    `).join("");

    estado.textContent = `Mostrando ${resultados.length} de ${experiencias.length} experiencias disponibles.`;
    agregarEventosReservar();
}

function agregarEventosReservar() {
    document.querySelectorAll(".btn-reservar").forEach(boton => {
        boton.addEventListener("click", () => agregarReserva(Number(boton.dataset.id)));
    });
}

function agregarReserva(id) {
    const experiencia = experiencias.find(e => e.id === id);
    const inputCantidad = document.querySelector(`#cantidad-${id}`);
    const cantidad = Number(inputCantidad.value);
    
    if (cantidad < 1 || cantidad > experiencia.cupo) {
        alert("Por favor, ingresa una cantidad válida dentro del cupo disponible.");
        return;
    }
    
    const existente = reservas.find(r => r.experienciaId === id);
    
    if (existente) {
        const nuevaCantidad = existente.cantidad + cantidad;
        if (nuevaCantidad > experiencia.cupo) {
            alert("La cantidad total supera el cupo máximo disponible para esta experiencia.");
            return;
        }
        existente.cantidad = nuevaCantidad;
        existente.subtotal = nuevaCantidad * experiencia.precio;
    } else {
        reservas.push({
            experienciaId: id,
            nombre: experiencia.nombre,
            precio: experiencia.precio,
            cantidad,
            subtotal: experiencia.precio * cantidad
        });
    }
    mostrarReservas();
}

function mostrarReservas() {
    if (reservas.length === 0) {
        listaReservas.innerHTML = '<p class="vacio-msg">No hay experiencias seleccionadas.</p>';
        total.textContent = "\$0 MXN";
        return;
    }
    
    listaReservas.innerHTML = reservas.map(r => `
        <article class="item-reserva">
            <div>
                <strong>${r.nombre}</strong>
                <p>${r.cantidad} persona(s) × $${r.precio} MXN</p>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <strong style="color: var(--oscuro); font-size: 1.1rem;">$${r.subtotal} MXN</strong>
                <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
            </div>
        </article>
    `).join("");
    
    const totalReserva = reservas.reduce((suma, r) => suma + r.subtotal, 0);
    total.textContent = `$${totalReserva} MXN`;
    agregarEventosEliminar();
}

function agregarEventosEliminar() {
    document.querySelectorAll(".btn-eliminar").forEach(boton => {
        boton.addEventListener("click", () => eliminarReserva(Number(boton.dataset.id)));
    });
}

function eliminarReserva(id) {
    reservas = reservas.filter(r => r.experienciaId !== id);
    mostrarReservas();
}

// Event Listeners para controles interactivos
buscador.addEventListener("input", () => {
    textoBusqueda = buscador.value.trim().toLowerCase();
    actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
    categoriaActual = filtroCategoria.value;
    actualizarCatalogo();
});

filtroPrecio.addEventListener("change", () => {
    precioMaximo = filtroPrecio.value;
    actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
    ordenActual = ordenPrecio.value;
    actualizarCatalogo();
});

// Inicializar aplicación al cargar
cargarExperiencias();