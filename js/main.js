// Elementos del DOM
const videoElement = document.getElementById('webcam');
const cameraContainer = document.getElementById('camera-container');

// Variables del Motor 3D (Three.js)
let scene, camera, renderer, currentMesh;

// Variables de Inteligencia Artificial (MediaPipe Pose)
let poseTracker;

// 1. INICIALIZAR EL ESCENARIO 3D TRANSPARENTE
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

    // Ciclo de animación continuo
    function animate() {
        requestAnimationFrame(animate);
        
        // Animación de rotación solo si no se ha detectado tracking de IA activo
        if (currentMesh && document.getElementById("simulation-overlay").classList.contains("hidden")) {
            currentMesh.rotation.y += 0.01;
            currentMesh.rotation.x += 0.005;
        }
        
        renderer.render(scene, camera);
    }
    animate();
}

// 2. FUNCIÓN PARA GENERAR EL CUBO O CILINDRO DINÁMICAMENTE
function generarGeometriaSimulada(tipo, colorHex) {
    if (currentMesh) scene.remove(currentMesh);

    let geometry;
    if (tipo === "cilindro") {
        geometry = new THREE.CylinderGeometry(0.35, 0.45, 1.6, 32);
    } else {
        geometry = new THREE.BoxGeometry(0.8, 0.45, 2.0); 
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(colorHex),
        roughness: 0.4,
        metalness: 0.2
    });

    currentMesh = new THREE.Mesh(geometry, material);
    
    // Posición inicial por defecto
    currentMesh.position.set(0, 0.8, 0.8); 
    currentMesh.rotation.set(0.2, 0.4, 0); 

    scene.add(currentMesh);
}

// 3. ACTUALIZAR COLOR DE LA GEOMETRÍA
function actualizarColorGeometria(colorHex) {
    if (currentMesh && currentMesh.material) {
        currentMesh.material.color.set(colorHex);
    }
}

// 4. ACTUALIZAR LA ESCALA ANATÓMICA
function actualizarEscalaPorTalla(talla) {
    if (!currentMesh) return;
    const escalaLargo = 1 + (talla - 26.0) * 0.15; 
    const escalaAnchoAlt = 1 + (talla - 26.0) * 0.07; 
    currentMesh.scale.set(escalaAnchoAlt, escalaAnchoAlt, escalaLargo);
}

// 5. ENCENDIDO SEGURO DE LA CÁMARA E INICIALIZACIÓN DE MEDIAPIPE
async function iniciarCamaraNativa() {
    try {
        // Configuramos el stream de video de la cámara trasera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" }, width: 640, height: 480 }
        });
        videoElement.srcObject = stream;
        console.log("Cámara trasera encendida.");
    } catch (err) {
        console.warn("No se detectó cámara trasera, usando genérica/PC...");
        try {
            const streamGen = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            videoElement.srcObject = streamGen;
        } catch (cameraErr) {
            console.error("Error crítico de hardware de cámara:", cameraErr);
        }
    }

    // Inicializar MediaPipe Pose una vez que la cámara esté lista
    inicializarMediaPipePose();
}

// ==========================================================================
// 6. MOTOR DE INTELIGENCIA ARTIFICIAL (MEDIAPIPE INTERACTION)
// ==========================================================================
function inicializarMediaPipePose() {
    poseTracker = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    // Ajustes para máxima velocidad y rendimiento óptimo en celulares
    poseTracker.setOptions({
        modelComplexity: 0,       // 0 = Ultra rápido/baja carga (Ideal para web móvil)
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // Escuchador que procesa los resultados de la IA cuadro por cuadro
    poseTracker.onResults((results) => {
        if (!results.poseLandmarks || !currentMesh) return;

        // Puntos de MediaPipe: 27 = Tobillo Izquierdo, 28 = Tobillo Derecho
        // Usaremos el tobillo derecho (punto 28) como ancla principal
        const tobilloDerecho = results.poseLandmarks[28];

        // Validamos la visibilidad del punto (que el pie esté a cuadro)
        if (tobilloDerecho && tobilloDerecho.visibility > 0.5) {
            
            // CONVERSIÓN DE COORDENADAS: MediaPipe da valores de 0 a 1, los pasamos al espacio 3D de Three.js
            // Multiplicamos por factores de escala para mapear la pantalla de forma natural
            const targetX = (tobilloDerecho.x - 0.5) * -3.5; 
            const targetY = (tobilloDerecho.y - 0.5) * -2.8; 

            // SUAVIZADO DE MOVIMIENTO (Interpolación Lineal - LERP)
            // Hace que el objeto no tiemble de forma brusca y siga al pie suavemente
            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.2;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.2;
            
            // Ajustamos la rotación levemente con la profundidad Z que calcula la IA
            currentMesh.position.z = 1.0 + (tobilloDerecho.z * -2.0);
        }
    });

    // Loop asíncrono que envía el feed del video a la IA constantemente
    const cameraUtils = new window.Camera(videoElement, {
        onFrame: async () => {
            await poseTracker.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    cameraUtils.start();
    console.log("Cerebro de Visión Artificial MediaPipe activado.");
}

// Encender los motores ordenadamente al cargar el DOM
window.addEventListener('DOMContentLoaded', async () => {
    init3DSpace();
    await iniciarCamaraNativa();
});

// Exponer funciones globales
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;