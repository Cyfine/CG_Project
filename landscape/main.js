"use strict";


var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    green: 0x24942c,
};

//==================== scene control ==========================
var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
    renderer, container, controls, enemiesHolder, weather;
//==================== landscape control ==========================
let chunkSize = 500;
let chunkSegments = 25;
let landHeight = 300;
let treeGenerate = 0.04;
let seed = 0;
let samplingScale = 1;
let loadDistance = 3;
let destructionDist = 6;
let chunkLoader;

const textureLoader = new THREE.TextureLoader();
const waterBaseColor = textureLoader.load("./textures/water/Water_002_COLOR.jpg");
const waterNormalMap = textureLoader.load("./textures/water/Water_002_NORM.jpg");
const waterHeightMap = textureLoader.load("./textures/water/Water_002_DISP.png");
const waterRoughness = textureLoader.load("./textures/water/Water_002_ROUGH.jpg");
const waterAmbientOcclusion = textureLoader.load("./textures/water/Water_002_OCC.jpg");


let waterMaterial = new THREE.MeshStandardMaterial({
    map: waterBaseColor,
    normalMap: waterNormalMap,
    displacementMap: waterHeightMap, displacementScale: 0.01,
    roughnessMap: waterRoughness, roughness: 0,
    aoMap: waterAmbientOcclusion
});

//==================== airplane control ==========================
let airPlane;
const clock = new THREE.Clock();
const keyboard = new THREEx.KeyboardState();


const tick = () => {
    const delta = clock.getDelta();
    const moveDistance = 5 * delta;
    const rotateAngle = Math.PI / 2 * delta;

    if (keyboard.pressed("down"))
        airPlane.translateZ(moveDistance);
    if (keyboard.pressed("up"))
        airPlane.translateZ(-moveDistance);
    if (keyboard.pressed("left"))
        airPlane.translateX(-moveDistance);
    if (keyboard.pressed("right"))
        airPlane.translateX(moveDistance);

    if (keyboard.pressed("w"))
        airPlane.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
    if (keyboard.pressed("s"))
        airPlane.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);
    if (keyboard.pressed("a"))
        airPlane.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    if (keyboard.pressed("d"))
        airPlane.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);

    const relativeCameraOffset = new THREE.Vector3(0, 5, 10);

    const cameraOffset = relativeCameraOffset.applyMatrix4(airPlane.matrixWorld);

    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    controls.target = airPlane.position;

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}


window.addEventListener('load', init, false);

function init() {

    createScene();
    noise.seed(Math.random());
    addHelpers();
    createLights();
    createWeather();
    // testChunk();
    createAirPlane();
    chunkLoader = new ChunkLoader(loadDistance);

    // let test = new BoxTree(Colors.red).mesh;

    // y: x axis direction
    //
    // test.lookAt(new THREE.Vector3(0, -100, 0))
    // scene.add(test)

    document.addEventListener('mousemove', handleMousemove, false);

    loop();
}


function addHelpers() {
    var axesHelper = new THREE.AxesHelper(5000);
    scene.add(axesHelper);
}

function createScene() {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    scene.fog = new THREE.Fog(0xF5986E, 100, 1500);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 100;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // camera = new THREE.OrthographicCamera(-WIDTH/2, WIDTH/2, HEIGHT/2, -HEIGHT/2, 1000, 1000)

    // Set the position of the camera
    camera.position.x = -100;
    camera.position.z = 100;
    camera.position.y = 400;

    camera.rotateY(-Math.PI * 0.5);
    camera.rotateX(-Math.PI * 0.3);
    //camera.rotateZ(Math.PI * 0.4);

    // Create the renderer
    renderer = new THREE.WebGLRenderer({
        // Allow transparency to show the gradient background
        // we defined in the CSS
        alpha: true,

        // Activate the anti-aliasing; this is less performant,
        // but, as our project is low-poly based, it should be fine :)
        antialias: true
    });

    // Define the size of the renderer; in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the
    // container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // controls = new THREE.TrackballControls(camera);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Listen to the screen: if the user resizes it
    // we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}


let hemisphereLight, shadowLight;

function createLights() {
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color,
    // the third parameter is the intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

    // A directional light shines from a specific direction.
    // It acts like the sun, that means that all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);

    scene.add(shadowLight);
}

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

var mousePos = {x: 0, y: 0}

function handleMousemove(event) {
    let normalizedX = -1 + (event.clientX / WIDTH) * 2;
    let normalizedY = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {x: normalizedX, y: normalizedY};
}


let BoxTree = function (color) {
    this.mesh = new THREE.Object3D();
    let leaf = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: .7,
        flatShading: true
    });
    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true
    });
    let geo = new THREE.BoxGeometry(100, 350, 100);
    let m = new THREE.Mesh(geo, leaf);
    m.position.y = 170;
    this.mesh.add(m);

    let geoS = new THREE.BoxGeometry(35, 35, 200);
    let s = new THREE.Mesh(geoS, stunk);
    s.rotation.x = Math.PI / 2;
    this.mesh.add(s);
}

