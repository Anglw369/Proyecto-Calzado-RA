// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (MAPPING DE ARCHIVOS REALES FBX)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoCalzadoActual = null; 
let poseTracker = null;

window.tallaActual = 26.0;

function iniciarMotoresManuales() {
    if (renderer) return;

    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    scene = new THREE.Scene();

    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.6);
    luzDireccional.position.set(0, 4, 4);
    scene.add(luzDireccional);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4.5);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '10';
    container.appendChild(renderer.domElement);

    function animarEcosistema() {
        requestAnimationFrame(animarEcosistema);
        renderer.render(scene, camera);
    }
    animarEcosistema();

    // Levantar Inteligencia Artificial de MediaPipe de forma paralela y limpia
    inicializarRastreadorAI();
}

function inicializarRastreadorAI() {
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
        if (!objetoCalzadoActual || !results.poseLandmarks) return;

        const tobilloDerecho = results.poseLandmarks[28];
        const puntaPie = results.poseLandmarks[32];
        const talon = results.poseLandmarks[30];

        // Cambiamos la visibilidad si detecta tu pie en el visor de la cámara
        if (puntaPie && puntaPie.visibility > 0.5) {
            objetoCalzadoActual.visible = true;

            const targetX = (puntaPie.x - 0.5) * -3.4;
            const targetY = (puntaPie.y - 0.5) * -2.6 - 0.5;

            objetoCalzadoActual.position.x += (targetX - objetoCalzadoActual.position.x) * 0.25;
            objetoCalzadoActual.position.y += (targetY - objetoCalzadoActual.position.y) * 0.25;
            objetoCalzadoActual.position.z = 1.0 + (puntaPie.z * -0.8);

            if (talon) {
                const angulo = Math.atan2(puntaPie.y - talon.y, puntaPie.x - talon.x);
                objetoCalzadoActual.rotation.z = -angulo + (Math.PI / 2);
            }
        } else {
            // Si ocultas tu pie, el modelo real se esconde en lugar de quedarse flotando fijo
            objetoCalzadoActual.visible = false;
        }
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            videoElement.srcObject = stream;
            
            async function bucleIA() {
                if (!videoElement.paused && !videoElement.ended) {
                    await poseTracker.send({ image: videoElement });
                }
                videoElement.requestVideoFrameCallback ? videoElement.requestVideoFrameCallback(bucleIA) : setTimeout(bucleIA, 40);
            }
            bucleIA();
        });
    }
}

// ==========================================================================
// TRADUCTOR INTELIGENTE DE NOMENCLATURA DE ARCHIVOS .FBX REALES
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    // CORRECCIÓN CLAVE: Mapeamos los nombres reales de tus archivos de disco
    let nombreArchivoFinal = `${modeloBase}${temporada}${variante}.fbx`;
    
    // Tu compañero guardó la variante 1 del Zapato 2 con espacio en blanco: "za2pri1 1.fbx"
    if (modeloBase === "za2" && variante === "1") {
        nombreArchivoFinal = `${modeloBase}${temporada}${variante} 1.fbx`;
    }

    const esGitHubPages = window.location.hostname.includes('github.io');
    const rutaRaiz = esGitHubPages ? `/${window.location.pathname.split('/')[1]}/` : '';
    const rutaCompleta = `${rutaRaiz}models/${nombreArchivoFinal}`;
    
    const banner = document.getElementById('view-archivo-fbx');
    if (banner) banner.innerText = nombreArchivoFinal;

    if (objetoCalzadoActual) {
        scene.remove(objetoCalzadoActual);
        objetoCalzadoActual = null;
    }

    console.log("Cargando ruta de disco unificada:", rutaCompleta);

    const cargador = new THREE.FBXLoader();
    cargador.load(
        rutaCompleta,
        function (fbx) {
            objetoCalzadoActual = fbx;
            objetoCalzadoActual.visible = false; // Se oculta inicialmente hasta mapear tu pie
            
            // Factor de escala uniforme para archivos FBX nativos de Blender
            objetoCalzadoActual.scale.set(0.012, 0.012, 0.012);
            objetoCalzadoActual.rotation.set(-Math.PI / 2, 0, 0); 

            actualizarEscalaPorTalla(window.tallaActual);
            scene.add(objetoCalzadoActual);
            console.log("¡Modelo real cargado de forma absoluta!");
        },
        null,
        function (err) {
            console.error("Archivo no encontrado en servidor, usando fallback wireframe:", err);
            // Cubo de previsualización estilizado transitorio
            const geometry = new THREE.BoxGeometry(0.7, 0.4, 1.6);
            const material = new THREE.MeshStandardMaterial({ color: 0x0a58ca, wireframe: true });
            objetoCalzadoActual = new THREE.Mesh(geometry, material);
            objetoCalzadoActual.visible = true;
            scene.add(objetoCalzadoActual);
        }
    );
}

function actualizarEscalaPorTalla(talla) {
    if (!objetoCalzadoActual) return;
    const factor = (talla / 26.0) * 0.012;
    objetoCalzadoActual.scale.set(factor, factor, factor);
}

function capturarFotoProbador() {
    if (!renderer || !videoElement) return;
    const canvasDestino = document.createElement('canvas');
    canvasDestino.width = videoElement.videoWidth || 640;
    canvasDestino.height = videoElement.videoHeight || 480;
    const ctx = canvasDestino.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvasDestino.width, canvasDestino.height);
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, canvasDestino.width, canvasDestino.height);
    }
    const link = document.createElement('a');
    link.download = `StepRA-Capture-${Date.now()}.png`;
    link.href = canvasDestino.toDataURL('image/png');
    link.click();
}

window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;