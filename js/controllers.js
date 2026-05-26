// Variables de estado del usuario actual
let modeloActual = "Cubo 3D (Tenis)";
let colorNombreActual = "Azul Sport";
let colorHexActual = "#0A58CA";
let tallaActual = 0; 

// 1. ABRIR EL MODAL SELECCIONADOR DE MODELOS
function intercambiarModelo() {
    // Revelamos el modal visual con las tarjetas e iconos
    document.getElementById("modal-modelos").classList.remove("hidden");
}

// Esta función se ejecuta al tocar una tarjeta de calzado en el modal
function seleccionarModeloManual(tipoForma, nombreComercial) {
    modeloActual = nombreComercial;
    document.getElementById("view-modelo").innerText = modeloActual;

    // Le ordenamos a Three.js renderizar la figura seleccionada
    if (typeof window.generarGeometriaSimulada === "function") {
        window.generarGeometriaSimulada(tipoForma, colorHexActual);
    }

    // Mantenemos la escala que tenga activa el slider actualmente
    if (tallaActual > 0 && typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    // Cerramos el modal de forma limpia
    document.getElementById("modal-modelos").classList.add("hidden");
}

// 2. MANEJO MANUAL DE COLOR (PALETA NATIVA)
function intercambiarColor() {
    document.getElementById('color-picker').click();
}

function seleccionarColorManual(hexSeleccionado) {
    colorHexActual = hexSeleccionado;
    colorNombreActual = "Personalizado (" + hexSeleccionado.toUpperCase() + ")";

    document.getElementById("view-color-name").innerText = colorNombreActual;
    document.getElementById("color-preview").style.backgroundColor = colorHexActual;

    if (typeof window.actualizarColorGeometria === "function") {
        window.actualizarColorGeometria(colorHexActual);
    }
}

// 3. BARRA DE TAMAÑO MANUAL (SLIDER FLOTANTE INTERACTIVO)
function ajustarTallaManual(nuevaTalla) {
    tallaActual = parseFloat(nuevaTalla);
    
    // Refrescamos la caja beige superior marcando que fue un ajuste manual
    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Ajuste)";

    // Mandamos el factor métrico al eje Z de Three.js
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 4. ACCIÓN DEL BOTÓN FLOTANTE "CALIBRAR MEDIDA" -> REVELA EL SLIDER MANUAL
function simularMedicionIA() {
    // Simulamos que la IA corre el algoritmo automático y tira un valor base
    const tallasPrueba = [25.0, 26.0, 26.5, 27.5, 28.0];
    const randomIdx = Math.floor(Math.random() * tallasPrueba.length);
    tallaActual = tallasPrueba[randomIdx];

    // 1. Mostramos los datos calculados por el escáner
    document.getElementById("view-talla").innerText = tallaActual + " MX (Auto)";
    
    // 2. Sincronizamos el slider físico al mismo valor que arrojó la IA
    const slider = document.getElementById("size-slider");
    slider.value = tallaActual;

    // 3. Modificamos el volumen 3D en Three.js
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    // 4. ¡PUM! Revelamos la barra deslizable de ajuste manual abajo por si hay error
    const sizePanel = document.getElementById("debug-size-panel");
    sizePanel.classList.remove("hidden");
    sizePanel.style.display = "flex"; // Forzamos el display flex para que alinee bien

    alert(`📐 [MÉTRICA IA]: Pie calibrado de forma automática.\nTalla detectada: ${tallaActual} MX.\n\n⚠️ Si la figura no encaja del todo bien con tu pie, puedes afinar el volumen usando la barra de 'Ajuste Manual' que acaba de aparecer abajo.`);
}

// 5. GUARDAR CONFIGURACIÓN ACTUAL
function guardarConfiguracionActual() {
    if (tallaActual === 0) tallaActual = 26.0;

    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorHexActual, tallaActual);
        alert(`¡Guardado en Supabase!\n\nModelo: ${modeloActual}\nColor: ${colorHexActual}\nTalla: ${tallaActual} MX`);
    }
}

// Exponer funciones globales
window.intercambiarModelo = intercambiarModelo;
window.seleccionarModeloManual = seleccionarModeloManual;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;