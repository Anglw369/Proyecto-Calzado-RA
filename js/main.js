// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (GLB - TOTALMENTE RESPONSIVO)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoIzquierdoActual = null; 
let objetoDerechoActual = null; 
let trackerAI = null;
let camaraStream = null;

window.tallaActual = 26.0;

function iniciarMotoresManuales() {
    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    if (!container || !videoElement) return;
    if (renderer) return; // Evita inicializaciones dobles

    scene = new THREE.Scene();

    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.9);
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
        if (!renderer) return;
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
        minDetectionConfidence: 0.70,
        minTrackingConfidence: 0.70
    });

    trackerAI.onResults((results) => {
        if (objetoIzquierdoActual) objetoIzquierdoActual.visible = false;
        if (objetoDerechoActual) objetoDerechoActual.visible = false;

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const puntosAnatomicos = results.multiHandLandmarks[i];
            const tipoExtremidad = results.multiHandedness[i].label; 

            const puntoBase = puntosAnatomicos[0];  
            const puntoMedio = puntosAnatomicos[9]; 

            if (!puntoBase) continue;

            const targetX = (puntoBase.x - 0.5) * -3.5;
            const targetY = (puntoBase.y - 0.5) * -2.7 - 0.2;
            const profundidadZ = 1.0 + (puntoBase.z * -1.5);

            let anguloRotacion = 0;
            if (puntoMedio) {
                anguloRotacion = Math.atan2(puntoMedio.y - puntoBase.y, puntoMedio.x - puntoBase.x) + (Math.PI / 2);
            }

            if (tipoExtremidad === "Left" && objetoIzquierdoActual) {
                objetoIzquierdoActual.visible = true; 
                objetoIzquierdoActual.position.set(targetX - 0.12, targetY, profundidadZ);
                objetoIzquierdoActual.rotation.y = Math.PI - anguloRotacion;
            } 
            
            if (tipoExtremidad === "Right" && objetoDerechoActual) {
                objetoDerechoActual.visible = true; 
                objetoDerechoActual.position.set(targetX + 0.12, targetY, profundidadZ);
                objetoDerechoActual.rotation.y = Math.PI - anguloRotacion;
            }
        }
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            camaraStream = stream;
            videoElement.srcObject = stream;
            
            async function bucleIA() {
                if (videoElement && !videoElement.paused && !videoElement.ended && trackerAI) {
                    await trackerAI.send({ image: videoElement });
                }
                if (videoElement && videoElement.srcObject) {
                    videoElement.requestVideoFrameCallback ? videoElement.requestVideoFrameCallback(bucleIA) : setTimeout(bucleIA, 40);
                }
            }
            bucleIA();
        }).catch(err => console.error("Error de hardware en cámara:", err));
    }
}

function apagarCamara() {
    if (camaraStream) {
        camaraStream.getTracks().forEach(track => track.stop());
        camaraStream = null;
    }
    if (videoElement) {
        videoElement.srcObject = null;
    }
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
    }
    trackerAI = null;
    scene = null;
    camera = null;
}

function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    if (!scene) return;

    let nombreArchivoIzquierdo = `${modeloBase}${temporada}${variante}izquierdo.glb`;
    let nombreArchivoDerecho = `${modeloBase}${temporada}${variante}derecho.glb`;

    const esGitHubPages = window.location.hostname.includes('github.io');
    const rutaRaiz = esGitHubPages ? `/${window.location.pathname.split('/')[1]}/` : '';
    
    const banner = document.getElementById('view-archivo-fbx');
    if (banner) banner.innerText = `${modeloBase}${temporada}${variante}.glb`;

    if (objetoIzquierdoActual) { scene.remove(objetoIzquierdoActual); objetoIzquierdoActual = null; }
    if (objetoDerechoActual) { scene.remove(objetoDerechoActual); objetoDerechoActual = null; }

    const cargador = new THREE.GLTFLoader();

    cargador.load(`${rutaRaiz}models/${nombreArchivoIzquierdo}`, function (gltf) {
        objetoIzquierdoActual = gltf.scene;
        objetoIzquierdoActual.visible = false; 
        objetoIzquierdoActual.scale.set(0.012, 0.012, 0.012);
        objetoIzquierdoActual.rotation.set(0, Math.PI, 0); 
        actualizarEscalaPorTalla(window.tallaActual);
        scene.add(objetoIzquierdoActual);
    });

    cargador.load(`${rutaRaiz}models/${nombreArchivoDerecho}`, function (gltf) {
        objetoDerechoActual = gltf.scene;
        objetoDerechoActual.visible = false; 
        objetoDerechoActual.scale.set(0.012, 0.012, 0.012);
        objetoDerechoActual.rotation.set(0, Math.PI, 0); 
        actualizarEscalaPorTalla(window.tallaActual);
        scene.add(objetoDerechoActual);
    });
}

function actualizarEscalaPorTalla(talla) {
    const factor = (talla / 26.0) * 0.012;
    if (objetoIzquierdoActual) objetoIzquierdoActual.scale.set(factor, factor, factor);
    if (objetoDerechoActual) objetoDerechoActual.scale.set(factor, factor, factor);
}

function intercambiarEntreZ01yZ02() {
    window.modeloActual = window.modeloActual === 'za1' ? 'za2' : 'za1';
    const appBody = document.body;
    if(appBody && appBody.__x_data) {
        appBody.__x_data.currentZapato = window.modeloActual;
        cargarArchivoFBXReal(window.modeloActual, appBody.__x_data.currentTemporada, appBody.__x_data.currentVariante);
    }
}

function capturarFotoProbador() {
    if (!renderer || !videoElement) return;
    const canvasDestino = document.createElement('canvas');
    canvasDestino.width = videoElement.videoWidth;
    canvasDestino.height = videoElement.videoHeight;
    const ctx = canvasDestino.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, canvasDestino.width, canvasDestino.height);
    }
    const link = document.createElement('a');
    link.download = `StepRA-${Date.now()}.png`;
    link.href = canvasDestino.toDataURL('image/png');
    link.click();
}

window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;
window.apagarCamara = apagarCamara;