class Renderer3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.container = null;
        this.gridSize = 5;
        this.cellSize = 2.0;
        this.robots = [];
        this.goalRings = [];
        this.hazardPillars = [];
        this.environmentGroup = null;
        this.agentsGroup = null;
        this.clock = new THREE.Clock();
        this.isInitialized = false;

        this.agentColors = [
            0xef4444, // Agent 0: Red
            0x10b981, // Agent 1: Green
            0x66fcf1, // Agent 2: Cyan
            0x8b5cf6, // Agent 3: Purple
            0xfbbf24  // Agent 4: Gold
        ];
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 560;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x080a0c);
        this.scene.fog = new THREE.FogExp2(0x080a0c, 0.022);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 14, 18);

        // WebGL Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Orbit Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent dipping below floor
        this.controls.minDistance = 6;
        this.controls.maxDistance = 50;

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(12, 24, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        const cyanLight = new THREE.PointLight(0x66fcf1, 0.6, 25);
        cyanLight.position.set(0, 8, 0);
        this.scene.add(cyanLight);

        this.environmentGroup = new THREE.Group();
        this.scene.add(this.environmentGroup);

        this.agentsGroup = new THREE.Group();
        this.scene.add(this.agentsGroup);

        window.addEventListener('resize', () => this.onResize());
        this.isInitialized = true;
        this.animate();
    }

    gridToWorld(row, col) {
        const offset = (this.gridSize - 1) * this.cellSize / 2.0;
        const x = col * this.cellSize - offset;
        const z = row * this.cellSize - offset;
        return { x, z };
    }

    buildEnvironment(gridSize = 5, obstacles = [], goal = null) {
        if (!this.isInitialized) return;
        this.gridSize = gridSize;

        // Clear previous environment models
        while (this.environmentGroup.children.length > 0) {
            this.environmentGroup.remove(this.environmentGroup.children[0]);
        }
        this.goalRings = [];
        this.hazardPillars = [];

        // 1. Build Metallic Grid Tiles
        const tileGeo = new THREE.BoxGeometry(this.cellSize * 0.92, 0.2, this.cellSize * 0.92);
        const tileMat = new THREE.MeshStandardMaterial({
            color: 0x161e27,
            roughness: 0.55,
            metalness: 0.45
        });

        const borderGeo = new THREE.EdgesGeometry(tileGeo);
        const borderMat = new THREE.LineBasicMaterial({ color: 0x2c3847, linewidth: 1 });

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = new THREE.Mesh(tileGeo, tileMat.clone());
                const { x, z } = this.gridToWorld(r, c);
                tile.position.set(x, -0.1, z);
                tile.receiveShadow = true;

                const wire = new THREE.LineSegments(borderGeo, borderMat);
                tile.add(wire);
                this.environmentGroup.add(tile);
            }
        }

        // 2. Build 3D Hazard Pillars (Obstacles)
        const hazardGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.8, 8);
        const hazardMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0x7f1d1d,
            roughness: 0.3,
            metalness: 0.7
        });

        obstacles.forEach((obs) => {
            const [r, c] = obs;
            const hazard = new THREE.Mesh(hazardGeo, hazardMat);
            const { x, z } = this.gridToWorld(r, c);
            hazard.position.set(x, 0.9, z);
            hazard.castShadow = true;
            hazard.receiveShadow = true;

            // Wireframe glow cage around hazard
            const haloGeo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.6, 0.7, 1.9, 8));
            const haloMat = new THREE.LineBasicMaterial({ color: 0xff8888 });
            hazard.add(new THREE.LineSegments(haloGeo, haloMat));

            this.environmentGroup.add(hazard);
            this.hazardPillars.push(hazard);
        });

        // 3. Build 3D Energy Portal (Goal)
        if (goal) {
            const [gr, gc] = goal;
            const { x, z } = this.gridToWorld(gr, gc);

            // Pedestal base
            const baseGeo = new THREE.CylinderGeometry(0.75, 0.9, 0.3, 16);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4, metalness: 0.6 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.set(x, 0.15, z);
            base.receiveShadow = true;
            this.environmentGroup.add(base);

            // Glowing rotating rings
            const ringGeo1 = new THREE.TorusGeometry(0.55, 0.08, 16, 32);
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0x10b981,
                emissive: 0x059669,
                roughness: 0.2,
                metalness: 0.8
            });
            const ring1 = new THREE.Mesh(ringGeo1, ringMat);
            ring1.position.set(x, 1.0, z);
            ring1.rotation.x = Math.PI / 3;
            this.environmentGroup.add(ring1);
            this.goalRings.push(ring1);

            const ringGeo2 = new THREE.TorusGeometry(0.4, 0.06, 16, 32);
            const ring2 = new THREE.Mesh(ringGeo2, ringMat.clone());
            ring2.position.set(x, 1.0, z);
            ring2.rotation.y = Math.PI / 4;
            this.environmentGroup.add(ring2);
            this.goalRings.push(ring2);

            // Goal beacon light
            const goalLight = new THREE.PointLight(0x10b981, 0.8, 8);
            goalLight.position.set(x, 1.5, z);
            this.environmentGroup.add(goalLight);
        }

        // Adjust camera perspective cleanly according to grid span
        const camDistance = Math.max(14, gridSize * 2.8);
        this.camera.position.set(0, camDistance * 0.8, camDistance);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    createRobotUnit(index) {
        const group = new THREE.Group();
        const color = this.agentColors[index % this.agentColors.length];

        // Main body chassis
        const bodyGeo = new THREE.BoxGeometry(0.85, 0.55, 0.85);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.35,
            metalness: 0.65
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Sensor dome head
        const domeGeo = new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.88;
        group.add(dome);

        // Visor eye
        const visorGeo = new THREE.BoxGeometry(0.4, 0.12, 0.15);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.0, 0.28);
        group.add(visor);

        // Hover energy ring below chassis
        const hoverGeo = new THREE.TorusGeometry(0.45, 0.05, 12, 24);
        const hoverMat = new THREE.MeshBasicMaterial({ color: color });
        const hoverRing = new THREE.Mesh(hoverGeo, hoverMat);
        hoverRing.rotation.x = Math.PI / 2;
        hoverRing.position.y = 0.22;
        group.add(hoverRing);

        // Store custom properties for lerp animations
        group.userData = {
            targetX: 0,
            targetZ: 0,
            baseY: 0.0,
            hoverSpeed: 3.0 + index * 0.5,
            hoverOffset: index * 1.2
        };

        this.agentsGroup.add(group);
        return group;
    }

    updateAgents(positions = []) {
        if (!this.isInitialized) return;

        // Reconcile agent count
        while (this.robots.length < positions.length) {
            const index = this.robots.length;
            const robot = this.createRobotUnit(index);
            const [r, c] = positions[index] || [0, 0];
            const { x, z } = this.gridToWorld(r, c);
            robot.position.set(x, 0, z);
            robot.userData.targetX = x;
            robot.userData.targetZ = z;
            this.robots.push(robot);
        }

        while (this.robots.length > positions.length) {
            const removed = this.robots.pop();
            this.agentsGroup.remove(removed);
        }

        // Set target coordinates for smooth step interpolation
        positions.forEach((pos, idx) => {
            const [r, c] = pos;
            const { x, z } = this.gridToWorld(r, c);
            if (this.robots[idx]) {
                // Calculate rotation toward target before updating coordinates
                const dx = x - this.robots[idx].position.x;
                const dz = z - this.robots[idx].position.z;
                if (Math.abs(dx) > 0.05 || Math.abs(dz) > 0.05) {
                    const targetAngle = Math.atan2(dx, dz);
                    this.robots[idx].rotation.y = targetAngle;
                }
                this.robots[idx].userData.targetX = x;
                this.robots[idx].userData.targetZ = z;
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isInitialized || !this.scene || !this.camera) return;

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Rotate goal energy rings
        this.goalRings.forEach((ring, idx) => {
            ring.rotation.x += delta * (idx === 0 ? 1.5 : -1.8);
            ring.rotation.y += delta * 1.2;
        });

        // Lerp robot units smoothly toward grid targets with hover bobbing
        this.robots.forEach((robot) => {
            const lerpFactor = 0.16;
            robot.position.x += (robot.userData.targetX - robot.position.x) * lerpFactor;
            robot.position.z += (robot.userData.targetZ - robot.position.z) * lerpFactor;

            const hoverY = Math.sin(elapsed * robot.userData.hoverSpeed + robot.userData.hoverOffset) * 0.12;
            robot.position.y = robot.userData.baseY + hoverY;
        });

        if (this.controls) this.controls.update();
        if (this.renderer) this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

window.renderer3D = new Renderer3D();