let ConeTree = function (color) {
    this.mesh = new THREE.Object3D();
    let leaf = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: .7,
        flatShading: true
    });
    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true,
    });
    let geo = new THREE.ConeGeometry(100, 350, 4);
    let m = new THREE.Mesh(geo, leaf);
    m.position.y = 170;
    this.mesh.add(m);
    let geoS = new THREE.BoxGeometry(35, 35, 200);
    let s = new THREE.Mesh(geoS, stunk);
    s.rotation.x = Math.PI / 2;
    this.mesh.add(s);
}

let ThreeConesTree = function (color) {
    this.mesh = new THREE.Object3D();
    let leaf = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: .7,
        flatShading: true
    });

    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true
    });

    for (let i = 0; i < 3; i++) {
        let geo = new THREE.ConeGeometry(200 - i * 60, 200 - i * 50, 4);
        let m = new THREE.Mesh(geo, leaf);
        m.position.y = 150 + 200 * i * 0.9 - i * 90;
        this.mesh.add(m);
    }

    let geoS = new THREE.BoxGeometry(35, 35, 200);
    let s = new THREE.Mesh(geoS, stunk);
    s.rotation.x = Math.PI / 2;
    this.mesh.add(s);
}

let FiveConesTree = function (color) {
    this.mesh = new THREE.Object3D();
    let leaf = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: .7,
        flatShading: true
    });

    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true
    });

    for (let i = 0; i < 5; i++) {
        let geo = new THREE.ConeGeometry(200 - i * 30, 200 - i * 20, 4);
        let m = new THREE.Mesh(geo, leaf);
        m.position.y = 150 + 200 * i * 0.9 - i * 90;
        this.mesh.add(m);
    }

    let geoS = new THREE.BoxGeometry(35, 35, 200);
    let s = new THREE.Mesh(geoS, stunk);
    s.rotation.x = Math.PI / 2;
    this.mesh.add(s);
}


function updateAirPlaneControl() {
    const delta = clock.getDelta() + 0.01;
    const moveDistance = 30 * delta;
    const rotateAngle = Math.PI / 2 * delta;
    airPlane.updatePropeller();
    airPlane.mesh.translateZ(-moveDistance);

    // airPlane.mesh.rotateY(Math.PI/2);
    if (keyboard.pressed("down")) {
        airPlane.mesh.translateZ(moveDistance);
    }
    if (keyboard.pressed("up")) {
        airPlane.mesh.translateZ(-moveDistance);
    }
    if (keyboard.pressed("left")) {
        airPlane.mesh.translateX(-moveDistance);
    }
    if (keyboard.pressed("right")) {
        airPlane.mesh.translateX(moveDistance);
    }

    if (keyboard.pressed("w"))
        airPlane.mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
    if (keyboard.pressed("s"))
        airPlane.mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);
    if (keyboard.pressed("a"))
        airPlane.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    if (keyboard.pressed("d"))
        airPlane.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);

    const relativeCameraOffset = new THREE.Vector3(0, 50, 200);


    // const rotationMat = new THREE.Matrix4();
    // rotationMat.set(
    //     Math.cos(Math.PI/2), 0, -Math.sin(Math.PI/2), 0,
    //     0, 1, 0, 0,
    //     Math.sin(Math.PI/2), 0, Math.cos(Math.PI/2), 0,
    //     0, 0, 0, 1
    // );


    const cameraOffset = relativeCameraOffset.applyMatrix4(airPlane.mesh.matrixWorld);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    controls.target = airPlane.mesh.position;

}

