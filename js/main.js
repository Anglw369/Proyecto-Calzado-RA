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
    if (renderer) return; 

    scene = new THREE.Scene();

    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 1.0);
    luzDireccional.position.set(0, 6, 6);
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
    configurarInteraccionManual();
}

function configurarInteraccionManual() {
    const container = document.getElementById('camera-container');
    if (!container) return;

    const procesarPosicionamiento = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        const xNormalizado = (clientX - rect.left) / rect.width;
        const yNormalizado = (clientY - rect.top) / rect.height;

        const mundoX = (xNormalizado - 0.5) * 3.2;
        const mundoY = -(yNormalizado - 0.5) * 2.4 - 0.3;

        if (objetoIzquierdoActual) {
            objetoIzquierdoActual.visible = true;
            objetoIzquierdoActual.position.set(mundoX - 0.18, mundoY, 1.5);
        }
        if (objetoDerechoActual) {
            objetoDerechoActual.visible = true;
            objetoDerechoActual.position.set(mundoX + 0.18, mundoY, 1.5);
        }
    };

    container.addEventListener('touchstart', (e) => {
        if(e.touches.length > 0) procesarPosicionamiento(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) procesarPosicionamiento(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    container.addEventListener('mousedown', (e) => {
        procesarPosicionamiento(e.clientX, e.clientY);
    });
}

function inicializarRastreadorAI() {
    if (!videoElement) return;

    trackerAI = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    trackerAI.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.30, 
        minTrackingConfidence: 0.30
    });

    trackerAI.onResults((results) => {
        if (!results.poseLandmarks) return;

        const tobilloIzq = results.poseLandmarks[27];
        const tobilloDer = results.poseLandmarks[28];
        const dedoIzq = results.poseLandmarks[31];
        const dedoDer = results.poseLandmarks[32];

        if (objetoIzquierdoActual && tobilloIzq) {
            objetoIzquierdoActual.visible = true;
            const targetX = (tobilloIzq.x - 0.5) * -3.4;
            const targetY = (tobilloIzq.y - 0.5) * -2.6 - 0.3;
            
            objetoIzquierdoActual.position.x += (targetX - objetoIzquierdoActual.position.x) * 0.35;
            objetoIzquierdoActual.position.y += (targetY - objetoIzquierdoActual.position.y) * 0.35;
            objetoIzquierdoActual.position.z = 1.3;

            if (dedoIzq) {
                const angulo = Math.atan2(dedoIzq.y - tobilloIzq.y, dedoIzq.x - tobilloIzq.x);
                objetoIzquierdoActual.rotation.y = -angulo + Math.PI / 2;
            }
        }

        if (objetoDerechoActual && tobilloDer) {
            objetoDerechoActual.visible = true;
            const targetX = (tobilloDer.x - 0.5) * -3.4;
            const targetY = (tobilloDer.y - 0.5) * -2.6 - 0.3;
            
            objetoDerechoActual.position.x += (targetX - objetoDerechoActual.position.x) * 0.35;
            objetoDerechoActual.position.y += (targetY - objetoDerechoActual.position.y) * 0.35;
            objetoDerechoActual.position.z = 1.3;

            if (dedoDer) {
                const angulo = Math.atan2(dedoDer.y - tobilloDer.y, dedoDer.x - tobilloDer.x);
                objetoDerechoActual.rotation.y = -angulo + Math.PI / 2;
            }
        }
    });

    arrancarHardwareCamara();
}

function arrancarHardwareCamara() {
    if (!videoElement) return;
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            camaraStream = stream;
            videoElement.srcObject = stream;
            
            async function bucleIA() {
                if (videoElement && !videoElement.paused && !videoElement.ended && trackerAI) {
                    try {
                        await trackerAI.send({ image: videoElement });
                    } catch(e) { console.warn("Frame omitido."); }
                }
                if (videoElement && videoElement.srcObject) {
                    videoElement.requestVideoFrameCallback ? videoElement.requestVideoFrameCallback(bucleIA) : setTimeout(bucleIA, 40);
                }
            }
            bucleIA();
        }).catch(err => console.error("Error al arrancar stream de video:", err));
    }
}

function apagarCamara() {
    if (camaraStream) {
        camaraStream.getTracks().forEach(track => track.stop());
        camaraStream = null;
    }
    if (videoElement) videoElement.srcObject = null;
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

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        const appBody = document.body;
        if (appBody && appBody.__x_data && appBody.__x_data.subPage === 'ar_view' && !camaraStream) {
            arrancarHardwareCamara();
        }
    } else {
        if (camaraStream) {
            camaraStream.getTracks().forEach(track => track.stop());
            camaraStream = null;
        }
    }
});

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