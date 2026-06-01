// Variables de estado globales de la interfaz
let modeloActual = "Cubo 3D (Tenis)";
let colorNombreActual = "Azul Sport";
let colorHexActual = "#0A58CA";
let tallaActual = 26.0; 

// 1. EL BOTÓN "MODELO" ABRE EL PANEL VISUAL DE SELECCIÓN SIN INTERFERENCIAS
function intercambiarModelo() {
    const modal = document.getElementById("menu-modelos-visual");
    if (modal) {
        modal.style.display = "flex";
    }
}

// 2. SELECCIÓN AL DAR TAP EN LAS TARJETAS CON ICONOS
function cambiarGeometriaTacto(tipoForma, nombreComercial) {
    modeloActual = nombreComercial;
    document.getElementById("view-modelo").innerText = modeloActual;

    if (typeof window.generarGeometriaSimulada === "function") {
        window.generarGeometriaSimulada(tipoForma, colorHexActual);
    }
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    document.getElementById("menu-modelos-visual").style.display = "none";
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

// 4. BARRA DE TAMAÑO MANUAL
function ajustarTallaManual(nuevaTalla) {
    tallaActual = parseFloat(nuevaTalla);
    
    const viewTalla = document.getElementById("view-talla");
    if (viewTalla) {
        viewTalla.innerText = tallaActual.toFixed(1) + " MX (Ajuste)";
    }

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 5. ACCIÓN DEL BOTÓN FLOTANTE "CALIBRAR MEDIDA"
function simularMedicionIA() {
    tallaActual = 26.0; 

    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Auto)";
    
    const slider = document.getElementById("size-slider");
    if(slider) slider.value = tallaActual;

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    // CORRECCIÓN 2: Modificamos el estilo de display directo para convivir con Alpine
    const toolsPanel = document.getElementById("debug-tools-panel");
    if (toolsPanel) {
        toolsPanel.style.display = "flex";
    }

    // Disparador de alerta de Alpine con canal validado
    if (typeof window.dispararAlertaPremium === "function") {
        window.dispararAlertaPremium(`📐 [MÉTRICA IA]\n\nCalibración lista.\nTalla base estimada: ${tallaActual.toFixed(1)} MX.\n\nPuedes ajustar la forma exacta usando la barra de 'Talla Manual' inferior.`, 'straighten', 'Calibración');
    }
}

// 6. GUARDAR PREFERENCIAS
function guardarConfiguracionActual() {
    window.modeloActual = modeloActual;
    window.colorHexActual = colorHexActual;
    window.tallaActual = tallaActual;

    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorHexActual, tallaActual);
        
        if (typeof window.dispararAlertaPremium === "function") {
            window.dispararAlertaPremium(`¡Guardado con éxito!\n\n📦 Modelo: ${modeloActual}\n🎨 Color: ${colorHexActual.toUpperCase()}\n📏 Talla: ${tallaActual.toFixed(1)} MX`, 'check_circle', 'Éxito');
        }
    }
}

// Exponer funciones globales de forma estricta para el HTML y Alpine
window.modeloActual = modeloActual;
window.colorHexActual = colorHexActual;
window.tallaActual = tallaActual;

window.intercambiarModelo = intercambiarModelo;
window.cambiarGeometriaTacto = cambiarGeometriaTacto;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;