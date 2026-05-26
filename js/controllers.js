// Variables de estado del usuario actual
let modeloActual = "Cubo 3D (Tenis)";
let colorNombreActual = "Personalizado";
let colorHexActual = "#0A58CA";
let tallaActual = 26.0; 

// 1. MANEJO MANUAL DE MODELOS (PREGUNTA QUÉ FORMA RENDERIZAR)
function intercambiarModelo() {
    // Abrimos un cuadro de opción simple para pruebas manuales
    const seleccion = prompt("Selecciona el modelo 3D para pruebas:\nEscribe 1 para: Cubo 3D (Tenis)\nEscribe 2 para: Cilindro 3D (Bota)");

    if (seleccion === "1") {
        modeloActual = "Cubo 3D (Tenis)";
        document.getElementById("view-modelo").innerText = modeloActual;
        if (typeof window.generarGeometriaSimulada === "function") {
            window.generarGeometriaSimulada("cubo", colorHexActual);
        }
    } else if (seleccion === "2") {
        modeloActual = "Cilindro 3D (Bota)";
        document.getElementById("view-modelo").innerText = modeloActual;
        if (typeof window.generarGeometriaSimulada === "function") {
            window.generarGeometriaSimulada("cilindro", colorHexActual);
        }
    } else if (seleccion !== null) {
        alert("Opción no válida. Escribe sólo 1 o 2.");
        return;
    }

    // Volvemos a aplicar la escala que tenga actualmente el slider para que no se pierda
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 2. MANEJO MANUAL DE COLOR (ABRE LA PALETA DE COLORES NATIVA)
function intercambiarColor() {
    // Forzamos el clic de forma interna en el input input color invisible del HTML
    document.getElementById('color-picker').click();
}

// Esta función se ejecuta automáticamente cuando eliges un color en la paleta
function seleccionarColorManual(hexSeleccionado) {
    colorHexActual = hexSeleccionado;
    colorNombreActual = "Personalizado (" + hexSeleccionado.toUpperCase() + ")";

    // Actualizamos los textos e indicadores beige en la pantalla
    document.getElementById("view-color-name").innerText = colorNombreActual;
    document.getElementById("color-preview").style.backgroundColor = colorHexActual;

    // Pintamos la figura en Three.js sin destruirla
    if (typeof window.actualizarColorGeometria === "function") {
        window.actualizarColorGeometria(colorHexActual);
    }
}

// 3. BARRA DE TAMAÑO MANUAL (SLIDER INTERACTIVO)
function ajustarTallaManual(nuevaTalla) {
    tallaActual = parseFloat(nuevaTalla);
    
    // Actualiza el texto en la interfaz superior beige
    document.getElementById("view-talla").innerText = tallaActual.toFixed(1) + " MX (Manual)";

    // Ordena al motor Three.js estirar el eje Z en tiempo real
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 4. SIMULAR LA ACCIÓN DE LA IA (Se mantiene por compatibilidad)
function simularMedicionIA() {
    alert(`Modo Manual Activo.\nUsa la barra inferior 'Talla Manual' para calibrar el volumen exacto en tus pruebas.`);
}

// 5. GUARDAR CONFIGURACIÓN ACTUAL EN SUPABASE
function guardarConfiguracionActual() {
    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorHexActual, tallaActual);
        alert(`¡Guardado en la Nube con éxito!\n\nModelo: ${modeloActual}\nColor Hex: ${colorHexActual}\nTalla: ${tallaActual} MX`);
    } else {
        console.error("Error: Conexión con Supabase no lista.");
    }
}

// Hacer las funciones de depuración accesibles globalmente
window.intercambiarModelo = intercambiarModelo;
window.intercambiarColor = intercambiarColor;
window.seleccionarColorManual = seleccionarColorManual;
window.ajustarTallaManual = ajustarTallaManual;
window.simularMedicionIA = simularMedicionIA;
window.guardarConfiguracionActual = guardarConfiguracionActual;