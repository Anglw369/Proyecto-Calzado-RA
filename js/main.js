// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (RA BASADA EN H-MEDIAPIPE PARA PIE)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoIzquierdoActual = null; 
let objetoDerechoActual = null; 
let trackerAI = null;

window.tallaActual = 26.0;

function iniciarMotoresManuales() {
    if (renderer) return;

    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    if (!container || !videoElement) {
        console.warn("Esperando renderizado de elementos de cámara en el DOM...");
        setTimeout(iniciarMotoresManuales, 100);
        return;
    }

    scene = new THREE.Scene();

    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDireccional.position.set(0, 5, 5);
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

    trackerAI = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    trackerAI.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45
    });

    trackerAI.onResults((results) => {
        // REGLA ESTRICTA: Ocultar los zapatos por defecto. No se muestran si no hay detección.
        if (objetoIzquierdoActual) objetoIzquierdoActual.visible = false;
        if (objetoDerechoActual) objetoDerechoActual.visible = false;

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const puntosAnatomicos = results.multiHandLandmarks[i];
            const tipoExtremidad = results.multiHandedness[i].label; // Left o Right

            const puntoBase = puntosAnatomicos[0];  // Tobillo / Talón
            const puntoMedio = puntosAnatomicos[9]; // Centro del empeine

            if (!puntoBase) continue;

            // Mapeo de coordenadas al espacio tridimensional de Three.js
            const targetX = (puntoBase.x - 0.5) * -3.3;
            const targetY = (puntoBase.y - 0.5) * -2.5 - 0.2;
            const profundidadZ = 1.1 + (puntoBase.z * -1.2);

            let anguloRotacion = 0;
            if (puntoMedio) {
                anguloRotacion = Math.atan2(puntoMedio.y - puntoBase.y, puntoMedio.x - puntoBase.x) + (Math.PI / 2);
            }

            // Si se detecta la extremidad izquierda, encendemos el modelo y lo movemos a su posición
            if (tipoExtremidad === "Left" && objetoIzquierdoActual) {
                objetoIzquierdoActual.visible = true; 
                objetoIzquierdoActual.position.x = targetX - 0.15;
                objetoIzquierdoActual.position.y = targetY;
                objetoIzquierdoActual.position.z = profundidadZ;
                objetoIzquierdoActual.rotation.y = Math.PI - anguloRotacion;
            } 
            
            // Si se detecta la extremidad derecha, encendemos el modelo y lo movemos a su posición
            if (tipoExtremidad === "Right" && objetoDerechoActual) {
                objetoDerechoActual.visible = true; 
                objetoDerechoActual.position.x = targetX + 0.15;
                objetoDerechoActual.position.y = targetY;
                objetoDerechoActual.position.z = profundidadZ;
                objetoDerechoActual.rotation.y = Math.PI - anguloRotacion;
            }
        }
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            videoElement.srcObject = stream;
            
            async function bucleIA() {
                if (!videoElement.paused && !videoElement.ended && trackerAI) {
                    await trackerAI.send({ image: videoElement });
                }
                if (videoElement.requestVideoFrameCallback) {
                    videoElement.requestVideoFrameCallback(bucleIA);
                } else {
                    setTimeout(bucleIA, 40);
                }
            }
            bucleIA();
        }).catch(err => console.error("Error al iniciar cámara trasera:", err));
    }
}

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
    if (banner) banner.innerText = `${modeloBase}${temporada}${variante}.glb`;

    if (objetoIzquierdoActual) { scene.remove(objetoIzquierdoActual); objetoIzquierdoActual = null; }
    if (objetoDerechoActual) { scene.remove(objetoDerechoActual); objetoDerechoActual = null; }

    console.log("Invocando nuevos componentes GLB:", nombreArchivoIzquierdo, nombreArchivoDerecho);

    const cargador = new THREE.GLTFLoader();

    // 1. Cargar Pie Izquierdo
    cargador.load(rutaCompletaIzq, function (gltf) {
        objetoIzquierdoActual = gltf.scene;
        objetoIzquierdoActual.visible = false; // Mantener apagado hasta que la IA lo encuentre
        objetoIzquierdoActual.scale.set(0.0003, 0.0003, 0.0003);
        objetoIzquierdoActual.rotation.set(0, Math.PI, 0); 
        actualizarEscalaPorTalla(window.tallaActual);
        scene.add(objetoIzquierdoActual);
    }, null, err => console.error("Archivo izquierdo no encontrado:", err));

    // 2. Cargar Pie Derecho
    cargador.load(rutaCompletaDer, function (gltf) {
        objetoDerechoActual = gltf.scene;
        objetoDerechoActual.visible = false; // Mantener apagado hasta que la IA lo encuentre
        objetoDerechoActual.scale.set(0.0003, 0.0003, 0.0003);
        objetoDerechoActual.rotation.set(0, Math.PI, 0); 
        actualizarEscalaPorTalla(window.tallaActual);
        scene.add(objetoDerechoActual);
    }, null, err => console.error("Archivo derecho no encontrado:", err));
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

window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;