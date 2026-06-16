// Elementos del DOM
const videoElement = document.getElementById('webcam');
const cameraContainer = document.getElementById('camera-container');

// Variables del Motor 3D (Three.js)
let scene, camera, renderer, currentMesh;

// Variables de Inteligencia Artificial (MediaPipe Pose)
let poseTracker;
let localVideoStream = null; 

// Candados de control de calibración y rebote de hardware
let iaMidiendoActivamente = false; 
let yaIniciado = false; 

// 1. INICIALIZAR EL ESCENARIO 3D TRANSPARENTE
function init3DSpace() {
    const canvasViejo = cameraContainer.querySelector('canvas');
    if (canvasViejo) canvasViejo.remove();

    scene = new THREE.Scene();

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

// 5. APAGADO SEGURO DE LA CÁMARA
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
    yaIniciado = false;
    console.log("Canal de cámara liberado de forma absoluta.");
}

// 6. ENCENDIDO SEGURO DE LA CÁMARA TRASERA NATIVA
async function iniciarCamaraNativa() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        localVideoStream = stream;
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", true);
        await videoElement.play();
        inicializarMediaPipePose();
        console.log("Cámara trasera encendida con éxito.");
    } catch (err) {
        try {
            const streamGen = await navigator.mediaDevices.getUserMedia({ video: true });
            localVideoStream = streamGen;
            videoElement.srcObject = streamGen;
            await videoElement.play();
            inicializarMediaPipePose();
        } catch (cameraErr) {
            console.error("Hardware bloqueado por el sistema operativo:", cameraErr);
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

// CANDADO ANTI-REBOTES INTEGRADO: Evita el doble disparo simultáneo tras refrescar
function iniciarMotoresManuales() {
    if (yaIniciado) {
        console.log("Llamada duplicada bloqueada con éxito.");
        return;
    }
    yaIniciado = true;
    init3DSpace();
    iniciarCamaraNativa();
}

// 8. ESCUCHADORES DE CICLO DE VIDA
window.addEventListener('beforeunload', () => {
    apagarCamaraLimpia();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const savedSubpage = localStorage.getItem('stepra_subpage');
        if (savedSubpage === 'ar_view') {
            yaIniciado = false;
            iniciarMotoresManuales();
        }
    } else {
        apagarCamaraLimpia();
    }
}

);

window.setIaMidiendoActivamente = (valor) => { iaMidiendoActivamente = valor; };
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;

// ==========================================================================
// 9. MOTOR DE CAPTURA DE PANTALLA COMBINADA (FOTO DEL PROBADOR)
// ==========================================================================
function capturarFotoProbador() {
    if (!renderer || !videoElement) return alert("Error: Los motores no están listos.");

    // 1. Creamos un canvas fantasma temporal con el tamaño exacto del visor
    const anchoCaptura = videoElement.videoWidth || 640;
    const altoCaptura = videoElement.videoHeight || 480;

    const canvasDestino = document.createElement('canvas');
    canvasDestino.width = anchoCaptura;
    canvasDestura = altoCaptura;
    canvasDestino.height = altoCaptura;
    const ctx = canvasDestino.getContext('2d');

    // 2. Pintamos primero el cuadro actual de la cámara de video de fondo
    ctx.drawImage(videoElement, 0, 0, anchoCaptura, altoCaptura);

    // 3. Forzamos a Three.js a renderizar un cuadro inmediato
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
        // Dibujamos el canvas 3D encima de la foto de la cámara
        ctx.drawImage(renderer.domElement, 0, 0, anchoCaptura, altoCaptura);
    }

    // 4. Convertimos la mezcla a un archivo binario PNG descargable
    try {
        const linkDescarga = document.createElement('a');
        
        // Generamos un nombre dinámico único estilo StepRA con folio del momento
        const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
        linkDescarga.download = `StepRA-Capture-${timestamp}.png`;
        
        // Convertimos el Canvas a URL de imagen
        linkDescarga.href = canvasDestino.toDataURL('image/png');
        
        // Disparamos la descarga automática en el celular
        document.body.appendChild(linkDescarga);
        linkDescarga.click();
        document.body.removeChild(linkDescarga);
        
        console.log("¡Captura de Realidad Aumentada descargada con éxito!");
    } catch (error) {
        console.error("Error al procesar la imagen compuesta:", error);
        alert("Ocurrió un detalle al compilar la foto. Revisa tus permisos.");
    }
}

// Exponemos la función al entorno global para que app.html la pueda llamar desde el botón
window.capturarFotoProbador = capturarFotoProbador;