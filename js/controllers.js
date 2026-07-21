// Variables de estado globales sincronizadas con el entorno global de la ventana
window.modeloActual = window.modeloActual || "za1";
window.colorHexActual = window.colorHexActual || "#0A58CA";
window.tallaActual = window.tallaActual || 26.0; 

function ajustarTallaManual(nuevaTalla) {
    window.tallaActual = parseFloat(nuevaTalla);
    
    const viewTalla = document.getElementById("view-talla");
    if (viewTalla) {
        viewTalla.innerText = window.tallaActual.toFixed(1) + " MX";
    }

    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(window.tallaActual);
    }
}

function simularMedicionIA() {
    const viewTalla = document.getElementById("view-talla");
    if (viewTalla) {
        viewTalla.innerText = "Escaneando pie...";
    }

    setTimeout(() => {
        const viewTallaFinal = document.getElementById("view-talla");
        if (viewTallaFinal) {
            viewTallaFinal.innerText = window.tallaActual.toFixed(1) + " MX";
        }

        // Acceder a los datos de Alpine.js de forma segura para disparar el modal personalizado
        const appBody = document.body;
        if (appBody && appBody.__x_data) {
            appBody.__x_data.alertTitle = "Calibración";
            appBody.__x_data.alertIcon = "straighten";
            appBody.__x_data.alertText = `📐 [MÉTRICA IA COMPLETADA]\n\nCalibración exitosa.\nTalla fijada: ${window.tallaActual.toFixed(1)} MX.\n\nEl tamaño se ha congelado correctamente.`;
            appBody.__x_data.alertOpen = true;
        }
    }, 1200); 
}

function guardarConfiguracionActual() {
    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(window.modeloActual, window.colorHexActual, window.tallaActual);
        
        const appBody = document.body;
        if (appBody && appBody.__x_data) {
            appBody.__x_data.alertTitle = "Éxito";
            appBody.__x_data.alertIcon = "check_circle";
            appBody.__x_data.alertText = `¡Guardado con éxito!\n\n📦 Silueta: ${window.modeloActual.toUpperCase()}\n📏 Talla: ${window.tallaActual.toFixed(1)} MX\n\nDatos sincronizados en la nube de Supabase de León.`;
            appBody.__x_data.alertOpen = true;
        }
    }
}

// Exponer funciones globales de control de manera limpia
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;