// Elementos del DOM
const videoElement = document.getElementById('webcam');
const cameraContainer = document.getElementById('camera-container');

// Variables del Motor 3D (Three.js)
let scene, camera, renderer, currentMesh;

// Variables de Inteligencia Artificial (MediaPipe Pose)
let poseTracker;
let localVideoStream = null; 

// Candados de control de calibración
let iaMidiendoActivamente = false; 

// 1. INICIALIZAR EL ESCENARIO 3D TRANSPARENTE
function init3DSpace() {
    const canvasViejo = cameraContainer.querySelector('canvas');
    if (canvasViejo) canvasViejo.remove();

    scene = new THREE.Scene();

    // Luces equilibradas para el plano del suelo
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(0, 5, 3); 
    scene.add(dirLight);

    const anchoReal = cameraContainer.clientWidth || window.innerWidth;
    const altoReal = cameraContainer.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, anchoReal / altoReal, 0.1, 1000);
    camera.position.set(0, 0, 4); 

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(anchoReal, altoReal);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '5'; 
    cameraContainer.appendChild(renderer.domElement);

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
        geometry = new THREE.CylinderGeometry(0.32, 0.38, 1.4, 32);
    } else {
        geometry = new THREE.BoxGeometry(0.68, 0.42, 1.75); 
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(colorHex),
        roughness: 0.4,
        metalness: 0.15
    });

    currentMesh = new THREE.Mesh(geometry, material);
    currentMesh.rotation.set(-Math.PI / 2, 0, 0); 
    currentMesh.visible = false; 

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

// 5. APAGADO SEGURO DE LA CÁMARA (LIBERACIÓN DE HARDWARE)
function apagarCamaraLimpia() {
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => {
            track.stop();
        });
        localVideoStream = null;
    }
    if (videoElement) {
        videoElement.srcObject = null;
    }
    console.log("Canal de cámara liberado de forma absoluta.");
}

// 6. ENCENDIDO SEGURO DE LA CÁMARA CON MANEJADOR DE REINTENTOS PARA REFRESH (F5)
async function iniciarCamaraNativa(intento = 1) {
    apagarCamaraLimpia();

    // Pequeño delay inicial en el primer intento tras recargar para dar tiempo al OS de respirar
    if (intento === 1) {
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        localVideoStream = stream;
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", true);
        await videoElement.play();
        inicializarMediaPipePose();
        console.log("Cámara trasera encendida con éxito en el intento: " + intento);
    } catch (err) {
        console.warn(`Intento ${intento} fallido para abrir cámara (Recurso posiblemente retenido).`);
        
        // ESTRATEGIA MAESTRA: Si falla por culpa del refresh rápido, reintentamos un par de veces con más delay
        if (intento < 3) {
            console.log(`Reintentando inicializar hardware en 600ms... (Intento ${intento + 1}/3)`);
            setTimeout(() => {
                iniciarCamaraNativa(intento + 1);
            }, 600);
        } else {
            // Caída de respaldo por si de verdad fallaron los permisos globales
            try {
                console.log("Intentando caída de respaldo con cámara genérica...");
                const streamGen = await navigator.mediaDevices.getUserMedia({ video: true });
                localVideoStream = streamGen;
                videoElement.srcObject = streamGen;
                await videoElement.play();
                inicializarMediaPipePose();
            } catch (cameraErr) {
                console.error("Hardware completamente bloqueado por el sistema operativo:", cameraErr);
            }
        }
    }
}

// 7. MOTOR DE REALIDAD AUMENTADA EN PRIMERA PERSONA
function inicializarMediaPipePose() {
    if (poseTracker) {
        try { poseTracker.close(); } catch(e){}
    }

    poseTracker = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseTracker.setOptions({
        modelComplexity: 0, 
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    poseTracker.onResults((results) => {
        if (!results.poseLandmarks || !currentMesh) return;

        const tobilloDerecho = results.poseLandmarks[28];
        const puntaPie = results.poseLandmarks[32];
        const talon = results.poseLandmarks[30];

        if (puntaPie && puntaPie.visibility > 0.55 && (!tobilloDerecho || tobilloDerecho.z < 0.15)) {
            currentMesh.visible = true;

            const centroX = talon ? (puntaPie.x + talon.x) / 2 : puntaPie.x;
            const centroY = talon ? (puntaPie.y + talon.y) / 2 : puntaPie.y;

            const targetX = (centroX - 0.5) * -3.2; 
            const targetY = (centroY - 0.5) * -2.4 - 0.4; 

            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.20;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.20;
            currentMesh.position.z = 1.4 + (puntaPie.z * -1.0);

            if (talon) {
                const anguloGiro = Math.atan2(puntaPie.y - talon.y, puntaPie.x - talon.x);
                currentMesh.rotation.z = -anguloGiro + (Math.PI / 2);
            }

            if (iaMidiendoActivamente && talon) {
                const dx = puntaPie.x - talon.x;
                const dy = puntaPie.y - talon.y;
                const distanciaRelativa = Math.sqrt(dx * dx + dy * dy);

                let tallaCalculada = 22.0 + (distanciaRelativa * 23);
                if (tallaCalculada < 22.0) tallaCalculada = 24.5;
                if (tallaCalculada > 30.0) tallaCalculada = 28.0;

                tallaCalculada = Math.round(tallaCalculada * 2) / 2;

                window.tallaActual = tallaCalculada;
                const slider = document.getElementById("size-slider");
                if (slider) slider.value = tallaCalculada;

                const viewTalla = document.getElementById("view-talla");
                if (viewTalla) {
                    viewTalla.innerText = tallaCalculada.toFixed(1) + " MX";
                }

                actualizarScaleConGarantia(tallaCalculada);
            }
        } else {
            currentMesh.visible = false;
        }
    });

    async function procesarCuadroVideo() {
        if (!localVideoStream || !videoElement || videoElement.paused || videoElement.ended) return;
        
        try {
            await poseTracker.send({ image: videoElement });
        } catch(e) {}

        if (videoElement && videoElement.requestVideoFrameCallback) {
            videoElement.requestVideoFrameCallback(procesarCuadroVideo);
        } else {
            setTimeout(procesarCuadroVideo, 40);
        }
    }
    procesarCuadroVideo();
}

function actualizarScaleConGarantia(t) {
    if (typeof window.actualizarEscalaPorTalla === 'function') {
        window.actualizarEscalaPorTalla(t);
    }
}

function iniciarMotoresManuales() {
    init3DSpace();
    iniciarCamaraNativa();
}

// 8. ESCUCHADORES DE CICLO DE VIDA AVANZADO
window.addEventListener('beforeunload', () => {
    apagarCamaraLimpia();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const savedSubpage = localStorage.getItem('stepra_subpage');
        if (savedSubpage === 'ar_view') {
            iniciarCamaraNativa();
        }
    } else {
        apagarCamaraLimpia();
    }
});

window.setIaMidiendoActivamente = (valor) => { iaMidiendoActivamente = valor; };
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;