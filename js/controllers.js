// Variables de estado globales sincronizadas con el entorno global de la ventana
window.modeloActual = window.modeloActual || "Cubo 3D (Tenis)";
window.colorHexActual = window.colorHexActual || "#0A58CA";
window.tallaActual = window.tallaActual || 26.0; 

function intercambiarModelo() {
    const modal = document.getElementById("menu-modelos-visual");
    if (modal) {
        modal.style.display = "flex";
    }
}

function cambiarGeometriaTacto(tipoForma, nombreComercial) {
    window.modeloActual = nombreComercial;
    document.getElementById("view-modelo").innerText = window.modeloActual;

    if (typeof window.generarGeometriaSimulada === "function") {
        window.generarGeometriaSimulada(tipoForma, window.colorHexActual);
    }
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(window.tallaActual);
    }

    document.getElementById("menu-modelos-visual").style.display = "none";
}

function intercambiarColor() {
    document.getElementById('color-picker').click();
}

function seleccionarColorManual(hexSeleccionado) {
    window.colorHexActual = hexSeleccionado;
    let colorNombreActual = "Personalizado (" + hexSeleccionado.toUpperCase() + ")";

    document.getElementById("view-color-name").innerText = colorNombreActual;
    document.getElementById("color-preview").style.backgroundColor = window.colorHexActual;

    if (typeof window.actualizarColorGeometria === "function") {
        window.actualizarColorGeometria(window.colorHexActual);
    }
}

function ajustarTallaManual(nuevaTalla) {
    window.tallaActual = parseFloat(nuevaTalla);
    
    const viewTalla = document.getElementById("view-talla");
    if (viewTalla) {
        viewTalla.innerText = window.tallaActual.toFixed(1) + " MX (Ajuste)";
    }

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(window.tallaActual);
    }
}

function simularMedicionIA() {
    if (typeof window.setIaMidiendoActivamente === "function") {
        window.setIaMidiendoActivamente(true);
    }

    const viewTalla = document.getElementById("view-talla");
    if (viewTalla) {
        viewTalla.innerText = "Escaneando pie...";
    }

    setTimeout(() => {
        if (typeof window.setIaMidiendoActivamente === "function") {
            window.setIaMidiendoActivamente(false);
        }

        const toolsPanel = document.getElementById("debug-tools-panel");
        if (toolsPanel) {
            toolsPanel.style.display = "flex";
        }

        if (typeof window.dispararAlertaPremium === "function") {
            window.dispararAlertaPremium(`📐 [MÉTRICA IA COMPLETADA]\n\nCalibración exitosa.\n\nTalla fijada: ${window.tallaActual.toFixed(1)} MX.\n\nEl tamaño se ha congelado correctamente. Si deseas refinarlo, puedes usar el control deslizante manual inferior.`, 'straighten', 'Calibración');
        }
    }, 1200); 
}

function guardarConfiguracionActual() {
    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(window.modeloActual, window.colorHexActual, window.tallaActual);
        
        if (typeof window.dispararAlertaPremium === "function") {
            window.dispararAlertaPremium(`¡Guardado con éxito!\n\n📦 Modelo: ${window.modeloActual}\n🎨 Color: ${window.colorHexActual.toUpperCase()}\n📏 Talla: ${window.tallaActual.toFixed(1)} MX`, 'check_circle', 'Éxito');
        }
    }
}

// Exponer funciones de manera limpia
window.intercambiarModelo = intercambiarModelo;
window.cambiarGeometriaTacto = cambiarGeometriaTacto;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;