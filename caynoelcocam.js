// Import các thư viện 3D và MediaPipe
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'; 
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// --- CẤU HÌNH CỐT LÕI (CORE CONFIG) ---
const CONFIG = {
    colors: {
        bg: 0x000000,           // Màu nền (Đen)
        champagneGold: 0xffd966, // Vàng champagne (Màu chủ đạo)
        deepGreen: 0x03180a,     // Xanh lá đậm (Lá thông)
        accentRed: 0x990000,     // Đỏ điểm xuyết
    },
    particles: {
        count: 1500,     // Số lượng hạt tạo hình cây thông
        dustCount: 2500, // Số lượng hạt bụi lấp lánh xung quanh
        treeHeight: 24,  // Chiều cao cây
        treeRadius: 8    // Bán kính đáy cây
    },
    camera: { z: 50 },   // Khoảng cách camera
    
    // Cấu hình tải ảnh tự động
    preload: {
        autoScanLocal: true,
        scanCount: 200, // Số lượng tối đa thử tải từ thư mục local
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'], // Định dạng ảnh hỗ trợ
        // 4 hình ảnh mặc định lấy từ internet (Unsplash)
        images: [
            'https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=600', 
            'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=600',
            'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=600', 
            'https://images.unsplash.com/photo-1482638588057-dce9509db949?q=80&w=600'
        ]
    }
};

// --- QUẢN LÝ TRẠNG THÁI (STATE) ---
const STATE = {
    mode: 'TREE', // Chế độ mặc định: TREE (Cây), SCATTER (Phân tán), FOCUS (Xem ảnh)
    focusIndex: -1, 
    focusTarget: null, // Lưu đối tượng ảnh đang được focus
    hand: { detected: false, x: 0, y: 0 }, // Thông tin bàn tay nhận diện được
    rotation: { x: 0, y: 0 } // Góc xoay của cây thông
};

// Khai báo các biến cục bộ
let scene, camera, renderer, composer;
let mainGroup; 
let clock = new THREE.Clock();
let particleSystem = []; 
let photoMeshGroup = new THREE.Group();
let handLandmarker, video;
let caneTexture; 
const debugInfo = document.getElementById('debug-info');

// Hàm khởi tạo chính
async function init() {
    initThree();             // Khởi tạo khung cảnh 3D
    setupEnvironment();      // Tạo môi trường ánh sáng
    setupLights();           // Thiết lập đèn
    createTextures();        // Tạo vật liệu/texture kẹo gậy
    createParticles();       // Tạo các hạt của cây thông
    createDust();            // Tạo các hạt bụi
    loadPredefinedImages();  // Tải ảnh mặc định
    setupPostProcessing();   // Khởi tạo hiệu ứng xử lý hình ảnh (glow/bloom)
    setupEvents();           // Gán sự kiện (resize, upload...)
    await initMediaPipe();   // Khởi tạo nhận diện bàn tay AI
    
    // Ẩn hiệu ứng loading sau khi load xong
    const loader = document.getElementById('loader');
    loader.style.opacity = 0;
    setTimeout(() => loader.remove(), 800);

    animate(); // Bắt đầu vòng lặp render
}

// --- HỆ THỐNG LOAD ẢNH ĐA ĐỊNH DẠNG ---
function loadPredefinedImages() {
    const loader = new THREE.TextureLoader();
    
    // 1. Tải ảnh từ các đường dẫn mạng
    CONFIG.preload.images.forEach(url => {
        loader.load(url, 
            (t) => { t.colorSpace = THREE.SRGBColorSpace; addPhotoToScene(t); },
            undefined,
            (e) => { console.log(`Skipped: ${url}`); }
        );
    });

    // 2. Thử tải ảnh từ thư mục local ./images/
    if (CONFIG.preload.autoScanLocal) {
        for (let i = 1; i <= CONFIG.preload.scanCount; i++) {
            CONFIG.preload.extensions.forEach(ext => {
                const path = `./images/${i}.${ext}`;
                loader.load(path, 
                    (t) => { 
                        t.colorSpace = THREE.SRGBColorSpace; 
                        addPhotoToScene(t); 
                        console.log(`Loaded: ${path}`);
                    },
                    undefined,
                    (err) => { /* Bỏ qua nếu không tìm thấy file */ } 
                );
            });
        }
    }
}

