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

    // Luces para dar volumen a las figuras geométricas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 4, 4);
    scene.add(dirLight);

    const anchoReal = cameraContainer.clientWidth || window.innerWidth;
    const altoReal = cameraContainer.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, anchoReal / altoReal, 0.1, 1000);
    camera.position.z = 5;

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
    
    // Posición inicial por defecto vertical y de frente
    currentMesh.position.set(0, -0.2, 1.5); 
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
// 6. MOTOR DE INTELIGENCIA ARTIFICIAL OPTIMIZADO (ANCLAJE AL TOBILLO)
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
            
            // 1. ANCLAJE MATRICIAL AL TOBILLO (Eje X natural y Eje Y corregido hacia el suelo)
            const targetX = (tobilloDerecho.x - 0.5) * 3.4; 
            const targetY = (tobilloDerecho.y - 0.5) * -2.5 - 0.35; // Centrado sobre el calzado

            // Filtro LERP (Factor 0.35) para que se pegue firme y rápido al caminar sin vibrar
            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.35;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.35;
            
            // Profundidad adaptativa según la distancia calculada por la IA
            currentMesh.position.z = 1.3 + (tobilloDerecho.z * -1.6);

            // 2. CANDADO DE ESCALA RESTRUCTURADO (CERO CAMBIOS SI NO ESTÁ ESCANEANDO)
            if (iaMidiendoActivamente && puntaPie && talon) {
                
                // Medimos la distancia hipotenusa entre talón y punta en el plano de la imagen
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
                window.tallaActual = tallaCalculada;
                const slider = document.getElementById("size-slider");
                if (slider) slider.value = tallaCalculada;

                // Refrescamos el cartel superior en tiempo real
                const viewTalla = document.getElementById("view-talla");
                if (viewTalla) {
                    viewTalla.innerText = tallaCalculada.toFixed(1) + " MX (Auto)";
                }

                // Escalamos físicamente la figura únicamente en este instante de captura activa
                actualizarScaleConGarantia(tallaCalculada);
            }
        }
    });

    // PROCESAMIENTO DIRECTO DEL STREAM
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