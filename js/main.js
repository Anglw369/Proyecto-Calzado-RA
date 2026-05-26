// Elementos del DOM
const videoElement = document.getElementById('webcam');
const cameraContainer = document.getElementById('camera-container');

// Variables del Motor 3D (Three.js)
let scene, camera, renderer, currentMesh;

// 1. INICIALIZAR EL ESCENARIO 3D TRANSPARENTE (Three.js)
function init3DSpace() {
    scene = new THREE.Scene();

    // Luces para dar volumen a las figuras geométricas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 4, 4);
    scene.add(dirLight);

    // Cámara de perspectiva
    camera = new THREE.PerspectiveCamera(45, cameraContainer.clientWidth / cameraContainer.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderizador con transparencia encima de la cámara
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(cameraContainer.clientWidth, cameraContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '5'; 
    cameraContainer.appendChild(renderer.domElement);

    // Generar la primera forma geométrica por defecto (Cubo)
    generarGeometriaSimulada("cubo", "#0A58CA");

    // Ciclo de animación
    function animate() {
        requestAnimationFrame(animate);
        if (currentMesh) {
            // Si la IA no ha detectado el pie, la figura gira suavemente en espera
            if (document.getElementById("simulation-overlay").classList.contains("hidden")) {
                currentMesh.rotation.y += 0.01;
                currentMesh.rotation.x += 0.005;
            }
        }
        renderer.render(scene, camera);
    }
    animate();
}

// 2. FUNCIÓN PARA GENERAR EL CUBO O CILINDRO DINÁMICAMENTE
function generarGeometriaSimulada(tipo, colorHex) {
    // Si ya hay una figura en pantalla, la borramos para no duplicar
    if (currentMesh) scene.remove(currentMesh);

    let geometry;

    if (tipo === "cilindro") {
        // Cilindro: Radio superior, radio inferior, altura, segmentos
        geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 32);
    } else {
        // Cubo estándar (Simula la caja de un zapato)
        geometry = new THREE.BoxGeometry(1.2, 0.6, 2.0);
    }

    // Material liso responsivo que reacciona a la luz
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(colorHex),
        roughness: 0.4,
        metalness: 0.2
    });

    currentMesh = new THREE.Mesh(geometry, material);
    currentMesh.position.set(0, -0.6, 1); // Posicionado a la altura estimada del pie
    scene.add(currentMesh);
}

// 3. ACTUALIZAR COLOR DE LA FORMA ACTUAL
function actualizarColorGeometria(colorHex) {
    if (currentMesh && currentMesh.material) {
        currentMesh.material.color.set(colorHex);
    }
}

// 4. ACTUALIZAR LA ESCALA (TALLA DEL PIE) EN TRES DIMENSIONES (X, Y, Z)
function actualizarEscalaPorTalla(talla) {
    if (!currentMesh) return;

    // Regla matemática: Tomamos como base la talla 26.0 (escala 1.0)
    // Cada medio número aumenta o resta un 5% de volumen de forma proporcional
    const factorEscala = 1 + (talla - 26.0) * 0.1;
    
    // Aplicamos el escalado matemático en los ejes X, Y y Z
    currentMesh.scale.set(factorEscala, factorEscala, factorEscala);
    console.log(`[Three.js] Escala geométrica ajustada a: ${factorEscala.toFixed(2)}x para talla ${talla}`);
}

// 5. TRACKING AUTOMÁTICO DE IA (SIMULADO O POR CAPTURA)
function iniciarRastreadorIA() {
    // Para asegurar que corra en celulares de inmediato mientras depuras MediaPipe:
    setTimeout(() => {
        const overlay = document.getElementById("simulation-overlay");
        if (overlay.classList.contains("hidden")) {
            overlay.classList.remove("hidden");
            document.getElementById("btn-medir-flotante").classList.remove("hidden");
            
            // Forzamos una talla inicial medida por el algoritmo
            tallaActual = 26.0;
            document.getElementById("view-talla").innerText = "26.0 MX (Auto)";
            actualizarEscalaPorTalla(tallaActual);
        }
    }, 2500); 
}

// Encender motores al cargar
window.addEventListener('DOMContentLoaded', () => {
    init3DSpace();
    iniciarRastreadorIA();
});

// Exponer funciones globales
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;