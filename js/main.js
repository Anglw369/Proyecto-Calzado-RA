// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (SOPORTE .FBX CON SEGUIMIENTO DE IA)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoCalzadoActual = null; 
let poseEstimator = null;
let cameraMediaPipe = null;

window.modeloActual = "z01"; 
window.tallaActual = 26.0;

// Inicialización de la escena gráfica y la Inteligencia Artificial
function iniciarMotoresManuales() {
    // Si los motores ya están encendidos, limpiamos instancias de cámara previas de forma segura
    if (cameraMediaPipe) {
        try { cameraMediaPipe.stop(); } catch(e) { console.log(e); }
        cameraMediaPipe = null;
    }

    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    // Configuración Base de la Escena 3D (Three.js)
    if (!renderer) {
        scene = new THREE.Scene();

        const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(luzAmbiental);
        const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.7);
        luzDireccional.position.set(0, 6, 6);
        scene.add(luzDireccional);

        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 5);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.pointerEvents = 'none';
        container.appendChild(renderer.domElement);

        function animarEcosistema() {
            requestAnimationFrame(animarEcosistema);
            if (objetoCalzadoActual) {
                // Rotación sutil interactiva
                objetoCalzadoActual.rotation.y = Math.sin(Date.now() * 0.001) * 0.12;
            }
            renderer.render(scene, camera);
        }
        animarEcosistema();
    }

    // INTERCONEXIÓN CON LA IA DE MEDIAPIPE (Detección y seguimiento del Pie)
    if (!poseEstimator) {
        poseEstimator = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        poseEstimator.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        // Escucha en tiempo real de las coordenadas del pie
        poseEstimator.onResults((results) => {
            if (!objetoCalzadoActual) return;

            if (results.poseLandmarks) {
                // Puntos clave de MediaPipe para el tobillo (28) y el talón (30)
                const tobillo = results.poseLandmarks[28]; 
                const talon = results.poseLandmarks[30];  

                if (tobillo && tobillo.visibility > 0.5) {
                    // Mapeo matemático tridimensional inverso para colocar el zapato en el pie
                    const x3D = (tobillo.x - 0.5) * -4.5;
                    const y3D = (tobillo.y - 0.5) * -3.5 - 0.6;
                    
                    // Asignación de coordenadas suavizadas
                    objetoCalzadoActual.position.x = THREE.MathUtils.lerp(objetoCalzadoActual.position.x, x3D, 0.3);
                    objetoCalzadoActual.position.y = THREE.MathUtils.lerp(objetoCalzadoActual.position.y, y3D, 0.3);
                    objetoCalzadoActual.position.z = 0; 
                }
            }
        });
    }

    // Encendido del Hardware y Loop seguro de captura
    if (videoElement) {
        cameraMediaPipe = new Camera(videoElement, {
            onFrame: async () => {
                if (poseEstimator) {
                    await poseEstimator.send({ image: videoElement });
                }
            },
            width: 640,
            height: 480
        });
        cameraMediaPipe.start().catch(err => console.warn("Error levantando flujo IA:", err));
    }
}

// ==========================================================================
// CARGADOR ADAPTATIVO DE MODELADOS .FBX REALES (CORRECCIÓN RUTAS GITHUB PAGES)
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    const nombreArchivo = `${modeloBase.toLowerCase()}_${temporada.toLowerCase()}${variante}.fbx`;
    
    // Auto-detecta si estás en local o en GitHub Pages para no romper las rutas de carga
    const esGitHubPages = window.location.hostname.includes('github.io');
    const rutaRaiz = esGitHubPages ? `/${window.location.pathname.split('/')[1]}/` : '';
    const rutaCompleta = `${rutaRaiz}modelos/${nombreArchivo}`;
    
    const bannerArchivo = document.getElementById('view-archivo-fbx');
    if (bannerArchivo) bannerArchivo.innerText = nombreArchivo;

    if (objetoCalzadoActual) {
        scene.remove(objetoCalzadoActual);
        objetoCalzadoActual = null;
    }

    console.log("Ruta de solicitud de modelado:", rutaCompleta);

    const cargador = new THREE.FBXLoader();
    cargador.load(
        rutaCompleta,
        function (fbx) {
            objetoCalzadoActual = fbx;
            
            // Posición inicial de anclaje base
            objetoCalzadoActual.position.set(0, -0.6, 0); 
            
            // Multiplicador base estándar para re-escalar los FBX de Blender
            objetoCalzadoActual.scale.set(0.02, 0.02, 0.02);

            actualizarEscalaPorTalla(window.tallaActual);
            scene.add(objetoCalzadoActual);
            console.log(`¡Modelo Real ${nombreArchivo} renderizado en el pie con éxito!`);
        },
        function (progreso) {
            console.log("Descargando geometría real: ", Math.round((progreso.loaded / progreso.total * 100)) + "%");
        },
        function (error) {
            console.error("Fallo de enlace .fbx, activando malla de respaldo:", error);
            
            // Cubo estilizado transitorio en lo que se detecta el pie
            const geometry = new THREE.BoxGeometry(1.0, 0.5, 1.8);
            const material = new THREE.MeshStandardMaterial({ color: 0x0a58ca, wireframe: true });
            objetoCalzadoActual = new THREE.Mesh(geometry, material);
            objetoCalzadoActual.position.set(0, -0.6, 0);
            scene.add(objetoCalzadoActual);
        }
    );
}

function actualizarEscalaPorTalla(talla) {
    if (!objetoCalzadoActual) return;
    const factorEscala = (talla / 26.0) * 0.02; 
    objetoCalzadoActual.scale.set(factorEscala, factorEscala, factorEscala);
}

function intercambiarEntreZ01yZ02() {
    window.modeloActual = window.modeloActual === 'z01' ? 'z02' : 'z01';
    document.getElementById('view-modelo').innerText = window.modeloActual.toUpperCase();
    document.getElementById('btn-label-silueta').innerText = window.modeloActual.toUpperCase();
    
    const banner = document.getElementById('view-archivo-fbx').innerText;
    let temp = "pri";
    if (banner.includes("_ve")) temp = "ve";
    if (banner.includes("_ot")) temp = "ot";
    if (banner.includes("_in")) temp = "in";
    
    cargarArchivoFBXReal(window.modeloActual, temp, '1');
}

// ==========================================================================
// CAPTURA DE PANTALLA COMBINADA
// ==========================================================================
function capturarFotoProbador() {
    if (!renderer || !videoElement) return alert("Los motores no están listos.");

    const anchoCaptura = videoElement.videoWidth || 640;
    const altoCaptura = videoElement.videoHeight || 480;

    const canvasDestino = document.createElement('canvas');
    canvasDestino.width = anchoCaptura;
    canvasDestino.height = altoCaptura;
    const ctx = canvasDestino.getContext('2d');

    ctx.drawImage(videoElement, 0, 0, anchoCaptura, altoCaptura);

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
        ctx.drawImage(renderer.domElement, 0, 0, anchoCaptura, altoCaptura);
    }

    try {
        const linkDescarga = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
        linkDescarga.download = `StepRA-${window.modeloActual}-${timestamp}.png`;
        linkDescarga.href = canvasDestino.toDataURL('image/png');
        document.body.appendChild(linkDescarga);
        linkDescarga.click();
        document.body.removeChild(linkDescarga);
    } catch (error) {
        console.error("Error capturando lienzo:", error);
    }
}

// Exportación Global de Protocolos
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;