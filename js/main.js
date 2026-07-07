// ==========================================================================
// MOTOR DE RENDERIZADO STEPRA - CONTROL DE ESCALA MÉTRICA Y SEGUIMIENTO AI
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

    // Iluminación ambiental intensa para resaltar las texturas del calzado fbx
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDireccional.position.set(0, 4, 4);
    scene.add(luzDireccional);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

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

    // Arrancamos el estimador esquelético en paralelo
    inicializarRastreadorAI();
}

function inicializarRastreadorAI() {
    poseTracker = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseTracker.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45
    });

    poseTracker.onResults((results) => {
        if (!objetoCalzadoActual || !results.poseLandmarks) return;

        // Rastreamos la muñeca o el tobillo para darte soporte inmediato en la prueba
        const puntoDeteccion = results.poseLandmarks[28] || results.poseLandmarks[16]; 
        const talon = results.poseLandmarks[30];

        if (puntoDeteccion && puntoDeteccion.visibility > 0.45) {
            objetoCalzadoActual.visible = true;

            // Interpolación de coordenadas en el lienzo web
            const targetX = (puntoDeteccion.x - 0.5) * -3.2;
            const targetY = (puntoDeteccion.y - 0.5) * -2.4 - 0.3;

            objetoCalzadoActual.position.x += (targetX - objetoCalzadoActual.position.x) * 0.30;
            objetoCalzadoActual.position.y += (targetY - objetoCalzadoActual.position.y) * 0.30;
            objetoCalzadoActual.position.z = 1.2;

            // Si hay rotación de articulación inclinamos el fbx de forma armónica
            if (talon) {
                const angulo = Math.atan2(puntoDeteccion.y - talon.y, puntoDeteccion.x - talon.x);
                objetoCalzadoActual.rotation.y = -angulo;
            }
        } else {
            // El zapato se oculta de forma limpia si no hay ninguna extremidad en pantalla
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
// ENRUTADOR DINÁMICO DE FILTRADO CON LOGÍSTICA DE ESCALA REDUCIDA
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    // Formateamos el string exacto que tienes en tu carpeta de VS Code
    let nombreArchivoFinal = `${modeloBase}${temporada}${variante}.fbx`;
    
    // Validamos el espacio del nombre del archivo za2pri1 1.fbx y za2in1 1.fbx de tu disco
    if (modeloBase === "za2" && (temporada === "pri" || temporada === "in") && variante === "1") {
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

    console.log("Invocando archivo:", rutaCompleta);

    const cargador = new THREE.FBXLoader();
    cargador.load(
        rutaCompleta,
        function (fbx) {
            objetoCalzadoActual = fbx;
            objetoCalzadoActual.visible = false; 

            // CORRECCIÓN MAGNA DE ESCALA: Bajamos a 0.0003 para achicar el modelo gigante de metros a centímetros reales
            objetoCalzadoActual.scale.set(0.0003, 0.0003, 0.0003);
            objetoCalzadoActual.rotation.set(0, Math.PI, 0); 

            actualizarEscalaPorTalla(window.tallaActual);
            scene.add(objetoCalzadoActual);
            console.log("¡Archivo FBX Real redimensionado con éxito!");
        },
        null,
        function (err) {
            console.error("Fallo de mapeo de archivo:", err);
            // Fallback transitorio en caso de error de ruta
            const geometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
            const material = new THREE.MeshStandardMaterial({ color: 0x0a58ca, wireframe: true });
            objetoCalzadoActual = new THREE.Mesh(geometry, material);
            objetoCalzadoActual.visible = true;
            scene.add(objetoCalzadoActual);
        }
    );
}

function actualizarEscalaPorTalla(talla) {
    if (!objetoCalzadoActual) return;
    // Escalación sutil basada en la proporción mexicana
    const factor = (talla / 26.0) * 0.0003;
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