function createWeather(){
    weather = new Weather();
}

let sinBuffer;
function loop() {
    controls.update();

    // render the scene
    updateAirPlaneControl();

    //<------------------season update------------------>
    let currentSin = Math.sin((clock.getElapsedTime()/4));
    if(currentSin*sinBuffer<0) { //indicate a sign change, corresponding to season change
        weather.switchSeason();
    }
    weather.moveParticles();
    sinBuffer = Math.sin((clock.getElapsedTime()/4));
    //<------------------season update------------------>

    chunkLoader.generateChunk();
    //makeRoughGround(waterMesh);

    //testChunkInst.updateWaterSurface()

    renderer.render(scene, camera);

    // call the loop function again
    // testChunkInst.water.geometry.attributes.position.needsUpdate = true;
    requestAnimationFrame(loop);
}

let testChunkInst ;
function testChunk() {
    let chunk = new Chunk(0, 0, 1000, 0, 60, 5, 100, 0.02);
    scene.add(chunk.mesh);
    let chunk1 = new Chunk(-1, 0, 1000, 0, 60, 5, 100, 0.02);
    scene.add(chunk1.mesh) ;
    testChunkInst = chunk;
    // chunk.destroy();
}


class ChunkLoader {
    constructor(loadDistance = 1, destroyDistance = 5) {
        this.loadDistance = loadDistance;
        this.chunks = {};
        this.lastVisitChunk = [NaN, NaN];

    }

    getCurrentChunk() {
        let cx = Math.round(camera.position.x / chunkSize);
        let cz = Math.round(camera.position.z / chunkSize);
        return [cx, cz];
    }

    // call in animation loop
    generateChunk() {
        let currentChunk = this.getCurrentChunk();

        for (const [key, chunk] of Object.entries(this.chunks)) {
            if (this.dist(chunk.x, chunk.z, currentChunk[0], currentChunk[1]) > destructionDist) {
                delete this.chunks[key];
                chunk.destroy();
            }
            // else{
            //     chunk.updateWaterSurface();
            // }
        }

        if (this.key(currentChunk[0], currentChunk[1]) === this.key(this.lastVisitChunk[0], this.lastVisitChunk[1])) {
            return;
        }


        let cx = currentChunk[0];
        let cz = currentChunk[1];

        let cnt = 0;
        // NE
        for (let i = 0; i < this.loadDistance + 1; i++) {
            for (let j = 0; j < this.loadDistance + 1; j++) {
                let chunk = this.chunks[this.key(cx + i, cz + j)];
                if (chunk === undefined) {
                    chunk = new Chunk(cx + i, cz + j, chunkSize, seed, chunkSegments, samplingScale, landHeight, treeGenerate);
                    this.chunks[this.key(cx + i, cz + j)] = chunk;
                    scene.add(chunk.mesh);
                    cnt++;
                }
            }
        }

        // SE
        for (let i = 0; i < this.loadDistance + 1; i++) {
            for (let j = 1; j <= this.loadDistance; j++) {
                let chunk = this.chunks[this.key(cx + i, cz - j)];
                if (chunk === undefined) {
                    chunk = new Chunk(cx + i, cz - j, chunkSize, seed, chunkSegments, samplingScale, landHeight, treeGenerate);
                    this.chunks[this.key(cx + i, cz - j)] = chunk;
                    scene.add(chunk.mesh);
                    cnt++;
                }
            }
        }

        //NW
        for (let i = 1; i <= this.loadDistance; i++) {
            for (let j = 0; j < this.loadDistance + 1; j++) {
                let chunk = this.chunks[this.key(cx - i, cz + j)];
                if (chunk === undefined) {
                    chunk = new Chunk(cx - i, cz + j, chunkSize, seed, chunkSegments, samplingScale, landHeight, treeGenerate);
                    this.chunks[this.key(cx - i, cz + j)] = chunk;
                    scene.add(chunk.mesh);
                    cnt++;
                }
            }
        }

        //SW
        for (let i = 1; i <= this.loadDistance; i++) {
            for (let j = 1; j <= this.loadDistance; j++) {
                let chunk = this.chunks[this.key(cx - i, cz - j)]
                if (chunk === undefined) {
                    let chunk = new Chunk(cx - i, cz - j, chunkSize, seed, chunkSegments, samplingScale, landHeight, treeGenerate);
                    this.chunks[this.key(cx - i, cz - j)] = chunk;
                    scene.add(chunk.mesh);
                    cnt++;
                }
            }
        }

        console.log(cnt)


        this.lastVisitChunk = currentChunk;
    }


    dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }


    key(x, z) {
        return "" + x + "," + z;
    }


    setChunk(x, z, chunk) {
        const key = "" + x + "," + z;
        this.chunks[key] = chunk;
    }

    getChunk(x, z) {
        const key = "" + x + "," + z;
        return this.chunks[key];
    }


}

/**
 * class attributes:
 * x, y: the chunk coordinate (not world)
 * size: the chunk size
 * seed: the seed for perlin noise
 * amplify: multiplied to perlin noise, control mountain fluctuation
 * segments: how density of triangle
 * samplingScale: scale for mapping the plane vertex coordinate to 2d perlin noise space for sampling
 * terrain: the plane buffer mesh
 */
class Chunk {
    //x and y is chunk coordinate, the chunk coordinate multiply the size is the world coordinate
    constructor(x = 0, z = 0, size = 1000, seed = 0, segments = 100, samplingScale = 5,
                amplify = 100, treeGenerateProbability, showMesh) {
        // sampling from the noise space, and define the terrain plane
        console.log("Generate Chunk: " + x + ", " + z);
        this.mesh = new THREE.Object3D();
        this.x = x;
        this.z = z;
        this.size = size;
        this.seed = seed;
        this.amplify = amplify;
        this.segments = segments;
        this.samplingScale = samplingScale;
        this.perlin = [];
        this.treeGenerateProbability = treeGenerateProbability;
        // this.waterHeight = -amplify / 2;
        this.waterHeight = -20;


        this.waterDamping = 20;

        this.createTerrain(false);
        this.decorateTree();
        // this.createWater2();
        this.createWater();
    }


    createTerrain(showMesh = false) {
        const plane = new THREE.PlaneBufferGeometry(this.size, this.size, this.segments, this.segments);
        let material = new THREE.MeshLambertMaterial({color: 0x0DAC05, side: THREE.DoubleSide});
        const planeMesh = new THREE.Mesh(plane, material);
        planeMesh.receiveShadow = true;

        const xTranslation = this.x * this.size + this.size / 2;
        const zTranslation = this.z * this.size + this.size / 2;
        planeMesh.position.x = xTranslation;
        planeMesh.position.z = zTranslation;


        for (let i = 0, l = plane.attributes.position.count; i < l; i++) {
            const vx = plane.attributes.position.getX(i) + xTranslation;
            const vy = plane.attributes.position.getY(i) + zTranslation;
            noise.seed(this.seed);
            const vz = noise.perlin2(this.samplingScale * vx / this.size + 0.5, this.samplingScale * vy / this.size + 0.5);
            const vz2 = noise.perlin2(this.samplingScale * vx / this.size + 0.5, this.samplingScale * vy / this.size + 0.5);
            const height = (vz + vz2) * this.amplify;
            plane.attributes.position.setZ(i, height);
            this.perlin.push(vz + vz2);
        }
        this.mesh.add(planeMesh);
        //directly apply rotation to the object vertex
        plane.rotateX(Math.PI / 2)
        plane.computeVertexNormals();
        plane.attributes.position.needsUpdate = true;
        this.terrain = planeMesh;


        if (showMesh) {
            const wireframe = new THREE.WireframeGeometry(plane);
            const line = new THREE.LineSegments(wireframe);
            line.material.depthTest = false;
            line.material.opacity = 1;
            line.material.transparent = true;
            // line.material.color = 0x000000;
            line.rotation.x = -Math.PI / 2;
            this.mesh.add(line);
        }


    }


