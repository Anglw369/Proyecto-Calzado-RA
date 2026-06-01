// Elementos del DOM
const videoElement = document.getElementById('webcam');
const cameraContainer = document.getElementById('camera-container');

// Variables del Motor 3D (Three.js)
let scene, camera, renderer, currentMesh;

// Variables de Inteligencia Artificial (MediaPipe Pose)
let poseTracker;
let localVideoStream = null; // Guardará el canal de la cámara para poder apagarlo/encenderlo sin bugs

// 1. INICIALIZAR EL ESCENARIO 3D TRANSPARENTE
function init3DSpace() {
    // Limpieza preventiva de lienzos fantasma
    const canvasViejo = cameraContainer.querySelector('canvas');
    if (canvasViejo) canvasViejo.remove();

    scene = new THREE.Scene();

    // Luces para dar volumen a las mallas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 4, 4);
    scene.add(dirLight);

    // Calculamos las proporciones en tiempo real ahora que el contenedor ya mide el 100% de la pantalla
    const anchoReal = cameraContainer.clientWidth || window.innerWidth;
    const altoReal = cameraContainer.clientHeight || window.innerHeight;

    // Cámara de perspectiva balanceada
    camera = new THREE.PerspectiveCamera(45, anchoReal / altoReal, 0.1, 1000);
    camera.position.z = 5;

    // Renderizador con transparencia encima del feed de video
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(anchoReal, altoReal);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '5'; 
    cameraContainer.appendChild(renderer.domElement);

    // Ciclo de animación continuo
    function animate() {
        requestAnimationFrame(animate);
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
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
    currentMesh.position.set(0, -0.2, 1.5); // Posicionado más cerca del suelo visual
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
    // Si la cámara ya estaba encendida, apagamos el canal viejo para liberar el hardware
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
    }

    const opcionesCamara = {
        video: {
            facingMode: { ideal: "environment" }, // Busca la cámara trasera del celular
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(opcionesCamara);
        localVideoStream = stream;
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", true); // Vital para que corra en iOS/Safari
        await videoElement.play();
        console.log("Cámara trasera activada con éxito.");
        
        inicializarMediaPipePose();
    } catch (err) {
        console.warn("Fallo al abrir cámara trasera ideal, intentando genérica...", err);
        try {
            const streamGen = await navigator.mediaDevices.getUserMedia({ video: true });
            localVideoStream = streamGen;
            videoElement.srcObject = streamGen;
            await videoElement.play();
            inicializarMediaPipePose();
        } catch (cameraErr) {
            alert("Error de hardware: Por favor otorga permisos de cámara a la página.");
            console.error("Error crítico de hardware de cámara:", cameraErr);
        }
    }
}

// ==========================================================================
// 6. MOTOR DE INTELIGENCIA ARTIFICIAL OPTIMIZADO (MEDIAPIPE POSE)
// ==========================================================================
function inicializarMediaPipePose() {
    poseTracker = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseTracker.setOptions({
        modelComplexity: 0, // Máxima velocidad en celulares
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    poseTracker.onResults((results) => {
        if (!results.poseLandmarks || !currentMesh) return;

        const tobilloDerecho = results.poseLandmarks[28];
        const puntaPie = results.poseLandmarks[32];
        const talon = results.poseLandmarks[30];

        if (tobilloDerecho && tobilloDerecho.visibility > 0.6) {
            // Fórmulas de mapeo calibradas para la vista completa
            const targetX = (tobilloDerecho.x - 0.5) * 3.4; 
            const targetY = (tobilloDerecho.y - 0.5) * -2.5 - 0.4; 

            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.35;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.35;
            currentMesh.position.z = 1.3 + (tobilloDerecho.z * -1.6);

            // Medición automática si no se ha usado el slider manual
            const viewTalla = document.getElementById("view-talla");
            if (puntaPie && talon && viewTalla && (viewTalla.innerText.includes("Por medir...") || viewTalla.innerText.includes("(Auto)"))) {
                const dx = puntaPie.x - talon.x;
                const dy = puntaPie.y - talon.y;
                const distanciaRelativa = Math.sqrt(dx * dx + dy * dy);

                let tallaCalculada = 22.0 + (distanciaRelativa * 22);
                if (tallaCalculada < 22.0) tallaCalculada = 24.5;
                if (tallaCalculada > 30.0) tallaCalculada = 28.0;

                tallaCalculada = Math.round(tallaCalculada * 2) / 2;

                if (typeof window.tallaActual !== "undefined") {
                    window.tallaActual = tallaCalculada;
                    const slider = document.getElementById("size-slider");
                    if (slider) slider.value = tallaCalculada;
                }

                viewTalla.innerText = tallaCalculada.toFixed(1) + " MX (Auto)";
                actualizarEscalaPorTalla(tallaCalculada);
            }
        }
    });

    // Bucle continuo de lectura de cuadros
    async function procesarCuadroVideo() {
        if (videoElement && !videoElement.paused && !videoElement.ended) {
            await poseTracker.send({ image: videoElement });
        }
        if (videoElement && videoElement.requestVideoFrameCallback) {
            videoElement.requestVideoFrameCallback(procesarCuadroVideo);
        } else {
            setTimeout(procesarCuadroVideo, 40);
        }
    }
    procesarCuadroVideo();
}

// 7. ARRANQUE AUTOMÁTICO CONTROLADO DESDE EL CATÁLOGO DE APP.HTML
function iniciarMotoresManuales() {
    init3DSpace();
    iniciarCamaraNativa();
}

window.iniciarMotoresManuales = iniciarMotoresManuales;
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;