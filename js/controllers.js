// Arreglos de simulación con formas geométricas recomendadas por los profes
const modelosSimulados = ["Cubo 3D (Tenis)", "Cilindro 3D (Bota)"];
const coloresSimulados = [
    { name: "Azul Sport", hex: "#0A58CA" },
    { name: "Amarillo Neón", hex: "#FFD166" },
    { name: "Rojo Fuego", hex: "#FF3333" },
    { name: "Negro Mate", hex: "#111111" }
];

let modeloActual = modelosSimulados[0];
let colorNombreActual = coloresSimulados[0].name;
let colorHexActual = coloresSimulados[0].hex;
let tallaActual = 0; 

let indexModelo = 0;
let indexColor = 0;

// 1. CONTROLADOR DE CAMBIO DE MODELO / FORMA
function intercambiarModelo() {
    indexModelo = (indexModelo + 1) % modelosSimulados.length;
    modeloActual = modelosSimulados[indexModelo];

    document.getElementById("view-modelo").innerText = modeloActual;

    // Le ordenamos a Three.js re-renderizar la forma geométrica manteniendo el color actual
    if (typeof window.generarGeometriaSimulada === "function") {
        const tipoForma = (indexModelo === 1) ? "cilindro" : "cubo";
        window.generarGeometriaSimulada(tipoForma, colorHexActual);
        
        // Mantener la escala actual si ya se midió el pie
        if(tallaActual > 0) window.actualizarEscalaPorTalla(tallaActual);
    }
}

// 2. CONTROLADOR DE CAMBIO DE COLOR
function intercambiarColor() {
    indexColor = (indexColor + 1) % coloresSimulados.length;
    colorNombreActual = coloresSimulados[indexColor].name;
    colorHexActual = coloresSimulados[indexColor].hex;

    document.getElementById("view-color-name").innerText = colorNombreActual;
    document.getElementById("color-preview").style.backgroundColor = colorHexActual;

    // Le ordenamos a Three.js pintar la forma actual sin borrarla
    if (typeof window.actualizarColorGeometria === "function") {
        window.actualizarColorGeometria(colorHexActual);
    }
}

// 3. CONTROLADOR DEL BOTÓN FLOTANTE "MEDIR" (IA ESCALADO REACCIONABLE)
function simularMedicionIA() {
    // Simulamos variaciones de tallas reales de calzado para demostrar el escalado dinámico
    const tallasPrueba = [24.5, 25.5, 26.0, 27.0, 28.5];
    const randomIdx = Math.floor(Math.random() * tallasPrueba.length);
    tallaActual = tallasPrueba[randomIdx];

    // 1. Refrescamos la interfaz Beige superior
    document.getElementById("view-talla").innerText = tallaActual + " MX";
    
    // 2. Modificamos la escala 3D en tiempo real en Three.js
    if (typeof window.actualizarEscalaPorTalla === "function") {
        window.actualizarEscalaPorTalla(tallaActual);
    }

    alert(`📐 [MÉTRICA IA]: Pie calibrado.\nTalla detectada: ${tallaActual} MX.\nLa forma 3D se ha ajustado proporcionalmente.`);
}

// 4. GUARDAR PREFERENCIAS
function guardarConfiguracionActual() {
    if (tallaActual === 0) tallaActual = 26.0;

    if (typeof window.guardarConfiguracionCalzado === "function") {
        window.guardarConfiguracionCalzado(modeloActual, colorNombreActual, tallaActual);
        alert(`¡Guardado en Supabase!\nForma: ${modeloActual}\nColor: ${colorNombreActual}\nTalla: ${tallaActual} MX`);
    }
}