    decorateTree() {
        let treeAmt = 0;
        for (let i = 0; i < this.terrain.geometry.attributes.position.count; i++) {
            const vy = this.terrain.geometry.attributes.position.getY(i);

            if (vy < this.waterHeight + 30) {
                continue;
            }
            if (probability(this.treeGenerateProbability)) {
                treeAmt += 3;
            }
            if (treeAmt > 0) {
                treeAmt -= 1;
                const vx = this.terrain.geometry.attributes.position.getX(i);
                const vz = this.terrain.geometry.attributes.position.getZ(i);


                const nx = this.terrain.geometry.attributes.normal.getX(i);
                const ny = this.terrain.geometry.attributes.normal.getY(i);
                const nz = this.terrain.geometry.attributes.normal.getZ(i);

                let normal = new THREE.Vector3(nx, ny, nz)
                // let pos = new THREE.Vector3(vx, vy, vz);
                // console.log(normal)
                // console.log(pos)

                // let rotationMat = new THREE.Matrix3;


                const score = mapVal(this.perlin[i], -1, 1, 0, 1);
                let distributionIdx = fallInRange(score, [2, 1, 1, 1]) || 0
                let treeDistribution = [
                    [8, 1, 3, 2],
                    [1, 8, 3, 2],
                    [2, 1, 3, 8],
                    [1, 1, 8, 2],
                ];
                // console.log(distributionIdx);
                let treeTypeIdx = drawTypeFromDistribution(treeDistribution[distributionIdx]);
                let types = ["BoxTree", "ConeTree", "ThreeConesTree", "FiveConesTree"];

                let color = Colors.green;
                // let size = Math.max(Math.random() * 0.007, 0.3);
                let size = 0.06 + mapVal(Math.random(), 0, 1, -0.008, 0.008);
                let type = types[treeTypeIdx]
                let tree = treeFactory(type, Colors.green);

                tree.mesh.position.y = vy;
                tree.mesh.position.x = vx + (this.x * this.size + this.size / 2);
                tree.mesh.position.z = vz + (this.z * this.size + this.size / 2);


                tree.color = color;
                tree.mesh.scale.set(size, size, size);
                tree.type = type;
                tree.mesh.position.y += 150 * size;

                //combination of the surface normal and a vertical vector is the direction of the tree
                //let look = tree.mesh.localToWorld(new THREE.Vector3(-100 * nx, 100 * nz, 100 * Math.abs(ny - 5)));
                // console.log(normal)
                //tree.mesh.lookAt(look);
                //tree.mesh.lookAt(normal);
                tree.mesh.rotation.x = -nz/2;
                tree.mesh.rotation.z = nx/2;
                this.mesh.add(tree.mesh);

            }


        }
    }


    createWaterXXX() {
        const plane = new THREE.PlaneBufferGeometry(this.size, this.size, this.segments / 2, this.segments / 2);
        let water = new THREE.Water(plane, {
            color: '#ffffff',
            scale: 1,
            flowDirection: new THREE.Vector2(1, 1),
            // textureWidth:1024,
            // textureHeight:1024,
        });

        water.rotation.x = -0.5 * Math.PI;
        const xTranslation = this.x * this.size + this.size / 2;
        const zTranslation = this.z * this.size + this.size / 2;
        water.position.x = xTranslation;
        water.position.z = zTranslation;
        water.position.y = -10
        this.mesh.add(water);
    }


    createWater() {
        const plane = new THREE.PlaneGeometry(this.size, this.size, this.segments / 4, this.segments / 4);
        let material = new THREE.MeshLambertMaterial({
            color: 0x197FF,
            side: THREE.DoubleSide,
            shininess: 60,
            opacity: 0.5
        });
        let waterMesh = new THREE.Mesh(plane, material);
        waterMesh.receiveShadow = true;
        plane.rotateX(-Math.PI / 2)
        const xTranslation = this.x * this.size + this.size / 2;
        const zTranslation = this.z * this.size + this.size / 2;

        waterMesh.position.x = xTranslation;
        waterMesh.position.z = zTranslation;
        waterMesh.position.y = this.waterHeight;
        this.water = waterMesh;
        this.mesh.add(waterMesh)
    }

