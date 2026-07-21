// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (MODO SIMULACIÓN CON CUBOS GEOMÉTRICOS)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoIzquierdoActual = null; 
let objetoDerechoActual = null; 
let trackerAI = null;
let camaraStream = null;
let modoFijo = true; 

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

        // MODO PASARELA FIJA: Si la IA no detecta el pie, flotan al frente como plantilla
        if (modoFijo) {
            if (objetoIzquierdoActual) {
                objetoIzquierdoActual.visible = true;
                objetoIzquierdoActual.position.set(-0.38, -0.65, 1.3);
                objetoIzquierdoActual.rotation.set(0, Math.PI, 0);
            }
            if (objetoDerechoActual) {
                objetoDerechoActual.visible = true;
                objetoDerechoActual.position.set(0.38, -0.65, 1.3);
                objetoDerechoActual.rotation.set(0, Math.PI, 0);
            }
        }

        renderer.render(scene, camera);
    }
    animarEcosistema();

    inicializarRastreadorAI();
}

function inicializarRastreadorAI() {
    if (!videoElement) return;

    trackerAI = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    trackerAI.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.35, 
        minTrackingConfidence: 0.35
    });

    trackerAI.onResults((results) => {
        if (!results.poseLandmarks) {
            modoFijo = true;
            return;
        }

        const tobilloIzq = results.poseLandmarks[27];
        const tobilloDer = results.poseLandmarks[28];
        const dedoIzq = results.poseLandmarks[31];
        const dedoDer = results.poseLandmarks[32];

        const detectadoIzq = tobilloIzq && tobilloIzq.visibility > 0.35;
        const detectadoDer = tobilloDer && tobilloDer.visibility > 0.35;

        if (detectadoIzq || detectadoDer) {
            modoFijo = false; 

            if (objetoIzquierdoActual && tobilloIzq) {
                objetoIzquierdoActual.visible = tobilloIzq.visibility > 0.35;
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
                objetoDerechoActual.visible = tobilloDer.visibility > 0.35;
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
        } else {
            modoFijo = true; 
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
                    } catch(e) { console.warn("Frame omitido secuencialmente."); }
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

function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    if (!scene) return;

    const banner = document.getElementById('view-archivo-fbx');
    if (banner) banner.innerText = `MODO SIMULACIÓN (CUBOS PRUEBA)`;

    // Limpieza de capas tridimensionales previas
    if (objetoIzquierdoActual) { scene.remove(objetoIzquierdoActual); objetoIzquierdoActual = null; }
    if (objetoDerechoActual) { scene.remove(objetoDerechoActual); objetoDerechoActual = null; }

    modoFijo = true; 

    // Geometría base escalada para simular las proporciones de un tenis (Ancho, Alto, Largo)
    const geometriaCubo = new THREE.BoxGeometry(0.12, 0.08, 0.25); 

    // --- ENTORNO VIRTUAL SIMULADO IZQUIERDO (Morado Neon) ---
    const materialIzquierdo = new THREE.MeshStandardMaterial({ 
        color: 0x8a2be2, 
        roughness: 0.4,
        metalness: 0.3
    });
    objetoIzquierdoActual = new THREE.Mesh(geometriaCubo, materialIzquierdo);
    objetoIzquierdoActual.visible = true;
    objetoIzquierdoActual.rotation.set(0, Math.PI, 0); 
    scene.add(objetoIzquierdoActual);

    // --- ENTORNO VIRTUAL SIMULADO DERECHO (Azul Eléctrico) ---
    const materialDerecho = new THREE.MeshStandardMaterial({ 
        color: 0x1e90ff, 
        roughness: 0.4,
        metalness: 0.3
    });
    objetoDerechoActual = new THREE.Mesh(geometriaCubo, materialDerecho);
    objetoDerechoActual.visible = true;
    objetoDerechoActual.rotation.set(0, Math.PI, 0); 
    scene.add(objetoDerechoActual);

    actualizarEscalaPorTalla(window.tallaActual);
    console.log("Simulador StepRA: Entorno inyectado con primitivos geométricos.");
}

function actualizarEscalaPorTalla(talla) {
    const factor = (talla / 26.0) * 1.0; // Primitivos usan una escala base directa
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
    link.download = `StepRA capture.png`;
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