// Hàm khởi tạo không gian Three.js
function initThree() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colors.bg); // Đặt nền đen
    scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.01); // Thêm sương mù mờ dần vào nền

    // Thiết lập Camera
    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, CONFIG.camera.z); 

    // Thiết lập Bộ dựng hình (Renderer)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping; 
    renderer.toneMappingExposure = 2.2; 
    container.appendChild(renderer.domElement);

    // Group chính chứa toàn bộ cây
    mainGroup = new THREE.Group();
    scene.add(mainGroup);
}

// Tạo môi trường ánh sáng phản chiếu
function setupEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
}

// Khởi tạo các loại đèn chiếu sáng
function setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6); // Ánh sáng môi trường
    scene.add(ambient);

    const innerLight = new THREE.PointLight(0xffaa00, 2, 20); // Đèn phát sáng giữa cây thông
    innerLight.position.set(0, 5, 0);
    mainGroup.add(innerLight);

    const spotGold = new THREE.SpotLight(0xffcc66, 1200); // Đèn chiếu vàng
    spotGold.position.set(30, 40, 40);
    spotGold.angle = 0.5;
    spotGold.penumbra = 0.5;
    scene.add(spotGold);

    const spotBlue = new THREE.SpotLight(0x6688ff, 600); // Đèn chiếu xanh
    spotBlue.position.set(-30, 20, -30);
    scene.add(spotBlue);
    
    const fill = new THREE.DirectionalLight(0xffeebb, 0.8);
    fill.position.set(0, 0, 50);
    scene.add(fill);
}

// Xử lý hậu kỳ, thêm hiệu ứng Bloom (phát sáng rực rỡ)
function setupPostProcessing() {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.7; // Ngưỡng ánh sáng để bắt đầu phát sáng
    bloomPass.strength = 0.45; // Độ mạnh của hiệu ứng phát sáng
    bloomPass.radius = 0.4;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
}

// Vẽ họa tiết sọc đỏ cho kẹo gậy
function createTextures() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,128,128);
    ctx.fillStyle = '#880000'; 
    ctx.beginPath();
    for(let i=-128; i<256; i+=32) {
        ctx.moveTo(i, 0); ctx.lineTo(i+32, 128); ctx.lineTo(i+16, 128); ctx.lineTo(i-16, 0);
    }
    ctx.fill();
    caneTexture = new THREE.CanvasTexture(canvas);
    caneTexture.wrapS = THREE.RepeatWrapping;
    caneTexture.wrapT = THREE.RepeatWrapping;
    caneTexture.repeat.set(3, 3);
}

// Định nghĩa Lớp Particle cho mỗi hạt của cây thông
class Particle {
    constructor(mesh, type, isDust = false) {
        this.mesh = mesh;
        this.type = type;
        this.isDust = isDust;
        
        this.posTree = new THREE.Vector3();    // Vị trí khi xếp thành cây
        this.posScatter = new THREE.Vector3(); // Vị trí khi bung ra (tinh vân)
        this.baseScale = mesh.scale.x; 

        // Tốc độ xoay ngẫu nhiên
        const speedMult = (type === 'PHOTO') ? 0.3 : 2.0;
        this.spinSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * speedMult,
            (Math.random() - 0.5) * speedMult,
            (Math.random() - 0.5) * speedMult
        );

