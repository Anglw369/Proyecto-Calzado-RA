// Variables de estado globales
let modeloActual = "Cubo 3D (Tenis)";
let colorNombreActual = "Azul Sport";
let colorHexActual = "#0A58CA";
let trackingIniciado = false; 
let tallaActual = 26.0; // Cambiamos a 26 base para que Three.js pueda escalar desde el inicio si cambias modelo

// 1. EL BOTÓN "MODELO" ABRE EL SELECTOR VISUAL NATIVO DEL CELULAR DE INMEDIATO
function intercambiarModelo() {
    // Forzamos la apertura de las opciones nativas en la pantalla
    const picker = document.getElementById("model-picker-hidden");
    if (picker) {
        picker.click(); 
        // Nota: En algunos navegadores móviles 'click()' en select requiere focus o una interacción directa,
        // para asegurar compatibilidad total, si el click nativo se bloquea, usamos un menú selectivo limpio:
        const opciones = prompt("Selecciona el modelo 3D:\n\nEscribe 1 para: Cubo 3D (Tenis)\nEscribe 2 para: Cilindro 3D (Bota)", picker.value === "cubo" ? "1" : "2");
        if (opciones === "1") picker.value = "cubo";
        if (opciones === "2") picker.value = "cilindro";
        if (opciones === "1" || opciones === "2") seleccionarObjetoVisual(picker.value);
    }
}

// 2. FUNCIÓN CAMBIADORA DE OBJETOS EN THREE.JS
function seleccionarObjetoVisual(tipoForma) {
    if (tipoForma === "cilindro") {
        modeloActual = "Cilindro 3D (Bota)";
    } else {
        modeloActual = "Cubo 3D (Tenis)";
    }
    
    // Mostramos el cambio en el cartel beige superior
    document.getElementById("view-modelo").innerText = modeloActual;

    // Le ordenamos a main.js renderizar la forma geométrica
    if (typeof window.generarGeometriaSimulada === "function") {
        window.generarGeometriaSimulada(tipoForma, colorHexActual);
    }

    // Le aplicamos el tamaño que tenga activo el sistema para que no se deforme
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 3. CAMBIO DE COLOR LIBRE (FUNCIONA DESDE EL INICIO)
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

// 4. BARRA DE TAMAÑO MANUAL
function ajustarTallaManual(nuevaTalla) {
    tallaActual = parseFloat(nuevaTalla);
    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Ajuste)";

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 5. ACCIÓN DEL BOTÓN "CALIBRAR MEDIDA" (REVELA ÚNICAMENTE LA BARRA DE TALLA)
function simularMedicionIA() {
    trackingIniciado = true;
    tallaActual = 26.0; 

    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Auto)";
    
    const slider = document.getElementById("size-slider");
    if(slider) slider.value = tallaActual;

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    // Mostramos la barra de tamaño abajo por si el usuario quiere ajustar
    const toolsPanel = document.getElementById("debug-tools-panel");
    if (toolsPanel) {
        toolsPanel.classList.remove("hidden");
        toolsPanel.style.cssText += 'display: flex !important;';
    }

    alert(`📐 [MÉTRICA IA]: Escaneo automático completo.\nTalla: ${tallaActual} MX.\n\nSe activó la barra de 'Talla Manual' inferior por si requieres ajustar el volumen.`);
}

// 6. GUARDAR CONFIGURACIÓN
function guardarConfiguracionActual() {
    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorHexActual, tallaActual);
        alert(`¡Guardado con éxito!\n\nModelo: ${modeloActual}\nColor: ${colorHexActual}\nTalla: ${tallaActual} MX`);
    }
}

// Exponer funciones globales
window.intercambiarModelo = intercambiarModelo;
window.seleccionarObjetoVisual = seleccionarObjetoVisual;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;