    createWater2() {
        // const textureLoader = new THREE.TextureLoader();

        // const waterBaseColor = textureLoader.load("./textures/water/Water_002_COLOR.jpg");
        // const waterNormalMap = textureLoader.load("./textures/water/Water_002_NORM.jpg");
        // const waterHeightMap = textureLoader.load("./textures/water/Water_002_DISP.png");
        // const waterRoughness = textureLoader.load("./textures/water/Water_002_ROUGH.jpg");
        // const waterAmbientOcclusion = textureLoader.load("./textures/water/Water_002_OCC.jpg");
        //
        //
        // let material = new THREE.MeshStandardMaterial({
        //         map: waterBaseColor,
        //         normalMap: waterNormalMap,
        //         displacementMap: waterHeightMap, displacementScale: 0.01,
        //         roughnessMap: waterRoughness, roughness: 0,
        //         aoMap: waterAmbientOcclusion
        //     });
        const plane = new THREE.PlaneBufferGeometry(this.size, this.size, this.segments / 4, this.segments / 4);


        let waterMesh = new THREE.Mesh(plane, waterMaterial);
        plane.rotateX(-Math.PI / 2)
        const xTranslation = this.x * this.size + this.size / 2;
        const zTranslation = this.z * this.size + this.size / 2;

        waterMesh.position.x = xTranslation;
        waterMesh.position.z = zTranslation;
        waterMesh.position.y = this.waterHeight;
        this.water = waterMesh;
        this.mesh.add(waterMesh)
    }

    updateWaterSurface() {
        const now_slow = Date.now() / 400;
        for (let i = 0; i < this.water.geometry.attributes.position.count; i++) {

            const y = this.water.geometry.attributes.position.getY(i);
            const x = this.water.geometry.attributes.position.getX(i);
            // const vz = this.water.geometry.attributes.position.getZ(i);

            const xangle = x + now_slow
            const xsin = Math.sin(xangle) * this.waterDamping;
            const yangle = y + now_slow
            const ycos = Math.cos(yangle) * this.waterDamping;


            this.water.geometry.attributes.position.setZ(i, xsin + ycos);

        }
        this.water.geometry.computeVertexNormals();
        this.water.geometry.attributes.position.needsUpdate = true;
        //this.water.geometry.verticesNeedUpdate = true;
    }


    // remove the chunk and destroy all its geometries
    destroy() {
        console.log("Destroy chunk: " + this.x + "," + this.z)
        scene.remove(this.mesh)
        this.mesh.traverse((obj) => {
            if (obj && obj.geometry && obj.material) {
                obj.geometry.dispose();
                obj.material.dispose();
            }
        })

    }


}


function treeFactory(type, color) {
    switch (type) {
        case "BoxTree":
            return new BoxTree(color);
        case "ConeTree":
            return new ConeTree(color);
        case "ThreeConesTree":
            return new ThreeConesTree(color);
        case "FiveConesTree":
            return new FiveConesTree(color);
    }
}

function createAirPlane() {
    airPlane = new AirPlane();
    airPlane.mesh.rotation.y = Math.PI / 2;
    airPlane.mesh.position.y = 180;
    airPlane.mesh.scale.set(.25, .25, .25);
    scene.add(airPlane.mesh);
}


class AirPlane {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.mesh.name = "airPlane";

        // Cabin

        var geomCabin = new THREE.BoxGeometry(50, 50, 80, 1, 1, 1);
        var matCabin = new THREE.MeshPhongMaterial({color: Colors.blue, flatShading: true});


        var cabin = new THREE.Mesh(geomCabin, matCabin);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        this.mesh.add(cabin);


        // Engine

