// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (MODELADO1.FBX + AUTO-ESCALADO)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoIzquierdoActual = null; 
let objetoDerechoActual = null; 
let trackerAI = null;
let camaraStream = null;
let modoFijo = true; 

const fbxLoader = new THREE.FBXLoader();
window.tallaActual = 26.0;

function iniciarMotoresManuales() {
    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    if (!container || !videoElement) return;
    if (renderer) return; 

    scene = new THREE.Scene();

    const luzAmbiental = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(luzAmbiental);

    const luzDireccional = new THREE.DirectionalLight(0xffffff, 1.5);
    luzDireccional.position.set(0, 6, 6);
    scene.add(luzDireccional);

    const anchoCanvas = container.clientWidth || window.innerWidth;
    const altoCanvas = container.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(45, anchoCanvas / altoCanvas, 0.1, 1000);
    camera.position.set(0, 0, 3.2);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(anchoCanvas, altoCanvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '10';
    container.appendChild(renderer.domElement);

    cargarArchivoFBXReal("za1", "pri", "1");

    function animarEcosistema() {
        if (!renderer) return;
        requestAnimationFrame(animarEcosistema);

        if (modoFijo) {
            if (objetoIzquierdoActual) {
                objetoIzquierdoActual.visible = true;
                objetoIzquierdoActual.position.set(-0.35, -0.3, 0);
                objetoIzquierdoActual.rotation.set(0.2, Math.PI + 0.2, 0);
            }
            if (objetoDerechoActual) {
                objetoDerechoActual.visible = true;
                objetoDerechoActual.position.set(0.35, -0.3, 0);
                objetoDerechoActual.rotation.set(0.2, Math.PI - 0.2, 0);
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
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
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

// Auto-escalado seguro independiente de las unidades de Blender
function normalizarTamanoModelo(objeto, tamanoObjetivo = 0.45) {
    const box = new THREE.Box3().setFromObject(objeto);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    if (maxDimension > 0) {
        const factorEscala = tamanoObjetivo / maxDimension;
        objeto.scale.setScalar(factorEscala);
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    objeto.position.sub(center);
    
    window.__baseScaleCalculated = objeto.scale.x;
}

function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    if (!scene) return;

    const banner = document.getElementById('view-archivo-fbx');
    if (banner) banner.innerText = "Cargando modelado1.fbx...";

    if (objetoIzquierdoActual) { scene.remove(objetoIzquierdoActual); objetoIzquierdoActual = null; }
    if (objetoDerechoActual) { scene.remove(objetoDerechoActual); objetoDerechoActual = null; }

    modoFijo = true; 

    const rutaFBX = 'models/fbx/modelado1.fbx';

    fbxLoader.load(rutaFBX, (fbx) => {
        // Pie Izquierdo
        objetoIzquierdoActual = fbx;
        objetoIzquierdoActual.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.side = THREE.DoubleSide;
            }
        });

        normalizarTamanoModelo(objetoIzquierdoActual, 0.45);
        scene.add(objetoIzquierdoActual);

        // Pie Derecho
        objetoDerechoActual = fbx.clone();
        objetoDerechoActual.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.side = THREE.DoubleSide;
            }
        });

        normalizarTamanoModelo(objetoDerechoActual, 0.45);
        scene.add(objetoDerechoActual);

        actualizarEscalaPorTalla(window.tallaActual);
        if (banner) banner.innerText = "modelado1.fbx cargado";
        console.log("StepRA: modelado1.fbx cargado y auto-escalado con éxito.");

    }, (progress) => {
        if (progress.lengthComputable && banner) {
            const pct = (progress.loaded / progress.total * 100).toFixed(0);
            banner.innerText = `Cargando modelado1.fbx (${pct}%)`;
        }
    }, (error) => {
        console.error("Error al cargar models/fbx/modelado1.fbx:", error);
        if (banner) banner.innerText = "error al cargar modelado";
    });
}

function actualizarEscalaPorTalla(talla) {
    const factorTalla = talla / 26.0;
    const base = window.__baseScaleCalculated || 1.0;
    if (objetoIzquierdoActual) objetoIzquierdoActual.scale.setScalar(base * factorTalla);
    if (objetoDerechoActual) objetoDerechoActual.scale.setScalar(base * factorTalla);
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