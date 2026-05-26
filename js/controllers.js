// Variables de estado globales de la aplicación
let modeloActual = "Cubo 3D (Tenis)";
let colorNombreActual = "Azul Sport";
let colorHexActual = "#0A58CA";
let tallaActual = 0; 

// 1. CONTROLADOR PARA EL BOTÓN INFERIOR "MODELO" (Alterna visualmente de forma directa)
function intercambiarModelo() {
    const selector = document.getElementById("select-modelo-manual");
    
    // Si el panel de herramientas está oculto, le avisa al usuario que caletre primero
    if (document.getElementById("debug-tools-panel").classList.contains("hidden")) {
        alert("Por favor, presiona primero el botón 'CALIBRAR MEDIDA (IA)' para activar los objetos y sus controles manuales.");
        return;
    }

    // Alterna de forma automática la opción del menú desplegable visual
    if (selector.value === "cubo") {
        selector.value = "cilindro";
    } else {
        selector.value = "cubo";
    }
    
    // Ejecuta el cambio visual en Three.js
    seleccionarObjetoVisual(selector.value);
}

// 2. FUNCIÓN COLECTORA DEL SELECTOR VISUAL DE OBJETOS
function seleccionarObjetoVisual(tipoForma) {
    if (tipoForma === "cilindro") {
        modeloActual = "Cilindro 3D (Bota)";
    } else {
        modeloActual = "Cubo 3D (Tenis)";
    }
    
    document.getElementById("view-modelo").innerText = modeloActual;

    // Llama al motor tridimensional de main.js
    if (typeof window.generarGeometriaSimulada === "function") {
        window.generarGeometriaSimulada(tipoForma, colorHexActual);
    }

    // Mantiene el tamaño que tenga el slider configurado actualmente
    if (tallaActual > 0 && typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 3. MANEJO MANUAL DE COLOR (PALETA NATIVA)
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

// 4. BARRA DE TAMAÑO MANUAL (SLIDER FLOTANTE INTERACTIVO)
function ajustarTallaManual(nuevaTalla) {
    tallaActual = parseFloat(nuevaTalla);
    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Ajuste)";

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 5. ACCIÓN DEL BOTÓN FLOTANTE "CALIBRAR MEDIDA" -> REVELA TODO EL PANEL DE SELECCIÓN MANUAL
function simularMedicionIA() {
    tallaActual = 26.0; // Talla por defecto automática inicial

    // 1. Mostramos los datos calculados en el cartel beige superior
    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Auto)";
    
    // 2. Sincronizamos el control deslizante al mismo valor
    const slider = document.getElementById("size-slider");
    if(slider) slider.value = tallaActual;

    // 3. Renderizamos la escala inicial en Three.js
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    // 4. ¡PUM! Forzamos la aparición del panel completo de herramientas manuales abajo
    const toolsPanel = document.getElementById("debug-tools-panel");
    if (toolsPanel) {
        toolsPanel.classList.remove("hidden");
        // Asegura que anule cualquier display:none previo del CSS
        toolsPanel.style.setAttribute ? toolsPanel.style.setAttribute("display", "flex", "important") : toolsPanel.style.cssText += 'display: flex !important;';
    }

    alert(`📐 [MÉTRICA IA]: Escaneo completo.\n\nSe ha activado el panel inferior de 'Ajuste Manual' por si necesitas refinar la talla o cambiar el objeto visualmente.`);
}

// 6. GUARDAR CONFIGURACIÓN ACTUAL
function guardarConfiguracionActual() {
    if (tallaActual === 0) tallaActual = 26.0;

    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorHexActual, tallaActual);
        alert(`¡Guardado en Supabase!\n\nModelo: ${modeloActual}\nColor: ${colorHexActual}\nTalla: ${tallaActual} MX`);
    }
}

// Exponer funciones globales al navegador
window.intercambiarModelo = intercambiarModelo;
window.seleccionarObjetoVisual = seleccionarObjetoVisual;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;