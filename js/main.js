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
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(0, 4, 2); 

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
        geometry = new THREE.BoxGeometry(0.65, 0.4, 1.7); 
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(colorHex),
        roughness: 0.4,
        metalness: 0.2
    });

    currentMesh = new THREE.Mesh(geometry, material);
    
    // Acotamos el calzado plano en el suelo
    currentMesh.rotation.set(-Math.PI / 2, 0, 0); 
    currentMesh.position.set(0, -0.8, 0); 

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
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
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
    } catch (err) {
        try {
            const streamGen = await navigator.mediaDevices.getUserMedia({ video: true });
            localVideoStream = streamGen;
            videoElement.srcObject = streamGen;
            await videoElement.play();
            inicializarMediaPipePose();
        } catch (cameraErr) {
            alert("Error de hardware: Por favor otorga permisos de cámara.");
        }
    }
}

// ==========================================================================
// 6. MOTOR DE REALIDAD AUMENTADA OPTIMIZADO (FILTRO DE PROXIMIDAD ANTI-RUIDO)
// ==========================================================================
function inicializarMediaPipePose() {
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

        // PUNTOS CLAVE: 28 = Tobillo Derecho, 32 = Punta del Pie Derecho, 30 = Talón Derecho
        const tobilloDerecho = results.poseLandmarks[28];
        const puntaPie = results.poseLandmarks[32];
        const talon = results.poseLandmarks[30];

        if (puntaPie && puntaPie.visibility > 0.4) {
            
            // FILTRO RADICAL ANTI-INTERFERENCIAS:
            // MediaPipe calcula la profundidad en el eje Z. Los objetos muy lejanos (como personas al fondo)
            // tienen un valor Z significativamente mayor o desfasado. Si detecta que el pie está a más de 
            // cierta distancia de la cámara en el espacio simulado, lo ignora para evitar saltos locos.
            if (puntaPie.z > 0.2) {
                console.log("Interferencia detectada al fondo del salón. Ignorando coordenadas.");
                return; 
            }

            // FÓRMULA DE POSICIÓN RECALIBRADA PARA EVITAR MOVIMIENTOS BRUSCOS
            const targetX = (puntaPie.x - 0.5) * -2.2; 
            const targetY = (puntaPie.y - 0.5) * -2.0 - 0.3; 

            // Filtro LERP más suave (0.25) para amortiguar por completo el temblor de la mano
            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.25;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.25;
            currentMesh.position.z = 1.5 + (puntaPie.z * -1.0);

            // Rotación Z estable amarrada al talón local
            if (talon) {
                const anguloGiro = Math.atan2(puntaPie.y - talon.y, puntaPie.x - talon.x);
                currentMesh.rotation.z = -anguloGiro + (Math.PI / 2);
            }

            // ESCANEO DE TALLA AUTOMÁTICA ACTIVO SÓLO DURANTE LA CALIBRACIÓN
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
                    viewTalla.innerText = tallaCalculada.toFixed(1) + " MX (Auto)";
                }

                actualizarScaleConGarantia(tallaCalculada);
            }
        }
    });

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

function actualizarScaleConGarantia(t) {
    if (typeof window.actualizarEscalaPorTalla === 'function') {
        window.actualizarEscalaPorTalla(t);
    }
}

function iniciarMotoresManuales() {
    init3DSpace();
    iniciarCamaraNativa();
}

window.setIaMidiendoActivamente = (valor) => { iaMidiendoActivamente = valor; };
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;