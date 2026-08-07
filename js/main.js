// js/main.js
// Inicializador mínimo de Three.js + FBXLoader para el probador AR.
(() => {
	let renderer, scene, camera, currentModel = null, container;
	let initialized = false;

	function initThree() {
		if (initialized) return;
		container = document.getElementById('camera-container');
		if (!container) return console.warn('No existe #camera-container en el DOM');

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(45, container.clientWidth / Math.max(1, container.clientHeight), 0.1, 1000);
		camera.position.set(0, 1.5, 3);

		const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent || '');
		const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);

		renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: isMobile ? 'low-power' : 'high-performance' });
		renderer.setPixelRatio(pixelRatio);
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.domElement.style.zIndex = '5';
		renderer.domElement.style.position = 'absolute';
		renderer.domElement.style.top = '0';
		renderer.domElement.style.left = '0';
		renderer.domElement.style.pointerEvents = 'none';
		container.appendChild(renderer.domElement);

		const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
		scene.add(hemi);

		const dir = new THREE.DirectionalLight(0xffffff, 0.8);
		dir.position.set(5, 10, 7.5);
		scene.add(dir);

		window.addEventListener('resize', onWindowResize);
		initialized = true;
		animate();
	}

	function onWindowResize() {
		if (!camera || !renderer || !container) return;
		camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	function animate() {
		requestAnimationFrame(animate);
		if (currentModel) currentModel.rotation.y += 0.003;
		renderer && renderer.render(scene, camera);
	}

	async function cargarArchivoFBXReal(zap, temp = 'pri', varNum = '1') {
		initThree();

		const statusEl = document.getElementById('view-archivo-fbx');
		if (statusEl) statusEl.innerText = 'cargando...';

		// Construimos la ruta esperada, pero el sistema intentará cargar siempre `Prueba.fbx` como fallback
		const requestedFilename = `${zap}_${temp}_v${varNum}.fbx`;
		const requestedPath = `models/fbx/${requestedFilename}`;
		const fallbackPath = `models/fbx/Prueba.fbx`;

		try {
			const loader = new THREE.FBXLoader();

			let triedFallback = false;
			const tryLoad = (pathToLoad, label) => {
				loader.load(pathToLoad, (obj) => {
					if (currentModel) {
						scene.remove(currentModel);
						disposeHierarchy(currentModel);
						currentModel = null;
					}

					currentModel = obj;
					// Ajuste inicial: autoescalar y centrar según bbox
					scaleAndCenterModel(currentModel, 0.6);
					scene.add(currentModel);

					if (statusEl) statusEl.innerText = label || pathToLoad.split('/').pop();
				}, (xhr) => {
					// progreso opcional
				}, (err) => {
					console.warn('Error cargando FBX', pathToLoad, err);
					if (!triedFallback && pathToLoad !== fallbackPath) {
						triedFallback = true;
						// Intentar fallback Prueba.fbx
						tryLoad(fallbackPath, 'Prueba.fbx');
					} else {
						if (statusEl) statusEl.innerText = 'no disponible';
					}
				});
			};

			// Para esta fase, forzamos siempre la carga de Prueba.fbx
			tryLoad(fallbackPath, 'Prueba.fbx');
		} catch (e) {
			console.error('Carga FBX fallida', e);
			if (statusEl) statusEl.innerText = 'error';
		}
	}

	function disposeHierarchy(node) {
		if (!node) return;
		node.traverse((child) => {
			if (child.geometry) child.geometry.dispose && child.geometry.dispose();
			if (child.material) {
				if (Array.isArray(child.material)) child.material.forEach(m => m.dispose && m.dispose());
				else child.material.dispose && child.material.dispose();
			}
			if (child.texture) child.texture.dispose && child.texture.dispose();
		});
	}

	function iniciarMotoresManuales() {
		initThree();

		const video = document.getElementById('webcam');
		const cameraStatus = document.getElementById('camera-status');
		const cameraStatusText = document.getElementById('camera-status-text');
		const startBtn = document.getElementById('camera-start-btn');
		if (!video) return;

		if (startBtn) { startBtn.disabled = true; startBtn.innerText = 'Solicitando cámara...'; }

		if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
			console.warn('getUserMedia no es soportado en este navegador');
			if (cameraStatusText) cameraStatusText.innerText = 'Tu navegador no soporta acceso a cámara (getUserMedia). Usa Chrome/Edge/Firefox en HTTPS o localhost.';
			if (cameraStatus) cameraStatus.style.display = 'flex';
			if (startBtn) startBtn.disabled = false;
			return;
		}

		const constraints = { video: { facingMode: { ideal: 'environment' } } };

		const attachStream = (stream) => {
			video.muted = true;
			video.setAttribute('playsinline', '');
			video.autoplay = true;
			video.srcObject = stream;
			video.play().catch(()=>{});
			if (cameraStatusText) cameraStatusText.innerText = 'Cámara iniciada';

			// Poll para detectar frames
			let checks = 0;
			const poll = setInterval(() => {
				checks++;
				if (video.videoWidth && video.videoHeight) {
					if (cameraStatus) cameraStatus.style.display = 'none';
					if (startBtn) startBtn.disabled = true;
					console.log('Frames recibidos, ocultando overlay');
					clearInterval(poll);
				} else if (checks > 60) {
					console.warn('No se detectaron frames en el video después de 6s');
					if (cameraStatusText) cameraStatusText.innerText = 'No se detectan frames de la cámara. Revisa permisos o prueba otro navegador.';
					if (startBtn) startBtn.disabled = false;
					clearInterval(poll);
				}
			}, 100);
		};



		navigator.mediaDevices.getUserMedia(constraints)
			.then((stream) => {
				console.log('getUserMedia ENV stream attached');
				attachStream(stream);
			})
			.catch((err) => {
				console.warn('Error getUserMedia (environment):', err);
				if (cameraStatusText) cameraStatusText.innerText = 'Error al solicitar cámara: ' + (err && err.name ? err.name : err.message || err);
				// enumerar dispositivos para diagnóstico
				navigator.mediaDevices.enumerateDevices().then(devs => console.log('Dispositivos encontrados:', devs)).catch(e => console.warn('enumerateDevices falló', e));
				if (cameraStatusText) cameraStatusText.innerText += ' - intentando frontal...';

				// Intentar cámara frontal
				navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
					.then((stream) => {
						console.log('getUserMedia USER stream attached');
						attachStream(stream);
					})
					.catch((err2) => {
						console.warn('No se pudo acceder a ninguna cámara:', err2);
						if (cameraStatusText) cameraStatusText.innerText = 'Permiso denegado o no hay cámara disponible.';
						if (startBtn) startBtn.disabled = false;
					});
			});
	}

