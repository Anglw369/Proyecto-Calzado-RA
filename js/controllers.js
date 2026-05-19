// Arreglos de simulación con nombres comerciales amigables
const modelosSimulados = ["Deportivo Nike Air", "Casual Vans Urban", "Running Adidas Max", "Bota Industrial Pro"];
const coloresSimulados = [
    { name: "Blanco", hex: "#FFFFFF" },
    { name: "Rojo Fuego", hex: "#FF3333" },
    { name: "Azul Sport", hex: "#3366FF" },
    { name: "Negro Mate", hex: "#111111" },
    { name: "Verde Neón", hex: "#33FF33" }
];

// Variables de estado del usuario actual
let modeloActual = modelosSimulados[0];
let colorNombreActual = coloresSimulados[0].name;
let colorHexActual = coloresSimulados[0].hex;
let tallaActual = 0; // Inicia en 0 hasta que simulemos el escaneo

let indexModelo = 0;
let indexColor = 0;

// 1. SIMULAR CAMBIO DE MODELO
function intercambiarModelo() {
    indexModelo = (indexModelo + 1) % modelosSimulados.length;
    modeloActual = modelosSimulados[indexModelo];

    // Actualiza la pantalla de forma inmediata
    document.getElementById("view-modelo").innerText = modeloActual;
    console.log("Modelo seleccionado en la simulación:", modeloActual);
}

// 2. SIMULAR CAMBIO DE COLOR
function intercambiarColor() {
    indexColor = (indexColor + 1) % coloresSimulados.length;
    colorNombreActual = coloresSimulados[indexColor].name;
    colorHexActual = coloresSimulados[indexColor].hex;

    // Actualiza el texto y el circulito de color en pantalla
    document.getElementById("view-color-name").innerText = colorNombreActual;
    document.getElementById("color-preview").style.backgroundColor = colorHexActual;
    console.log("Color seleccionado:", colorNombreActual, "Hex:", colorHexActual);
}

// 3. NUEVO: SIMULAR LA ACCIÓN DE LA API DE MEDICIÓN CON IA
function simularMedicionIA() {
    // Genera una talla aleatoria real entre 24.5 y 29 para simular que la cámara midió el pie
    const tallasPrueba = [25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0];
    const randomIdx = Math.floor(Math.random() * tallasPrueba.length);
    tallaActual = tallasPrueba[randomIdx];

    // Actualiza la pantalla
    document.getElementById("view-talla").innerText = tallaActual + " MX";
    alert(`¡Escáner Completo!\nLa IA detectó una talla de: ${tallaActual} MX`);
}

// 4. GUARDAR CONFIGURACIÓN ACTUAL EN SUPABASE
function guardarConfiguracionActual() {
    // Si el usuario no ha medido su pie, le asignamos una por defecto para que no vaya en 0
    if (tallaActual === 0) {
        tallaActual = 26.0;
        document.getElementById("view-talla").innerText = "26.0 MX (Manual)";
    }

    if (typeof window.guardarConfiguracionCalzado === "function") {
        // Le mandamos a Supabase el Modelo Comercial y el Color (Nombre + Hex)
        const valorColorAGuardar = `${colorNombreActual} (${colorHexActual})`;
        
        window.guardarConfiguracionCalzado(modeloActual, valorColorAGuardar, tallaActual);
        
        alert(`¡Guardado con éxito en la Nube!\n\nModelo: ${modeloActual}\nColor: ${colorNombreActual}\nTalla: ${tallaActual} MX\n\nRevisa tu panel de Supabase.`);
    } else {
        console.error("Error: La conexión con auth.js no está lista.");
    }
}