        this.calculatePositions();
    }

    // Tính toán tọa độ hạt
    calculatePositions() {
        // Nếu là khung ảnh, tạo vị trí bay lơ lửng ngẫu nhiên
        if (this.type === 'PHOTO') {
            this.posTree.set(0, 0, 0); 
            const rScatter = 8 + Math.random()*12;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            this.posScatter.set(
                rScatter * Math.sin(phi) * Math.cos(theta),
                rScatter * Math.sin(phi) * Math.sin(theta),
                rScatter * Math.cos(phi)
            );
            return;
        }

        // Tính vị trí hình nón cho hạt thuộc cây thông
        const h = CONFIG.particles.treeHeight;
        const halfH = h / 2;
        let t = Math.random(); 
        t = Math.pow(t, 0.8); // Dồn hạt xuống đáy
        const y = (t * h) - halfH;
        
        let rMax = CONFIG.particles.treeRadius * (1.0 - t); 
        if (rMax < 0.5) rMax = 0.5;

        // Xoay quanh trục Y để tạo vòng xoắn
        const angle = t * 50 * Math.PI + Math.random() * Math.PI; 
        const r = rMax * (0.8 + Math.random() * 0.4); 
        this.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);

        // Vị trí bung lụa (hình cầu ngẫu nhiên)
        let rScatter = this.isDust ? (12 + Math.random()*20) : (8 + Math.random()*12);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        this.posScatter.set(
            rScatter * Math.sin(phi) * Math.cos(theta),
            rScatter * Math.sin(phi) * Math.sin(theta),
            rScatter * Math.cos(phi)
        );
    }

    // Cập nhật vị trí mỗi khung hình dựa vào trạng thái hiện tại (mode)
    update(dt, mode, focusTargetMesh) {
        let target = this.posTree;
        
        if (mode === 'SCATTER') target = this.posScatter;
        else if (mode === 'FOCUS') {
            // Nếu tay đang chụm (FOCUS) và vật này là bức ảnh được chọn
            if (this.mesh === focusTargetMesh) {
                const desiredWorldPos = new THREE.Vector3(0, 2, 35);
                const invMatrix = new THREE.Matrix4().copy(mainGroup.matrixWorld).invert();
                target = desiredWorldPos.applyMatrix4(invMatrix); // Đưa ảnh lại gần camera
            } else {
                target = this.posScatter; // Đẩy các hạt khác ra xa
            }
        }

        const lerpSpeed = (mode === 'FOCUS' && this.mesh === focusTargetMesh) ? 5.0 : 2.0; 
        this.mesh.position.lerp(target, lerpSpeed * dt); // Di chuyển mượt mà tới vị trí

        // Xử lý góc xoay của hạt
        if (mode === 'SCATTER') {
            this.mesh.rotation.x += this.spinSpeed.x * dt;
            this.mesh.rotation.y += this.spinSpeed.y * dt;
            this.mesh.rotation.z += this.spinSpeed.z * dt; 
        } else if (mode === 'TREE') {
            if (this.type === 'PHOTO') {
                this.mesh.lookAt(0, this.mesh.position.y, 0); // Quay mặt ảnh ra ngoài
                this.mesh.rotateY(Math.PI);
            } else {
                this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt);
                this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt);
                this.mesh.rotation.y += 0.5 * dt; 
            }
        }
        
        if (mode === 'FOCUS' && this.mesh === focusTargetMesh) {
            this.mesh.lookAt(camera.position); 
        }

        // Xử lý kích thước (scale) của hạt
        let s = this.baseScale;
        if (this.isDust) {
            s = this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id)); // Hiệu ứng lấp lánh
            if (mode === 'TREE') s = 0; // Ẩn hạt bụi khi gom thành cây
        } else if (mode === 'SCATTER' && this.type === 'PHOTO') {
            s = this.baseScale * 2.5; 
        } else if (mode === 'FOCUS') {
            if (this.mesh === focusTargetMesh) s = 4.5; 
            else s = this.baseScale * 0.8; 
        }
        
        this.mesh.scale.lerp(new THREE.Vector3(s,s,s), 4*dt);
    }
}

