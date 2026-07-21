// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (SOPORTE GLB - PIE IZQ / DER)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoIzquierdoActual = null; 
let objetoDerechoActual = null; 
let poseTracker = null;

window.tallaActual = 26.0;

function iniciarMotoresManuales() {
    if (renderer) return;

    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    // SEGURO DE CONTROL: Si el DOM aún no renderiza el contenedor, posponer
    if (!container || !videoElement) {
        console.warn("Esperando renderizado de elementos de cámara en el DOM...");
        setTimeout(iniciarMotoresManuales, 100);
        return;
    }

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
    if (!videoElement) return;

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
        if (!results.poseLandmarks) return;

        // Puntos anatómicos específicos de tobillo MediaPipe (27 Izquierdo, 28 Derecho)
        const tobilloDerecho = results.poseLandmarks[28];
        const tobilloIzquierdo = results.poseLandmarks[27];

        // RASTREO PIE IZQUIERDO
        if (objetoIzquierdoActual && tobilloIzquierdo && tobilloIzquierdo.visibility > 0.45) {
            objetoIzquierdoActual.visible = true;
            const targetX = (tobilloIzquierdo.x - 0.5) * -3.2 - 0.2;
            const targetY = (tobilloIzquierdo.y - 0.5) * -2.4 - 0.3;

            objetoIzquierdoActual.position.x += (targetX - objetoIzquierdoActual.position.x) * 0.30;
            objetoIzquierdoActual.position.y += (targetY - objetoIzquierdoActual.position.y) * 0.30;
            objetoIzquierdoActual.position.z = 1.2;
        } else if (objetoIzquierdoActual) {
            objetoIzquierdoActual.visible = false;
        }

        // RASTREO PIE DERECHO
        if (objetoDerechoActual && tobilloDerecho && tobilloDerecho.visibility > 0.45) {
            objetoDerechoActual.visible = true;
            const targetX = (tobilloDerecho.x - 0.5) * -3.2 + 0.2;
            const targetY = (tobilloDerecho.y - 0.5) * -2.4 - 0.3;

            objetoDerechoActual.position.x += (targetX - objetoDerechoActual.position.x) * 0.30;
            objetoDerechoActual.position.y += (targetY - objetoDerechoActual.position.y) * 0.30;
            objetoDerechoActual.position.z = 1.2;
        } else if (objetoDerechoActual) {
            objetoDerechoActual.visible = false;
        }
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            videoElement.srcObject = stream;
            
            async function bucleIA() {
                if (!videoElement.paused && !videoElement.ended && poseTracker) {
                    await poseTracker.send({ image: videoElement });
                }
                if (videoElement.requestVideoFrameCallback) {
                    videoElement.requestVideoFrameCallback(bucleIA);
                } else {
                    setTimeout(bucleIA, 40);
                }
            }
            bucleIA();
        }).catch(err => console.error("Error al acceder a la cámara:", err));
    }
}

// ==========================================================================
// CARGADOR INTEGRAL GLTF PARA ARCHIVOS .GLB (IZQUIERDO Y DERECHO)
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    if (!scene) {
        console.warn("La escena Three.js no está lista. Reintentando carga en breve...");
        setTimeout(() => cargarArchivoFBXReal(modeloBase, temporada, variante), 200);
        return;
    }

    let nombreArchivoIzquierdo = `${modeloBase}${temporada}${variante}izquierdo.glb`;
    let nombreArchivoDerecho = `${modeloBase}${temporada}${variante}derecho.glb`;

    const esGitHubPages = window.location.hostname.includes('github.io');
    const rutaRaiz = esGitHubPages ? `/${window.location.pathname.split('/')[1]}/` : '';
    const rutaCompletaIzq = `${rutaRaiz}models/${nombreArchivoIzquierdo}`;
    const rutaCompletaDer = `${rutaRaiz}models/${nombreArchivoDerecho}`;
    
    const banner = document.getElementById('view-archivo-fbx');
    if (banner) banner.innerText = `${modeloBase}_${temporada}${variante}.glb`;

    // Limpieza estricta de instancias anteriores en escena
    if (objetoIzquierdoActual) { scene.remove(objetoIzquierdoActual); objetoIzquierdoActual = null; }
    if (objetoDerechoActual) { scene.remove(objetoDerechoActual); objetoDerechoActual = null; }

    console.log("Cargando nuevos componentes GLB:", nombreArchivoIzquierdo, nombreArchivoDerecho);

    const cargador = new THREE.GLTFLoader();

    // Cargar Pie Izquierdo
    cargador.load(rutaCompletaIzq, function (gltf) {
        objetoIzquierdoActual = gltf.scene;
        objetoIzquierdoActual.visible = false; 
        objetoIzquierdoActual.scale.set(0.0003, 0.0003, 0.0003);
        objetoIzquierdoActual.rotation.set(0, Math.PI, 0); 
        actualizarEscalaPorTalla(window.tallaActual);
        scene.add(objetoIzquierdoActual);
    }, null, err => console.error("Fallo al encontrar calzado izquierdo:", err));

    // Cargar Pie Derecho
    cargador.load(rutaCompletaDer, function (gltf) {
        objetoDerechoActual = gltf.scene;
        objetoDerechoActual.visible = false; 
        objetoDerechoActual.scale.set(0.0003, 0.0003, 0.0003);
        objetoDerechoActual.rotation.set(0, Math.PI, 0); 
        actualizarEscalaPorTalla(window.tallaActual);
        scene.add(objetoDerechoActual);
    }, null, err => console.error("Fallo al encontrar calzado derecho:", err));
}

function actualizarEscalaPorTalla(talla) {
    const factor = (talla / 26.0) * 0.0003;
    if (objetoIzquierdoActual) objetoIzquierdoActual.scale.set(factor, factor, factor);
    if (objetoDerechoActual) objetoDerechoActual.scale.set(factor, factor, factor);
}

function intercambiarEntreZ01yZ02() {
    window.modeloActual = window.modeloActual === 'za1' ? 'za2' : 'za1';
    
    const appBody = document.body;
    if(appBody && appBody.__x_data) {
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

// Exposición global absoluta
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;