        var geomEngine = new THREE.BoxGeometry(50, 50, 20, 1, 1, 1);
        var matEngine = new THREE.MeshPhongMaterial({color: Colors.white, flatShading: true});
        var engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.z = -50;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);

        // Tail Plane

        var geomTailPlane = new THREE.BoxGeometry(5, 20, 15, 1, 1, 1);
        var matTailPlane = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
        var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(0, 20, 40);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        // Wings

        var geomSideWing = new THREE.BoxGeometry(200, 5, 30, 1, 1, 1);
        var matSideWing = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
        var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.position.set(0, 15, 0);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);

        var geombackWing = new THREE.BoxGeometry(80, 5, 20, 1, 1, 1);
        var matbackWing = new THREE.MeshPhongMaterial({color: Colors.pink, flatShading: true});
        var backWing = new THREE.Mesh(geombackWing, matbackWing);
        backWing.position.set(0, 15, 40);
        backWing.castShadow = true;
        backWing.receiveShadow = true;
        this.mesh.add(backWing);

        var geomWindshield = new THREE.BoxGeometry(20, 15, 3, 1, 1, 1);
        var matWindshield = new THREE.MeshPhongMaterial({
            color: Colors.white,
            transparent: true,
            opacity: .3,
            flatShading: true
        });
        ;
        var windshield = new THREE.Mesh(geomWindshield, matWindshield);
        windshield.position.set(0, 27, -5);

        windshield.castShadow = true;
        windshield.receiveShadow = true;

        this.mesh.add(windshield);

        var geomPropeller = new THREE.BoxGeometry(10, 10, 20, 1, 1, 1);


        var matPropeller = new THREE.MeshPhongMaterial({color: Colors.brown, flatShading: true});
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        var geomBlade = new THREE.BoxGeometry(10, 80, 1, 1, 1, 1);
        var matBlade = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true});
        var blade1 = new THREE.Mesh(geomBlade, matBlade);
        blade1.position.set(0, 0, -8);

        blade1.castShadow = true;
        blade1.receiveShadow = true;

        var blade2 = blade1.clone();
        blade2.rotation.z = Math.PI / 2;

        blade2.castShadow = true;
        blade2.receiveShadow = true;

        this.propeller.add(blade1);
        this.propeller.add(blade2);
        this.propeller.position.set(0, 0, -60);
        this.mesh.add(this.propeller);

        var wheelProtecGeom = new THREE.BoxGeometry(10, 15, 30, 1, 1, 1);
        var wheelProtecMat = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
        var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
        wheelProtecR.position.set(25, -20, -25);
        this.mesh.add(wheelProtecR);

        var wheelTireGeom = new THREE.BoxGeometry(4, 24, 24);
        var wheelTireMat = new THREE.MeshPhongMaterial({color: Colors.brownDark, flatShading: true});
        var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
        wheelTireR.position.set(25, -28, -25);

        var wheelAxisGeom = new THREE.BoxGeometry(6, 10, 10);
        var wheelAxisMat = new THREE.MeshPhongMaterial({color: Colors.brown, flatShading: true});
        var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
        wheelTireR.add(wheelAxis);

        this.mesh.add(wheelTireR);

        var wheelProtecL = wheelProtecR.clone();
        wheelProtecL.position.x = -wheelProtecR.position.x;
        this.mesh.add(wheelProtecL);

        var wheelTireL = wheelTireR.clone();
        wheelTireL.position.x = -wheelTireR.position.x;
        this.mesh.add(wheelTireL);

        var wheelTireB = wheelTireR.clone();
        wheelTireB.scale.set(.5, .5, .5);
        wheelTireB.position.set(0, -25, 35);
        this.mesh.add(wheelTireB);

        var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
        suspensionGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10, 0))
        var suspensionMat = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true});
        var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
        suspension.position.set(0, -5, 35);
        suspension.rotation.x = -.3;
        this.mesh.add(suspension);

        // this.mesh.rotation.y = Math.PI/2;

        // this.mesh.position.applyMatrix4(rotationMat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;


    }

    updatePropeller() {
        this.propeller.rotation.z += 0.3;
    }
}

let cherryCount, rainCount, leavesCount, flakeCount, cherry, rain, leaves, snow, season, cnt=0,
    cherryGeometry, cherryMaterial, cherryMesh, cherryArray, rainGeometry, rainMaterial, rainMesh, rainArray,
    leavesGeometry, leavesMaterial, leavesMesh, leavesArray, flakeGeometry, flakeMaterial, flakeMesh, flakeArray;
