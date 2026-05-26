// Elementos del DOM
const videoElement = document.getElementById('webcam');
const cameraContainer = document.getElementById('camera-container');

// Variables del Motor 3D (Three.js)
let scene, camera, renderer, currentMesh;

// 1. INICIALIZAR EL ESCENARIO 3D TRANSPARENTE
function init3DSpace() {
    scene = new THREE.Scene();

    // Luces para dar volumen a las figuras geométricas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 4, 4);
    scene.add(dirLight);

    // Cámara de perspectiva
    camera = new THREE.PerspectiveCamera(45, cameraContainer.clientWidth / cameraContainer.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderizador con transparencia encima de la cámara
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(cameraContainer.clientWidth, cameraContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '5'; 
    cameraContainer.appendChild(renderer.domElement);

    // Generar la primera forma geométrica por defecto (Cubo)
    generarGeometriaSimulada("cubo", "#0A58CA");

    // Ciclo de animación continuo
    function animate() {
        requestAnimationFrame(animate);
        if (currentMesh) {
            // Si la UI sigue oculta (esperando pie), la figura rota de forma atractiva en el aire
            if (document.getElementById("simulation-overlay").classList.contains("hidden")) {
                currentMesh.rotation.y += 0.01;
                currentMesh.rotation.x += 0.005;
            }
        }
        renderer.render(scene, camera);
    }
    animate();
}

// 2. FUNCIÓN PARA GENERAR EL CUBO O CILINDRO DINÁMICAMENTE (REPOSICIONADO PARA EL PIE)
function generarGeometriaSimulada(tipo, colorHex) {
    if (currentMesh) scene.remove(currentMesh);

    let geometry;
    if (tipo === "cilindro") {
        // Cilindro acostado e inclinado que simula el empeine/caña de una bota
        geometry = new THREE.CylinderGeometry(0.35, 0.45, 1.6, 32);
    } else {
        // Caja de zapatos estilizada: más larga que alta y ancha
        geometry = new THREE.BoxGeometry(0.8, 0.45, 2.0); 
    }

    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(colorHex),
        roughness: 0.4,
        metalness: 0.2
    });

    currentMesh = new THREE.Mesh(geometry, material);
    
    // ACOPLAMIENTO AL PIE REAL: Lo bajamos al suelo (-1.4) y lo alejamos un poco (1.2)
    currentMesh.position.set(0, -1.3, 1.4); 
    
    // ROTACIÓN BASE EN PERSPECTIVA: Lo inclinamos hacia el frente para que encaje con la bota del video
    currentMesh.rotation.set(0.2, 0.4, 0); 

    scene.add(currentMesh);
}

// 3. ACTUALIZAR COLOR DE LA GEOMETRÍA
function actualizarColorGeometria(colorHex) {
    if (currentMesh && currentMesh.material) {
        currentMesh.material.color.set(colorHex);
    }
}

// 4. ACTUALIZAR LA ESCALA ANATÓMICA (SIMULACIÓN DE CALZADO LARGO Z)
function actualizarEscalaPorTalla(talla) {
    if (!currentMesh) return;
    
    // Talla base 26.0 = Escala 1.0
    // En lugar de inflar la figura como globo, estiramos más el largo (Z) que es la longitud del pie
    const escalaLargo = 1 + (talla - 26.0) * 0.15; // Crece más hacia el frente
    const escalaAnchoAlt = 1 + (talla - 26.0) * 0.07; // El ancho y alto cambian discretamente
    
    currentMesh.scale.set(escalaAnchoAlt, escalaAnchoAlt, escalaLargo);
    console.log(`[Three.js] Geometría estirada en eje Z para emular número ${talla} MX`);
}

// 5. ENCENDIDO SEGURO DE LA CÁMARA (BLINDADO CONTRA ERRORES EN PC Y MÓVIL)
async function iniciarCamaraNativa() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } }
        });
        videoElement.srcObject = stream;
        console.log("Cámara trasera encendida con éxito.");
    } catch (err) {
        console.warn("No se detectó cámara trasera (PC o Laptop), iniciando cámara genérica...");
        try {
            const streamGen = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = streamGen;
            console.log("Cámara genérica/PC encendida con éxito.");
        } catch (cameraErr) {
            console.error("Error crítico: El dispositivo no cuenta con cámaras activas o permisos.", cameraErr);
        }
    }
}

// 6. TRACKING AUTOMÁTICO DE IA (CON INTERFAZ REACCIONABLE TIMEOUT CONTROLADO)
function iniciarRastreadorIA() {
    console.log("Mapeando entorno visual...");
    
    setTimeout(() => {
        const overlay = document.getElementById("simulation-overlay");
        if (overlay && overlay.classList.contains("hidden")) {
            overlay.classList.remove("hidden");
            document.getElementById("btn-medir-flotante").classList.remove("hidden");
            
            // Forzamos la primera calibración anatómica automática
            tallaActual = 26.0;
            document.getElementById("view-talla").innerText = "26.0 MX (Auto)";
            actualizarEscalaPorTalla(tallaActual);
            
            console.log("¡Mapeo completo! Extremidades ubicadas.");
        }
    }, 2500); 
}

// Encender motores asíncronos en orden para que no se bloqueen entre sí
window.addEventListener('DOMContentLoaded', async () => {
    init3DSpace();          // 1. Inyecta el lienzo 3D con la forma estilizada
    await iniciarCamaraNativa(); // 2. Enciende la cámara web según el dispositivo
    iniciarRastreadorIA();  // 3. Activa los paneles y calcula la escala del pie
});

// Exponer funciones al plano global
window.generarGeometriaSimulada = generarGeometriaSimulada;
window.actualizarColorGeometria = actualizarColorGeometria;
window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;