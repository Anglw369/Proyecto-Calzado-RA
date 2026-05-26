// Variables de estado globales de la interfaz
let modeloActual = "Cubo 3D (Tenis)";
let colorNombreActual = "Azul Sport";
let colorHexActual = "#0A58CA";
let tallaActual = 26.0; 

// 1. EL BOTÓN "MODELO" ABRE EL PANEL VISUAL DE SELECCIÓN
function intercambiarModelo() {
    document.getElementById("menu-modelos-visual").classList.remove("hidden");
}

// 2. SELECCIÓN AL DAR TAP EN LAS TARJETAS CON ICONOS
function cambiarGeometriaTacto(tipoForma, nombreComercial) {
    modeloActual = nombreComercial;
    document.getElementById("view-modelo").innerText = modeloActual;

    // Llama a Three.js para renderizar la geometría
    if (typeof window.generarGeometriaSimulada === "function") {
        window.generarGeometriaSimulada(tipoForma, colorHexActual);
    }

    // Mantiene el tamaño proporcional configurado
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    // Cierra el menú al dar clic
    document.getElementById("menu-modelos-visual").classList.add("hidden");
}

// 3. CAMBIO DE COLOR LIBRE NATIVO
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

// 4. BARRA DE AJUSTE DE TALLA MANUAL
function ajustarTallaManual(nuevaTalla) {
    tallaActual = parseFloat(nuevaTalla);
    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Ajuste)";

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 5. ACCIÓN DEL BOTÓN FLOTANTE "CALIBRAR MEDIDA" (REVELA EL SLIDER)
function simularMedicionIA() {
    tallaActual = 26.0; 

    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Auto)";
    
    const slider = document.getElementById("size-slider");
    if(slider) slider.value = tallaActual;

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    const toolsPanel = document.getElementById("debug-tools-panel");
    if (toolsPanel) {
        toolsPanel.classList.remove("hidden");
        toolsPanel.style.cssText += 'display: flex !important;';
    }

    alert(`📐 [MÉTRICA IA]: Calibración lista.\nTalla base: ${tallaActual} MX.\n\nPuedes ajustar la forma usando la barra de 'Talla Manual' inferior.`);
}

// 6. GUARDAR PREFERENCIAS
function guardarConfiguracionActual() {
    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorHexActual, tallaActual);
        alert(`¡Guardado con éxito!\n\nModelo: ${modeloActual}\nColor: ${colorHexActual}\nTalla: ${tallaActual} MX`);
    }
}

// Exponer funciones globales
window.intercambiarModelo = intercambiarModelo;
window.cambiarGeometriaTacto = cambiarGeometriaTacto;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;