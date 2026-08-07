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

		renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio || 1);
		renderer.setSize(container.clientWidth, container.clientHeight);
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
		const filename = `${zap}_${temp}_v${varNum}.fbx`;
		const path = `models/fbx/${filename}`;

		const statusEl = document.getElementById('view-archivo-fbx');
		if (statusEl) statusEl.innerText = 'cargando...';

		try {
			if (typeof THREE.FBXLoader !== 'function' && typeof THREE.FBXLoader === 'undefined') {
				// Some versions attach loader differently; try global FBXLoader
			}

			const loader = new THREE.FBXLoader();
			loader.load(path, (obj) => {
				if (currentModel) {
					scene.remove(currentModel);
					disposeHierarchy(currentModel);
					currentModel = null;
				}

				currentModel = obj;
				// Ajuste inicial
				currentModel.scale.setScalar(0.01);
				currentModel.position.set(0, 0, 0);
				scene.add(currentModel);

				if (statusEl) statusEl.innerText = filename;
			}, (xhr) => {
				// progreso opcional
			}, (err) => {
				console.warn('Error cargando FBX', err);
				if (statusEl) statusEl.innerText = 'no disponible';
			});
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
		if (!video) return;

		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
				.then((stream) => { video.srcObject = stream; video.play(); })
				.catch((err) => { console.warn('No se pudo acceder a la cámara:', err); });
		}
	}

	function actualizarEscalaPorTalla(talla) {
		if (!currentModel) return;
		// escala relativa respecto a talla base 26.0
		const factor = (parseFloat(talla) || 26) / 26.0;
		currentModel.scale.setScalar(0.01 * factor);
	}

	// Funciones expuestas globalmente para que otros módulos las llamen
	window.iniciarMotoresManuales = iniciarMotoresManuales;
	window.cargarArchivoFBXReal = cargarArchivoFBXReal;
	window.actualizarEscalaPorTalla = actualizarEscalaPorTalla;

})();