const Spring = Symbol("Spring");
const Summer = Symbol("summer");
const Fall = Symbol("Fall");
const Winter = Symbol("winter");
class Weather{
    startCherry(density){
        cherryCount = density;
        cherryGeometry = new THREE.TetrahedronGeometry(1.5); // radius
        cherryMaterial = new THREE.MeshBasicMaterial({color: 0xFFC0CB});
        cherry = new THREE.Group();
        for (let i = 0; i < cherryCount; i++) {
            cherryMesh = new THREE.Mesh(cherryGeometry, cherryMaterial);
            cherryMesh.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 2000
            );
            cherry.add(cherryMesh);
        }
        scene.add(cherry);
        cherryArray = cherry.children;
    }
    updateCherry(){this.updateParticle(cherry, cherryArray);}
    endCherry(){if(cherryCount>0) cherryCount-=20; else scene.remove(cherry);}

    startRain(density){
        rainCount = density;
        rainGeometry = new THREE.TetrahedronGeometry(1.5); // radius
        rainMaterial = new THREE.MeshBasicMaterial({color: Colors.blue});
        rain = new THREE.Group();
        for (let i = 0; i < rainCount; i++) {
            rainMesh = new THREE.Mesh(rainGeometry, rainMaterial);
            rainMesh.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 2000
            );
            rain.add(rainMesh);
        }
        scene.add(rain);
        rainArray = rain.children;
    }
    updateRain(){this.updateParticle(rain, rainArray);}
    endRain(){if(rainCount>0) rainCount-=20; else scene.remove(rain);}

    startLeaves(density){
        leavesCount = density;
        leavesGeometry = new THREE.TetrahedronGeometry(1.5); // radius
        leavesMaterial = new THREE.MeshBasicMaterial({color: Colors.red,});
        leaves = new THREE.Group();
        for (let i = 0; i < leavesCount; i++) {
            leavesMesh = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leavesMesh.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 2000
            );
            leaves.add(leavesMesh);
        }
        scene.add(leaves);
        leavesArray = leaves.children;
    }
    updateLeaves(){this.updateParticle(leaves, leavesArray);}
    endLeaves(){if(leavesCount>0) leavesCount-=20; else scene.remove(leaves);}

    startSnow(density){
        flakeCount = density;
        flakeGeometry = new THREE.TetrahedronGeometry(1.5); // radius
        flakeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
        });
        snow = new THREE.Group();
        for (let i = 0; i < flakeCount; i++) {
            flakeMesh = new THREE.Mesh(flakeGeometry, flakeMaterial);
            flakeMesh.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 2000
            );
            snow.add(flakeMesh);
        }
        scene.add(snow);
        flakeArray = snow.children;
    }
    updateSnow(){this.updateParticle(snow, flakeArray);}
    endSnow(){if(flakeCount>0) flakeCount-=20; else scene.remove(snow);}

    updateParticle(particle, array){
        for (let i = 0; i < array.length / 2; i++) {
            array[i].rotation.y += 0.01;
            array[i].rotation.x += 0.02;
            array[i].rotation.z += 0.03;
            array[i].position.y -= 0.9;
            if (array[i].position.y < 0) {
                array[i].position.y += 2000;
            }
        }
        for (let i = array.length / 2; i < array.length; i++) {
            array[i].rotation.y -= 0.03;
            array[i].rotation.x -= 0.03;
            array[i].rotation.z -= 0.02;
            array[i].position.y -= 0.8;
            if (array[i].position.y < -0) {
                array[i].position.y += 2000;
            }
            particle.rotation.y -= 0.0000002;
        }
    }

    moveParticles(){
        switch (season){
            case Spring:
                this.updateCherry();
                break;
            case Summer:
                this.updateRain();
                break;
            case Fall:
                this.updateLeaves();
                break;
            case Winter:
                this.updateSnow();
                break;
        }
    }

    getSeason(){
        return season;
    }

    switchSeason(){
        if(cnt%4===0) {
            season = Spring; this.startCherry(5000); scene.remove(snow);
        }else if(cnt%4===1) {
            season = Summer; this.startRain(5000); scene.remove(cherry);
        }else if(cnt%4===2) {
            season = Fall; this.startLeaves(5000); scene.remove(rain);
        }else {
            season = Winter; this.startSnow(5000); scene.remove(leaves);
        }
        cnt++;
    }
}