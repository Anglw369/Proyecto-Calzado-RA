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

    // Luces optimizadas para vista desde arriba
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(0, 5, 2); // Luz desde arriba apuntando ligeramente al frente
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
        // Ajustamos proporciones para que actúe como una bota vista desde arriba
        geometry = new THREE.CylinderGeometry(0.38, 0.42, 1.5, 32);
    } else {
        // Dimensiones optimizadas para simular la caja de un tenis cubriendo el pie
        geometry = new THREE.BoxGeometry(0.75, 0.45, 1.9); 
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(colorHex),
        roughness: 0.4,
        metalness: 0.2
    });

    currentMesh = new THREE.Mesh(geometry, material);
    
    // POSICIÓN Y ROTACIÓN BASE EN PRIMERA PERSONA:
    // Acostamos la figura geométrica sobre el plano del suelo (eje X rotado -90 grados)
    // para que la perspectiva coincida con el usuario mirando hacia sus propios pies.
    currentMesh.rotation.set(-Math.PI / 2, 0, 0); 
    currentMesh.position.set(0, -1.0, 1.0); 

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
    // Ajustamos la escala respetando que ahora el largo corre en el plano acostado
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
// 6. MOTOR DE REALIDAD AUMENTADA EN PRIMERA PERSONA (VISTA HACIA ABAJO)
// ==========================================================================
function inicializarMediaPipePose() {
    poseTracker = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseTracker.setOptions({
        modelComplexity: 0, 
        smoothLandmarks: true,
        minDetectionConfidence: 0.45, // Un toque más sensible para detectar desde arriba
        minTrackingConfidence: 0.45
    });

    poseTracker.onResults((results) => {
        if (!results.poseLandmarks || !currentMesh) return;

        // PUNTOS ANATÓMICOS: 28 = Tobillo Derecho, 32 = Punta del Pie Derecho, 30 = Talón Derecho
        const tobilloDerecho = results.poseLandmarks[28];
        const puntaPie = results.poseLandmarks[32];
        const talon = results.poseLandmarks[30];

        // Validamos la visibilidad de la extremidad inferior
        if (puntaPie && talon && puntaPie.visibility > 0.4) {
            
            // ¡EL TRUCO DEL ANCLAJE EN PRIMERA PERSONA!:
            // En vez de amarrar el objeto al tobillo, calculamos el PUNTO MEDIO EXACTO
            // entre el talón y la punta del pie. Así el modelado cubre todo tu pie descalzo.
            const centroPieX = (puntaPie.x + talon.x) / 2;
            const centroPieY = (puntaPie.y + talon.y) / 2;

            // Mapeo de coordenadas calibrado para la perspectiva aérea hacia el piso
            const targetX = (centroPieX - 0.5) * 3.5; 
            const targetY = (centroPieY - 0.5) * -2.6 - 0.2; 

            // Filtro LERP dinámico para que el calzado envuelva firmemente tus dedos al moverte
            currentMesh.position.x += (targetX - currentMesh.position.x) * 0.4;
            currentMesh.position.y += (targetY - currentMesh.position.y) * 0.4;
            
            // Profundidad adaptativa según la inclinación del talón
            currentMesh.position.z = 1.4 + (talon.z * -1.5);

            // Alineamos la rotación Z del calzado para que gire en la misma dirección que apunte tu pie en el piso
            const anguloGiro = Math.atan2(puntaPie.y - talon.y, puntaPie.x - talon.x);
            currentMesh.rotation.z = -anguloGiro + (Math.PI / 2);

            // CÁLCULO DE ESCALA DURANTE EL SEGUNDO DE CAPTURA ACTIVA
            if (iaMidiendoActivamente) {
                const dx = puntaPie.x - talon.x;
                const dy = puntaPie.y - talon.y;
                const distanciaRelativa = Math.sqrt(dx * dx + dy * dy);

                // Algoritmo de mapeo métrico ajustado para la distancia del ojo al suelo
                let tallaCalculada = 21.5 + (distanciaRelativa * 25);
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