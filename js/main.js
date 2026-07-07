// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (COMPLETA CON CONTROL MULTI-VARIANTE)
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

    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.7);
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

        // Detección de extremidades (tobillo 28, o muñeca de prueba 16)
        const puntoDeteccion = results.poseLandmarks[28] || results.poseLandmarks[16]; 
        const talon = results.poseLandmarks[30];

        if (puntoDeteccion && puntoDeteccion.visibility > 0.45) {
            objetoCalzadoActual.visible = true;

            const targetX = (puntoDeteccion.x - 0.5) * -3.2;
            const targetY = (puntoDeteccion.y - 0.5) * -2.4 - 0.3;

            objetoCalzadoActual.position.x += (targetX - objetoCalzadoActual.position.x) * 0.30;
            objetoCalzadoActual.position.y += (targetY - objetoCalzadoActual.position.y) * 0.30;
            objetoCalzadoActual.position.z = 1.2;

            if (talon) {
                const angulo = Math.atan2(puntoDeteccion.y - talon.y, puntoDeteccion.x - talon.x);
                objetoCalzadoActual.rotation.y = -angulo;
            }
        } else {
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
// CARGADOR INTEGRAL MULTI-VARIANTE CON MAPEO DE STRINGS DE DISCO
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    let nombreArchivoFinal = `${modeloBase}${temporada}${variante}.fbx`;
    
    // Mapeo específico de nombres con espacio en blanco del Zapato 2
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

    console.log("Invocando archivo desde:", rutaCompleta);

    const cargador = new THREE.FBXLoader();
    cargador.load(
        rutaCompleta,
        function (fbx) {
            objetoCalzadoActual = fbx;
            objetoCalzadoActual.visible = false; 

            // ESCALA CORREGIDA: Reducción de metros a escala humana centimétrica
            objetoCalzadoActual.scale.set(0.0003, 0.0003, 0.0003);
            objetoCalzadoActual.rotation.set(0, Math.PI, 0); 

            actualizarEscalaPorTalla(window.tallaActual);
            scene.add(objetoCalzadoActual);
            console.log("¡Modelo real enlazado al pie correctamente!");
        },
        null,
        function (err) {
            console.error("Fallo de enrutamiento, activando wireframe:", err);
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
    const factor = (talla / 26.0) * 0.0003;
    objetoCalzadoActual.scale.set(factor, factor, factor);
}

function intercambiarEntreZ01yZ02() {
    window.modeloActual = window.modeloActual === 'za1' ? 'za2' : 'za1';
    
    // Sincronizamos los cambios de vuelta hacia los selectores de Alpine
    const appBody = document.body;
    if(appBody.__x_data) {
        appBody.__x_data.currentZapato = window.modeloActual;
        const temp = appBody.__x_data.currentTemporada;
        const varNum = appBody.__x_data.currentVariante;
        cargarArchivoFBXReal(window.modeloActual, temp, varNum);
    }
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
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;