// Sắp xếp lại vị trí các bức ảnh bám theo hình cây thông
function updatePhotoLayout() {
    const photos = particleSystem.filter(p => p.type === 'PHOTO');
    const count = photos.length;
    if (count === 0) return;

    const h = CONFIG.particles.treeHeight * 0.9;
    const bottomY = -h/2;
    const stepY = h / count;
    const loops = 3;

    photos.forEach((p, i) => {
        const y = bottomY + stepY * i + stepY/2;
        const fullH = CONFIG.particles.treeHeight;
        const normalizedH = (y + fullH/2) / fullH; 

        let rMax = CONFIG.particles.treeRadius * (1.0 - normalizedH);
        if (rMax < 1.0) rMax = 1.0;
        
        const r = rMax + 3.0; // Cách một đoạn so với thân cây
        const angle = normalizedH * Math.PI * 2 * loops + (Math.PI/4); 

        p.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    });
}

// Khởi tạo mảng các hạt tạo nên cây (Hộp, Cầu vàng, Cầu đỏ, Kẹo gậy)
function createParticles() {
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32); 
    const boxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55); 
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(0.1, 0.5, 0), new THREE.Vector3(0.3, 0.4, 0)
    ]);
    const candyGeo = new THREE.TubeGeometry(curve, 16, 0.08, 8, false);

    // Vật liệu Vàng kim
    const goldMat = new THREE.MeshStandardMaterial({
        color: CONFIG.colors.champagneGold,
        metalness: 1.0, roughness: 0.1,
        envMapIntensity: 2.0, 
        emissive: 0x443300,   
        emissiveIntensity: 0.3
    });

    // Vật liệu Xanh đậm (Lá)
    const greenMat = new THREE.MeshStandardMaterial({
        color: CONFIG.colors.deepGreen,
        metalness: 0.2, roughness: 0.8,
        emissive: 0x002200,
        emissiveIntensity: 0.2 
    });

    // Vật liệu Đỏ
    const redMat = new THREE.MeshPhysicalMaterial({
        color: CONFIG.colors.accentRed,
        metalness: 0.3, roughness: 0.2, clearcoat: 1.0,
        emissive: 0x330000
    });
    
    // Vật liệu Kẹo sọc đỏ trắng
    const candyMat = new THREE.MeshStandardMaterial({ map: caneTexture, roughness: 0.4 });

    for (let i = 0; i < CONFIG.particles.count; i++) {
        const rand = Math.random();
        let mesh, type;
        
        // Tỷ lệ xuất hiện của từng loại hạt
        if (rand < 0.40) {
            mesh = new THREE.Mesh(boxGeo, greenMat);
            type = 'BOX';
        } else if (rand < 0.70) {
            mesh = new THREE.Mesh(boxGeo, goldMat);
            type = 'GOLD_BOX';
        } else if (rand < 0.92) {
            mesh = new THREE.Mesh(sphereGeo, goldMat);
            type = 'GOLD_SPHERE';
        } else if (rand < 0.97) {
            mesh = new THREE.Mesh(sphereGeo, redMat);
            type = 'RED';
        } else {
            mesh = new THREE.Mesh(candyGeo, candyMat);
            type = 'CANE';
        }

        const s = 0.4 + Math.random() * 0.5;
        mesh.scale.set(s,s,s);
        mesh.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
        
        mainGroup.add(mesh);
        particleSystem.push(new Particle(mesh, type, false));
    }

    // Tạo Ngôi sao 5 cánh trên đỉnh cây
    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.5;
    const innerRadius = 0.7; 
    
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points + Math.PI / 2;
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) starShape.moveTo(x, y);
        else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starGeo = new THREE.ExtrudeGeometry(starShape, {
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 2
    });
    starGeo.center(); 

    const starMat = new THREE.MeshStandardMaterial({
        color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 1.0,
        metalness: 1.0, roughness: 0
    });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, CONFIG.particles.treeHeight/2 + 1.2, 0); // Đặt lên chóp cây
    mainGroup.add(star);
    
    mainGroup.add(photoMeshGroup);
}

