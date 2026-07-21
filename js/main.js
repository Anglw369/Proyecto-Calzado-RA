// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (MODO SIMULACIÓN TOTALMENTE BLINDADO)
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

    // Luz ambiental de respaldo
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(luzAmbiental);

    // Detección robusta de dimensiones para evitar lienzos en 0px en móviles
    const anchoCanvas = container.clientWidth || window.innerWidth;
    const altoCanvas = container.clientHeight || window.innerHeight;

    // Configuración de cámara en matriz segura
    camera = new THREE.PerspectiveCamera(45, anchoCanvas / altoCanvas, 0.1, 1000);
    camera.position.set(0, 0, 3.2); 

    // Inicialización del renderizador tridimensional con búfer transparente
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(anchoCanvas, altoCanvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '100'; // Posicionado firmemente sobre el nodo de video
    container.appendChild(renderer.domElement);

    // Inyección inmediata de los bloques primitivos al ecosistema
    cargarArchivoFBXReal("za1", "pri", "1");

    function animarEcosistema() {
        if (!renderer) return;
        requestAnimationFrame(animarEcosistema);

        // MODO PASARELA FIJA: Los bloques flotan estables y rotan para demostrar actividad tridimensional
        if (modoFijo) {
            if (objetoIzquierdoActual) {
                objetoIzquierdoActual.visible = true;
                objetoIzquierdoActual.position.set(-0.35, -0.3, 0); 
                objetoIzquierdoActual.rotation.y += 0.015; 
                objetoIzquierdoActual.rotation.x = 0.2;
            }
            if (objetoDerechoActual) {
                objetoDerechoActual.visible = true;
                objetoDerechoActual.position.set(0.35, -0.3, 0); 
                objetoDerechoActual.rotation.y += 0.015;
                objetoDerechoActual.rotation.x = 0.2;
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
                // Mapeo adaptativo cinemático a la zona segura Z = 0
                const targetX = (tobilloIzq.x - 0.5) * -2.4;
                const targetY = (tobilloIzq.y - 0.5) * -1.8 - 0.2;
                
                objetoIzquierdoActual.position.x += (targetX - objetoIzquierdoActual.position.x) * 0.35;
                objetoIzquierdoActual.position.y += (targetY - objetoIzquierdoActual.position.y) * 0.35;
                objetoIzquierdoActual.position.z = 0; 

                if (dedoIzq) {
                    const angulo = Math.atan2(dedoIzq.y - tobilloIzq.y, dedoIzq.x - tobilloIzq.x);
                    objetoIzquierdoActual.rotation.set(0, -angulo + Math.PI / 2, 0);
                }
            }

            if (objetoDerechoActual && tobilloDer) {
                objetoDerechoActual.visible = tobilloDer.visibility > 0.35;
                const targetX = (tobilloDer.x - 0.5) * -2.4;
                const targetY = (tobilloDer.y - 0.5) * -1.8 - 0.2;
                
                objetoDerechoActual.position.x += (targetX - objetoDerechoActual.position.x) * 0.35;
                objetoDerechoActual.position.y += (targetY - objetoDerechoActual.position.y) * 0.35;
                objetoDerechoActual.position.z = 0; 

                if (dedoDer) {
                    const angulo = Math.atan2(dedoDer.y - tobilloDer.y, dedoDer.x - tobilloDer.x);
                    objetoDerechoActual.rotation.set(0, -angulo + Math.PI / 2, 0);
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
    if (banner) banner.innerText = `modo simulación (cubos prueba)`;

    if (objetoIzquierdoActual) { scene.remove(objetoIzquierdoActual); objetoIzquierdoActual = null; }
    if (objetoDerechoActual) { scene.remove(objetoDerechoActual); objetoDerechoActual = null; }

    modoFijo = true; 

    // Geometría calibrada con proporciones físicas exactas de un zapato
    const geometriaCubo = new THREE.BoxGeometry(0.22, 0.14, 0.45); 

    // 🔴 Bloque Izquierdo: Rojo Neón Auto-iluminado (Descarte total de errores de luces)
    const materialIzquierdo = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    objetoIzquierdoActual = new THREE.Mesh(geometriaCubo, materialIzquierdo);
    objetoIzquierdoActual.visible = true;
    scene.add(objetoIzquierdoActual);

    // 🟢 Bloque Derecho: Verde Neón Auto-iluminado
    const materialDerecho = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    objetoDerechoActual = new THREE.Mesh(geometriaCubo, materialDerecho);
    objetoDerechoActual.visible = true;
    scene.add(objetoDerechoActual);

    actualizarEscalaPorTalla(window.tallaActual);
    console.log("Simulador StepRA: Primitivos estables inyectados con éxito.");
}

function actualizarEscalaPorTalla(talla) {
    const factor = (talla / 26.0) * 1.0; 
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