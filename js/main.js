// ==========================================================================
// CONFIGURACIÓN GLOBAL DE MOTORES STEPRA (RENDERIZADO .FBX BLINDADO)
// ==========================================================================
let scene, camera, renderer, videoElement;
let objetoCalzadoActual = null; 

window.modeloActual = "z01"; 
window.tallaActual = 26.0;

// Inicialización limpia de la escena gráfica de Realidad Aumentada
function iniciarMotoresManuales() {
    if (renderer) return; // Prevenir duplicaciones en memoria

    videoElement = document.getElementById('webcam');
    const container = document.getElementById('camera-container');

    // Crear Escena 3D
    scene = new THREE.Scene();

    // Iluminación optimizada para realismo de materiales FBX
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(luzAmbiental);
    
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDireccional.position.set(0, 4, 4);
    scene.add(luzDireccional);

    // Cámara con profundidad adaptada a móviles
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 4);

    // Renderizador con buffer de persistencia de imagen habilitado
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

    // Bucle de renderizado continuo
    function animarEcosistema() {
        requestAnimationFrame(animarEcosistema);
        if (objetoCalzadoActual) {
            // Rotación sutil automática para simular el efecto flotante sobre el pie
            objetoCalzadoActual.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
        }
        renderer.render(scene, camera);
    }
    animarEcosistema();

    // Activación directa de la cámara trasera sin sobrecargar el procesador con la IA
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            if (videoElement) videoElement.srcObject = stream;
        })
        .catch(function(error) {
            console.warn("Acceso a la cámara denegado:", error);
        });
    }
}

// ==========================================================================
// CARGADOR INTEGRAL DE MODELOS REALES .FBX
// ==========================================================================
function cargarArchivoFBXReal(modeloBase, temporada, variante) {
    const nombreArchivo = `${modeloBase.toLowerCase()}_${temporada.toLowerCase()}${variante}.fbx`;
    
    // Corrige automáticamente la ruta si estás en Localhost o en los servidores de GitHub Pages
    const esGitHubPages = window.location.hostname.includes('github.io');
    const rutaRaiz = esGitHubPages ? `/${window.location.pathname.split('/')[1]}/` : '';
    const rutaCompleta = `${rutaRaiz}modelos/${nombreArchivo}`;
    
    const bannerArchivo = document.getElementById('view-archivo-fbx');
    if (bannerArchivo) bannerArchivo.innerText = nombreArchivo;

    // Limpieza estricta de memoria antes de inyectar un nuevo modelo
    if (objetoCalzadoActual) {
        scene.remove(objetoCalzadoActual);
        objetoCalzadoActual = null;
    }

    console.log("Cargando archivo desde ruta:", rutaCompleta);

    const cargador = new THREE.FBXLoader();
    cargador.load(
        rutaCompleta,
        function (fbx) {
            objetoCalzadoActual = fbx;
            
            // Posicionamiento ergonómico centrado en la vista del celular
            objetoCalzadoActual.position.set(0, -0.5, 0); 
            
            // Escala base para corregir dimensiones métricas de exportación
            objetoCalzadoActual.scale.set(0.015, 0.015, 0.015);

            actualizarEscalaPorTalla(window.tallaActual);
            scene.add(objetoCalzadoActual);
            console.log(`¡Modelo Real ${nombreArchivo} renderizado de forma exitosa!`);
        },
        function (progreso) {
            console.log("Cargando: ", Math.round((progreso.loaded / progreso.total * 100)) + "%");
        },
        function (error) {
            console.error("Error cargando .fbx, desplegando malla de previsualización:", error);
            
            // Si la ruta falla, creamos una silueta limpia de zapato tridimensional simulado
            const geometry = new THREE.BoxGeometry(1.1, 0.5, 2.0);
            const material = new THREE.MeshStandardMaterial({ color: 0x0a58ca, transparent: true, opacity: 0.7, wireframe: true });
            objetoCalzadoActual = new THREE.Mesh(geometry, material);
            objetoCalzadoActual.position.set(0, -0.5, 0);
            scene.add(objetoCalzadoActual);
        }
    );
}

// Adaptación dinámica de escala según la talla seleccionada
function actualizarEscalaPorTalla(talla) {
    if (!objetoCalzadoActual) return;
    const factorEscala = (talla / 26.0) * 0.015; 
    objetoCalzadoActual.scale.set(factorEscala, factorEscala, factorEscala);
}

// Intercambiador veloz entre zapato Z01 y Z02
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
// CAPTURA DE FOTO COMBINADA
// ==========================================================================
function capturarFotoProbador() {
    if (!renderer || !videoElement) return alert("Los motores gráficos no están listos.");

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
        console.error("Error al procesar render de captura:", error);
    }
}

// Vinculación formal con el Árbol DOM de la aplicación
window.iniciarMotoresManuales = iniciarMotoresManuales;
window.cargarArchivoFBXReal = cargarArchivoFBXReal;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;
window.intercambiarEntreZ01yZ02 = intercambiarEntreZ01yZ02;
window.capturarFotoProbador = capturarFotoProbador;
window.actualizarModeloFBXDynamico = cargarArchivoFBXReal;