// Khởi tạo các hạt bụi li ti lấp lánh xung quanh
function createDust() {
    const geo = new THREE.TetrahedronGeometry(0.08, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.8 });
    
    for(let i=0; i<CONFIG.particles.dustCount; i++) {
         const mesh = new THREE.Mesh(geo, mat);
         mesh.scale.setScalar(0.5 + Math.random());
         mainGroup.add(mesh);
         particleSystem.push(new Particle(mesh, 'DUST', true));
    }
}

// Chèn 1 bức ảnh vào không gian 3D, thêm viền vàng
function addPhotoToScene(texture) {
    const frameGeo = new THREE.BoxGeometry(1.4, 1.4, 0.05);
    const frameMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.champagneGold, metalness: 1.0, roughness: 0.1 });
    const frame = new THREE.Mesh(frameGeo, frameMat); // Viền bức ảnh

    let width = 1.2;
    let height = 1.2;
    
    // Tính toán tỷ lệ ảnh cho khung
    if (texture.image) {
        const aspect = texture.image.width / texture.image.height;
        if (aspect > 1) {
            height = width / aspect;
        } else {
            width = height * aspect;
        }
    }

    const photoGeo = new THREE.PlaneGeometry(width, height);
    const photoMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const photo = new THREE.Mesh(photoGeo, photoMat); // Lớp ảnh
    photo.position.z = 0.04; // Để ảnh nhô lên khỏi khung vàng

    const group = new THREE.Group();
    group.add(frame);
    group.add(photo);
    
    frame.scale.set(width/1.2, height/1.2, 1);
    const s = 0.8;
    group.scale.set(s,s,s);
    
    photoMeshGroup.add(group);
    particleSystem.push(new Particle(group, 'PHOTO', false)); // Đưa vào mảng quản lý hạt

    updatePhotoLayout(); // Sắp xếp lại ảnh trên thân cây
}

// Xử lý sự kiện upload hình ảnh từ người dùng
function handleImageUpload(e) {
    const files = e.target.files;
    if(!files.length) return;
    
    Array.from(files).forEach(f => {
        if (!f.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            new THREE.TextureLoader().load(ev.target.result, (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                addPhotoToScene(t); // Nhét vào cây 3D
            });
        }
        reader.readAsDataURL(f);
    });
}

// --- MEDIAPIPE (AI NHẬN DIỆN BÀN TAY) ---
async function initMediaPipe() {
    video = document.getElementById('webcam');
    
    const constraints = {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        }
    };

    // Tải mô hình nhận diện tay
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1 // Chỉ quét 1 bàn tay
    });
    
    // Xin quyền truy cập webcam
    if (navigator.mediaDevices?.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
            debugInfo.innerText = "Webcam active. Show hand.";
        } catch(e) {
            console.warn("Webcam access denied or not available", e);
            debugInfo.innerText = "Camera error: " + e.message;
            document.getElementById('webcam-wrapper').style.display = 'none';
        }
    }
}

// Hàm dự đoán khung hình từ webcam
let lastVideoTime = -1;
async function predictWebcam() {
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        if (handLandmarker) {
            const result = handLandmarker.detectForVideo(video, performance.now());
            processGestures(result); // Trích xuất cử chỉ
        }
    }
    requestAnimationFrame(predictWebcam); // Loop
}