// Diagnostic helper: enumerate devices and test basic permission (global)
async function runCameraDiagnostics() {
	if (!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)) {
		throw new Error('enumerateDevices no soportado');
	}
	const devs = await navigator.mediaDevices.enumerateDevices();
	const cams = devs.filter(d => d.kind === 'videoinput');
	return { devices: devs, cameras: cams };
}

window.runCameraDiagnostics = runCameraDiagnostics;

	// Mejora en el cargador: auto-centrar y escalar el modelo según su bbox
	function scaleAndCenterModel(obj, targetSize = 0.6) {
		try {
			const box = new THREE.Box3().setFromObject(obj);
			const size = new THREE.Vector3();
			box.getSize(size);
			const maxDim = Math.max(size.x, size.y, size.z);
			if (maxDim > 0) {
				const scale = targetSize / maxDim;
				obj.scale.setScalar((obj.scale.x || 1) * scale);
			}
			// centrar
			const center = new THREE.Vector3();
			box.getCenter(center);
			obj.position.x -= center.x;
			obj.position.y -= center.y;
			obj.position.z -= center.z;
			// poner ligeramente adelante
			obj.position.z += 0.1;
			// Guardar escala base para futuros ajustes por talla
			try { window.__sr_baseScale = obj.scale.x || 1; } catch(e){}
		} catch (e) {
			console.warn('scaleAndCenterModel falló', e);
		}
	}

	window.scaleAndCenterModel = scaleAndCenterModel;

	// Ajustar escala del modelo según la talla (base 26.0)
	function actualizarEscalaPorTalla(talla) {
		const t = parseFloat(talla) || 26;
		const factor = t / 26.0;
		if (!currentModel) {
			// almacenar para aplicar cuando se cargue
			window.__sr_pendingTalla = t;
			return;
		}
		const base = window.__sr_baseScale || (currentModel.scale.x || 1);
		currentModel.scale.setScalar(base * factor);
	}

	window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;

	// Funciones expuestas globalmente para que otros módulos las llamen
	window.iniciarMotoresManuales = iniciarMotoresManuales;
	window.cargarArchivoFBXReal = cargarArchivoFBXReal;
	window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;

})();