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
        
        // Animación de rotación inicial estética (sólo si el panel sigue oculto)
        const overlay = document.getElementById("simulation-overlay");
        if (currentMesh && overlay && overlay.classList.contains("hidden")) {
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

// 5. ENCENDIDO SEGURO DE LA CÁMARA TRASERA NATIVA
async function iniciarCamaraNativa() {
    try {
        // Configuramos estrictamente la cámara trasera del entorno
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        videoElement.srcObject = stream;
        console.log("Cámara trasera encendida nativamente.");
        
        // Esperamos a que el video cargue sus datos reales para arrancar la IA
        videoElement.onloadedmetadata = () => {
            inicializarMediaPipePose();
        };
    } catch (err) {
        console.warn("No se detectó cámara trasera, usando cámara por defecto...");
        try {
            const streamGen = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            videoElement.srcObject = streamGen;
            videoElement.onloadedmetadata = () => {
                inicializarMediaPipePose();
            };
        } catch (cameraErr) {
            console.error("Error crítico de hardware de cámara:", cameraErr);
        }
    }
}

// ==========================================================================
// 6. MOTOR DE INTELIGENCIA ARTIFICIAL CORREGIDO (SIN WINDOW.CAMERA COMPARTIDA)
// ==========================================================================
function inicializarMediaPipePose() {
    poseTracker = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    // Ajustes de máximo rendimiento móvil
    poseTracker.setOptions({
        modelComplexity: 0, 
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    // Escuchador que procesa los puntos del pie
    poseTracker.onResults((results) => {
        if (!results.poseLandmarks || !currentMesh) return;

        // Punto 28 = Tobillo Derecho
        const tobilloDerecho = results.poseLandmarks[28];

        if (tobilloDerecho && tobilloDerecho.visibility > 0.5) {
            // Conversión matemática calibrada para la cámara trasera sin efecto espejo
            // Al ser cámara trasera, el eje X no se invierte
            const targetX = (tobilloDerecho.x - 0.5) * 3.2; 
            const targetY = (tobilloDerecho.y - 0.5) * -2.4 - 0.4; // Ajustado al suelo

            // Filtro LERP para suavizar temblores de la mano
            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.25;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.25;
            currentMesh.position.z = 1.2 + (tobilloDerecho.z * -1.8);
        }
    });

    // ACTIVACIÓN DE LA INTERFAZ DESDE EL SEGUNDO UNO
    // No esperamos a que la IA detecte un cuerpo para mostrar los botones
    const overlay = document.getElementById("simulation-overlay");
    const btnCalibrar = document.getElementById("btn-medir-flotante");
    if (overlay) overlay.classList.remove("hidden");
    if (btnCalibrar) btnCalibrar.classList.remove("hidden");

    // PROCESAMIENTO DIRECTO DEL STREAM: Enviamos los cuadros del video nativo a la IA
    async function procesarCuadroVideo() {
        if (!videoElement.paused && !videoElement.ended) {
            await poseTracker.send({ image: videoElement });
        }
        // Usamos el refresco nativo del navegador para no consumir batería de más
        if (videoElement.requestVideoFrameCallback) {
            videoElement.requestVideoFrameCallback(procesarCuadroVideo);
        } else {
            setTimeout(procesarCuadroVideo, 33); // Alternativa para navegadores antiguos (30fps)
        }
    }
    
    // Arrancamos el bucle de la IA
    procesarCuadroVideo();
    console.log("IA MediaPipe enlazada directamente al flujo de la cámara trasera nativa.");
}

// Encender los motores ordenadamente al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    init3DSpace();
    iniciarCamaraNativa(); 
});

// Exponer funciones globales
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;