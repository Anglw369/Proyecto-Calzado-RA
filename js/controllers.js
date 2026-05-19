// Variables globales para rastrear qué tiene seleccionado el usuario
let modeloActual = "Deportivo_Alpha";
let colorActual = "#FFFFFF";
let tallaActual = "26.5"; // Este valor cambiará dinámicamente con tu API de medición

// Listas de prueba para los intercambios
const modelosDisponibles = ["Deportivo_Alpha", "Casual_Urban", "Running_Max"];
const coloresDisponibles = ["#FF5733", "#33FF57", "#3357FF", "#FFFFFF", "#000000"];

let indexModelo = 0;
let indexColor = 0;

// 1. FUNCIÓN PARA CAMBIAR DE MODELO (.GLB)
function intercambiarModelo() {
    const modelViewer = document.querySelector("#shoe-viewer");
    indexModelo = (indexModelo + 1) % modelosDisponibles.length;
    modeloActual = modelosDisponibles[indexModelo];

    // Cambia el archivo fuente del visor 3D
    // Asegúrate de tener los archivos guardados en tu carpeta 'models/' con estos nombres
    modelViewer.src = `models/${modeloActual}.glb`;
    console.log("Cambiado a modelo:", modeloActual);
}

// 2. FUNCIÓN PARA CAMBIAR COLOR 
function intercambiarColor() {
    indexColor = (indexColor + 1) % coloresDisponibles.length;
    colorActual = coloresDisponibles[indexColor];

    const modelViewer = document.querySelector("#shoe-viewer");
    if (modelViewer.model && modelViewer.model.materials.length > 0) {
        const [material] = modelViewer.model.materials;
        material.pbrMetallicRoughness.setBaseColorFactor(colorActual);
        console.log("Cambiado a color hexadecimal:", colorActual);
    } else {
        console.warn("El modelo 3D aún no ha cargado sus materiales.");
    }
}

// 3. FUNCIÓN CONECTADA AL BOTÓN "GUARDAR" (MANDA LOS DATOS A SUPABASE)
function guardarConfiguracionActual() {
    if (typeof window.guardarConfiguracionCalzado === "function") {
        // Ejecuta la función de auth.js que creamos en el paso anterior
        window.guardarConfiguracionCalzado(modeloActual, colorActual, tallaActual);
        alert(`¡Configuración Guardada!\nModelo: ${modeloActual}\nColor: ${colorActual}`);
    } else {
        console.error("La función de guardado en Supabase no está disponible.");
    }
}