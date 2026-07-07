// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (SOPORTE MODELOS REALES .FBX)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoCalzadoActual = null; // Guardará el mesh .fbx que esté cargado en pantalla

window.modeloActual = "z01"; 
window.tallaActual = 26.0;

// Inicialización de la escena gráfica de Realidad Aumentada
function iniciarMotoresManuales() {
    if (renderer) return; // Si ya está corriendo, no duplicar

    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    // Crear Escena 3D
    scene = new THREE.Scene();

    // Crear Iluminación para que el calzado luzca realista
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.6);
    luzDireccional.position.set(0, 5, 5);
    scene.add(luzDireccional);

    // Crear Cámara Matemática Proporcional
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Configurar Renderizador con soporte de transparencia y preservación de pixeles para foto
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

    // Iniciar bucle de dibujo continuo
    function animarEcosistema() {
        requestAnimationFrame(animarEcosistema);
        if (objetoCalzadoActual) {
            // Le damos una leve rotación estética automática para simular flotado sobre el pie
            objetoCalzadoActual.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
        }
        renderer.render(scene, camera);
    }
    animarEcosistema();

    // Encender Cámara Web Física de forma segura
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            videoElement.srcObject = stream;
        })
        .catch(function(error) {
            console.warn("Cámara bloqueada o no disponible:", error);
        });
    }
}

// ==========================================================================
// FUNCIÓN ESTRELLA: CARGADOR DINÁMICO DE ARCHIVOS .FBX REALES
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    // 1. Construimos el nombre exacto basado en la nomenclatura de tu compañero
    const nombreArchivo = `${modeloBase.toLowerCase()}_${temporada.toLowerCase()}${variante}.fbx`;
    const rutaCompleta = `modelos/${nombreArchivo}`;
    
    // Actualizamos los letreros visuales en la interfaz superior
    const bannerArchivo = document.getElementById('view-archivo-fbx');
    if (bannerArchivo) bannerArchivo.innerText = nombreArchivo;

    // 2. Si ya había un zapato en pantalla, lo removemos de la memoria para que no se encimen
    if (objetoCalzadoActual) {
        scene.remove(objetoCalzadoActual);
        objetoCalzadoActual = null;
    }

    console.log("Intentando cargar modelo real:", rutaCompleta);

    // 3. Instanciamos el cargador oficial de FBX de Three.js
    const cargador = new THREE.FBXLoader();
    
    cargador.load(
        rutaCompleta,
        function (fbx) {
            objetoCalzadoActual = fbx;

            // Centramos el calzado en el origen de coordenadas AR
            objetoCalzadoActual.position.set(0, -0.8, 0); 
            
            // Re-escalamos de forma segura. Los archivos FBX de software como Blender
            // suelen venir gigantes o muy milimétricos. Ajustamos un multiplicador base.
            objetoCalzadoActual.scale.set(0.02, 0.02, 0.02);

            // Ajustamos la escala final basándonos en la talla actual calibrada
            actualizarEscalaPorTalla(window.tallaActual);

            // Añadimos el calzado real a la escena visible de la cámara
            scene.add(objetoCalzadoActual);
            console.log(`¡Archivo ${nombreArchivo} cargado y enlazado con éxito!`);
        },
        function (progreso) {
            console.log("Cargando bytes del FBX: ", (progreso.loaded / progreso.total * 100) + "%");
        },
        function (error) {
            console.error("Detalle al cargar el archivo .fbx en caliente:", error);
            // Si el archivo no existe o falla, ponemos un cubo de respaldo temporal para que no se quede vacío
            console.log("Colocando geometría de respaldo...");
            const geometry = new THREE.BoxGeometry(1.2, 0.6, 2);
            const material = new THREE.MeshStandardMaterial({ color: 0x0a58ca, wireframe: true });
            objetoCalzadoActual = new THREE.Mesh(geometry, material);
            objetoCalzadoActual.position.set(0, -0.5, 0);
            scene.add(objetoCalzadoActual);
        }
    );
}

// Control de escala paramétrica según la talla mexicana
function actualizarEscalaPorTalla(talla) {
    if (!objetoCalzadoActual) return;
    // Factor matemático base para amoldar la escala tridimensional a centímetros reales
    const factorEscala = (talla / 26.0) * 0.02; 
    objetoCalzadoActual.scale.set(factorEscala, factorEscala, factorEscala);
}

// Botón para alternar rápido entre el zapato Z01 y Z02
function intercambiarEntreZ01yZ02() {
    window.modeloActual = window.modeloActual === 'z01' ? 'z02' : 'z01';
    document.getElementById('view-modelo').innerText = window.modeloActual.toUpperCase();
    document.getElementById('btn-label-silueta').innerText = window.modeloActual.toUpperCase();
    
    // Obtenemos los filtros activos en la pantalla desde Alpine para refrescar el FBX instantáneo
    const deTemporada = document.getElementById('view-archivo-fbx').innerText.split('_')[1].substring(0,3).replace(/[0-9]/g, '');
    let temporadaLimpia = "pri";
    if(deTemporada.includes("ve")) temporadaLimpia = "ve";
    if(deTemporada.includes("ot")) temporadaLimpia = "ot";
    if(deTemporada.includes("in")) temporadaLimpia = "in";

    cargarArchivoFBXReal(window.modeloActual, temporadaLimpia, '1');
}

// ==========================================================================
// MOTOR DE CAPTURA DE PANTALLA COMBINADA (FOTO REAL)
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
        linkDescarga.download = `StepRA-${window.modeloActual}-Capture-${timestamp}.png`;
        linkDescarga.href = canvasDestino.toDataURL('image/png');
        document.body.appendChild(linkDescarga);
        linkDescarga.click();
        document.body.removeChild(linkDescarga);
    } catch (error) {
        console.error("Error capturando matriz:", error);
    }
}

// Exponer funciones globales
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;