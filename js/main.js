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
// 6. MOTOR DE INTELIGENCIA ARTIFICIAL OPTIMIZADO (ANCLAJE Y MEDIDA REAL)
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

    // Escuchador que procesa los puntos del pie cuadro por cuadro
    poseTracker.onResults((results) => {
        if (!results.poseLandmarks || !currentMesh) return;

        // PUNTOS ANATÓMICOS: 28 = Tobillo Derecho, 32 = Punta del Pie Derecho, 30 = Talón Derecho
        const tobilloDerecho = results.poseLandmarks[28];
        const puntaPie = results.poseLandmarks[32];
        const talon = results.poseLandmarks[30];

        // Validamos la visibilidad del pie en la cámara trasera
        if (tobilloDerecho && tobilloDerecho.visibility > 0.65) {
            
            // 1. ANCLAJE MATRICIAL AL PIE (Eje X natural y Eje Y corregido hacia el suelo)
            const targetX = (tobilloDerecho.x - 0.5) * 3.4; 
            const targetY = (tobilloDerecho.y - 0.5) * -2.5 - 0.35; // Centrado sobre el calzado

            // Filtro LERP (Factor 0.3) para que se pegue firme y rápido al caminar sin vibrar
            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.3;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.3;
            
            // Profundidad adaptativa según la distancia calculada por la IA
            currentMesh.position.z = 1.3 + (tobilloDerecho.z * -1.6);

            // 2. CÁLCULO MÉTRICO DINÁMICO (AUTOMÁTICO POR IA)
            // Solo calcula si detecta los puntos extremos y el cartel superior indica que no se ha movido el slider manual
            const viewTalla = document.getElementById("view-talla");
            if (puntaPie && talon && viewTalla && (viewTalla.innerText.includes("Por medir...") || viewTalla.innerText.includes("(Auto)"))) {
                
                // Medimos la distancia hipotenusa entre talón y punta en el plano del plano de imagen
                const dx = puntaPie.x - talon.x;
                const dy = puntaPie.y - talon.y;
                const distanciaRelativa = Math.sqrt(dx * dx + dy * dy);

                // Algoritmo de mapeo a escala de calzado mexicano (MX)
                let tallaCalculada = 22.0 + (distanciaRelativa * 22);

                // Acotamos el rango para evitar saltos locos por sombras del piso
                if (tallaCalculada < 22.0) tallaCalculada = 24.5;
                if (tallaCalculada > 30.0) tallaCalculada = 28.0;

                // Redondeo exacto a tallas comerciales o medias tallas (.0 o .5)
                tallaCalculada = Math.round(tallaCalculada * 2) / 2;

                // Sincronizamos la variable interna de controllers.js para el slider
                if (typeof window.tallaActual !== "undefined") {
                    window.tallaActual = tallaCalculada;
                    const slider = document.getElementById("size-slider");
                    if (slider) slider.value = tallaCalculada;
                }

                // Refrescamos el cartel superior en tiempo real
                viewTalla.innerText = tallaCalculada.toFixed(1) + " MX (Auto)";

                // Escalamos el volumen tridimensional de la figura de forma proporcional
                actualizarEscalaPorTalla(tallaCalculada);
            }
        }
    });

    // ACTIVACIÓN DE LA INTERFAZ DESDE EL SEGUNDO UNO
    const overlay = document.getElementById("simulation-overlay");
    const btnCalibrar = document.getElementById("btn-medir-flotante");
    if (overlay) overlay.classList.remove("hidden");
    if (btnCalibrar) btnCalibrar.classList.remove("hidden");

    // PROCESAMIENTO DIRECTO DEL STREAM
    async function procesarCuadroVideo() {
        if (!videoElement.paused && !videoElement.ended) {
            await poseTracker.send({ image: videoElement });
        }
        if (videoElement.requestVideoFrameCallback) {
            videoElement.requestVideoFrameCallback(procesarCuadroVideo);
        } else {
            setTimeout(procesarCuadroVideo, 33);
        }
    }
    
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