// Xử lý tọa độ các ngón tay để biết cử chỉ (Xòe, Nắm, Chụm)
function processGestures(result) {
    if (result.landmarks && result.landmarks.length > 0) {
        STATE.hand.detected = true;
        const lm = result.landmarks[0];
        // Lưu tọa độ lòng bàn tay
        STATE.hand.x = (lm[9].x - 0.5) * 2; 
        STATE.hand.y = (lm[9].y - 0.5) * 2;

        const thumb = lm[4]; // Đầu ngón cái
        const index = lm[8]; // Đầu ngón trỏ
        const wrist = lm[0]; // Cổ tay
        const middleMCP = lm[9]; // Gốc ngón giữa

        // Tính toán kích thước bàn tay
        const handSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);
        if (handSize < 0.02) return;

        // Tính độ mở của các ngón tay
        const tips = [lm[8], lm[12], lm[16], lm[20]];
        let avgTipDist = 0;
        tips.forEach(t => avgTipDist += Math.hypot(t.x - wrist.x, t.y - wrist.y));
        avgTipDist /= 4;

        // Tính độ hở giữa ngón trỏ và ngón cái (Pinched)
        const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);

        const extensionRatio = avgTipDist / handSize;
        const pinchRatio = pinchDist / handSize;

        debugInfo.innerText = `Size: ${handSize.toFixed(2)} | Ext: ${extensionRatio.toFixed(2)} | Pinch: ${pinchRatio.toFixed(2)} | Mode: ${STATE.mode}`;

        // LOGIC CHUYỂN TRẠNG THÁI (MODE)
        if (extensionRatio < 1.5) {
            // Nắm tay (Fist) -> Gom lại thành Cây thông
            STATE.mode = 'TREE';
            STATE.focusTarget = null;
        } else if (pinchRatio < 0.35) {
            // Chụm ngón cái và ngón trỏ -> Chọn và Xem 1 bức ảnh
            if (STATE.mode !== 'FOCUS') {
                STATE.mode = 'FOCUS';
                const photos = particleSystem.filter(p => p.type === 'PHOTO');
                if (photos.length) STATE.focusTarget = photos[Math.floor(Math.random()*photos.length)].mesh; // Random 1 bức ảnh
            }
        } else if (extensionRatio > 1.7) {
            // Xòe tay (Open palm) -> Bung lụa (Tinh vân)
            STATE.mode = 'SCATTER';
            STATE.focusTarget = null;
        }
    } else {
        STATE.hand.detected = false;
        debugInfo.innerText = "No hand detected";
    }
}

// Bắt các sự kiện cơ bản
function setupEvents() {
    // Reponsive cho Canvas khi thay đổi kích cỡ cửa sổ
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Nút Upload
    document.getElementById('file-input').addEventListener('change', handleImageUpload);
    document.getElementById('folder-input').addEventListener('change', handleImageUpload);
    
    // Nhấn phím H để ẩn toàn bộ UI (Chụp ảnh/Quay video màn hình)
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'h') {
            const controls = document.querySelector('.controls-wrapper');
            if (controls) controls.classList.toggle('ui-hidden');
            const webcam = document.getElementById('webcam-wrapper');
            if(webcam) webcam.classList.toggle('ui-hidden');
        }
    });
}

// Vòng lặp Render (Chạy khoảng 60 lần 1 giây)
function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta(); // Thời gian trôi qua giữa 2 khung hình

    // Xử lý xoay theo tay (khi đang vỡ vụn SCATTER)
    if (STATE.mode === 'SCATTER' && STATE.hand.detected) {
        const targetRotY = STATE.hand.x * Math.PI * 0.9; 
        const targetRotX = STATE.hand.y * Math.PI * 0.25;
        STATE.rotation.y += (targetRotY - STATE.rotation.y) * 3.0 * dt;
        STATE.rotation.x += (targetRotX - STATE.rotation.x) * 3.0 * dt;
    } else {
        if(STATE.mode === 'TREE') {
            STATE.rotation.y += 0.3 * dt; // Cây tự động quay đều quanh trục Y
            STATE.rotation.x += (0 - STATE.rotation.x) * 2.0 * dt; // Đưa trục X về thẳng đứng
        } else {
            STATE.rotation.y += 0.1 * dt; 
        }
    }

    mainGroup.rotation.y = STATE.rotation.y;
    mainGroup.rotation.x = STATE.rotation.x;

    // Cập nhật vị trí của toàn bộ các hạt
    particleSystem.forEach(p => p.update(dt, STATE.mode, STATE.focusTarget));
    
    // Render khung cảnh
    composer.render();
}

// Khởi động chương trình
init();
