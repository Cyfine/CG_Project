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

let waterMaterial, waterMesh;
// let waterMaterial = new THREE.MeshStandardMaterial({
//     map: waterBaseColor,
//     normalMap: waterNormalMap,
//     displacementMap: waterHeightMap, displacementScale: 0.01,
//     roughnessMap: waterRoughness, roughness: 0,
//     aoMap: waterAmbientOcclusion
// });

//==================== airplane control ==========================
let airPlane;
const clock = new THREE.Clock();
const keyboard = new THREEx.KeyboardState();

//==================== music ==========================
var musicFlag = true;
var backgroundSound, audioListener;
const noise0 = new SimplexNoise();


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
    //testChunk();
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
    window.addEventListener('click', handlePlayAudio, false);
}

function handlePlayAudio(){
    if(musicFlag){
        // instantiate a listener
        audioListener = new THREE.AudioListener();
        // add the listener to the camera
        camera.add(audioListener);
        // instantiate a loader
        const audioLoader = new THREE.AudioLoader();
        // instantiate audio object
        backgroundSound = new THREE.Audio(audioListener);
        // load a resource
        audioLoader.load("./music/overture.mp3", function (audioBuffer) {//callback
                // set the audio object buffer to the loaded object
                backgroundSound.setBuffer(audioBuffer);
                backgroundSound.setLoop(true);
                backgroundSound.setVolume(0.4);
                backgroundSound.play();
            },
        );
        musicFlag = false;
    }
}

function updateMusic(musicName){
    if (backgroundSound.isPlaying) backgroundSound.stop();
    // instantiate a loader
    const audioLoader = new THREE.AudioLoader();
    // instantiate audio object
    backgroundSound = new THREE.Audio(audioListener);
    // load a resource
    audioLoader.load(musicName, function (audioBuffer) {//callback
            // set the audio object buffer to the loaded object
            backgroundSound.setBuffer(audioBuffer);
            backgroundSound.setLoop(true);
            backgroundSound.setVolume(0.4);
            backgroundSound.play();
        },
    );
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

    let geoS = new THREE.BoxGeometry(35, 35, 400);
    let s = new THREE.Mesh(geoS, stunk);
    s.position.y -= 130;
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
    let geoS = new THREE.BoxGeometry(35, 35, 400);
    let s = new THREE.Mesh(geoS, stunk);
    s.position.y -= 130;
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

    let geoS = new THREE.BoxGeometry(35, 35, 400);
    let s = new THREE.Mesh(geoS, stunk);
    s.position.y -= 130;
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

    let geoS = new THREE.BoxGeometry(35, 35, 400);
    let s = new THREE.Mesh(geoS, stunk);
    s.position.y -= 130;
    s.rotation.x = Math.PI / 2;
    this.mesh.add(s);
}

let FireBall = function () {
    this.mesh = new THREE.Object3D();
    let ball = new THREE.SphereGeometry(50);
    let material = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: _fireballVS, fragmentShader: _fireballFS,
    });
    this.mesh.add(new THREE.Mesh(ball, material));
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

function createWeather() {
    weather = new Weather();
}

let sinBuffer;

function loop() {
    controls.update();

    // render the scene
    updateAirPlaneControl();

    //<------------------season update------------------>
    let currentSin = Math.sin((clock.getElapsedTime() / 4));
    if (currentSin * sinBuffer < 0) { //indicate a sign change, corresponding to season change
        weather.switchSeason();
    }
    weather.moveParticles();
    sinBuffer = Math.sin((clock.getElapsedTime() / 4));
    //<------------------season update------------------>

    chunkLoader.generateChunk();

    renderer.render(scene, camera);

    // call the loop function again
    // testChunkInst.water.geometry.attributes.position.needsUpdate = true;
    requestAnimationFrame(loop);
}

let testChunkInst;

function testChunk() {
    let chunk = new Chunk(0, 0, 1000, 0, 60, 5, 100, 0.02);
    scene.add(chunk.mesh);
    let chunk1 = new Chunk(-1, 0, 1000, 0, 60, 5, 100, 0.02);
    scene.add(chunk1.mesh);
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
            else{
                if(chunk.waterMaterial){
                    chunk.waterMaterial.uniforms.time.value += 0.01;
                }
            }
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

class EnemiesHolder {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.enemiesInUse = []
        this.enemiesPool = [];
        this.spawnWidth = 700; // same as the width of the cylinder
        this.cylinderRadius = 600; //  same as the radius of the terran cylinder
        this.sampY = 0;
        this.scale = 0.2;
    }

    spawnEnemies(color, type, size) {
        let enemy;
        for (let i = 0; i < level; i++) {
            enemy = this.GenerateEnemy(size, color, type);
            if (enemy.use === undefined) this.enemiesInUse.push(enemy);
            enemy.use = true;
            let angle = Math.PI * 3 / 2;
            enemy.angle = angle;
            enemy.color = color;
            enemy.type = type;
            enemy.mesh.position.y = 630 * Math.sin(angle);
            enemy.mesh.position.x = 630 * Math.cos(angle);
            enemy.mesh.position.z = -350 + Math.random() * 700;
            enemy.mesh.rotation.z = angle - Math.PI / 2;
            enemy.mesh.scale.set(size, size, size);
            this.mesh.add(enemy.mesh);
        }
    }

    spawnEnemiesPerlin() {
        let tree;
        for (let i = 0; i < level; i++) {

            let zPos = -350 + Math.random() * 700;

            // mapping the z position in sampling space of perlin noise
            // z correspond to x in the 2d sampling space
            let sampX = mapVal(zPos, -this.spawnWidth / 2, this.spawnWidth / 2,
                -this.scale * this.spawnWidth / 2, this.scale * this.spawnWidth / 2)

            // the generation score, with the generation score, we decide which
            // kind of the tree to generate

            let pnoise = noise.perlin2(sampX ,this.sampY);
            let score = mapVal(pnoise, -1, 1, 0, 1);
            // console.log(pnoise);
            // console.log(score);
            let distributionIdx = fallInRange(score, [2, 1, 1, 1])
            let treeDistribution = [
                [8, 1, 3, 2],
                [1, 8, 3, 2],
                [2, 1, 3, 8],
                [1, 1, 8, 2],
            ];

            let treeTypeIdx = drawTypeFromDistribution(treeDistribution[distributionIdx]);
            let types = ["BoxTree", "ConeTree", "ThreeConesTree", "FiveConesTree"];

            let color = weather.getSeasonColor();
            console.log(weather.getSeason());
            let size = Math.max(Math.random() * 0.7, 0.3);
            let type = types[treeTypeIdx]


            // todo: make rules to define the size and color
            tree = this.GenerateEnemy(size, color, types[treeTypeIdx]);
            if (tree.use === undefined) this.enemiesInUse.push(tree);
            tree.use = true;
            let angle = Math.PI * 3 / 2;
            tree.angle = angle;
            tree.color = color;
            tree.type = type;
            tree.mesh.position.y = 630 * Math.sin(angle);
            tree.mesh.position.x = 630 * Math.cos(angle);
            tree.mesh.position.z = zPos;
            tree.mesh.rotation.z = angle - Math.PI / 2;
            tree.mesh.scale.set(size, size, size);
            this.mesh.add(tree.mesh);
        }


    }

    rotateEnemies() {
        // update the y coordinate in the noise sampling space when the
        // cylinder rotates
        // rotationSpeed/2PI * PI*R^2
        this.sampY += game.rotateSpeed * Math.pow(this.cylinderRadius, 2);

        for (let i = 0; i < this.enemiesInUse.length; i++) {
            let enemy = this.enemiesInUse[i];
            if (enemy.use === false) continue;
            enemy.angle += game.rotateSpeed * 3;
            enemy.mesh.position.y = 630 * Math.sin(enemy.angle) - 600;
            enemy.mesh.position.x = 630 * Math.cos(enemy.angle);
            enemy.mesh.rotation.z = enemy.angle - Math.PI / 2;
            if (enemy.angle > 7 * Math.PI / 2) {
                this.mesh.remove(enemy.mesh);
                if(weather.getSeasonColor() === enemy.mesh.children[0].color){
                    this.enemiesPool.push(enemy);
                }
                enemy.use = false;
            }
            if (car.scene) {
                if(game.rotateSpeed < 1.2 * game.basicRotateSpeed) game.rotateSpeed += 0.00001;
                let diffPos = car.scene.position.clone().sub(enemy.mesh.position.clone());
                let d = diffPos.length();
                if (d <= game.enemyDistanceTolerance) {
                    if (glassBreak!==undefined)
                        glassBreak.play();
                    particlesHolder.spawnParticles(enemy.mesh.position.clone(), (enemy.mesh.scale.x/0.7) * 20, enemy.color, (enemy.mesh.scale.x/0.7) * 20, "explode");
                    if(weather.getSeasonColor() === enemy.mesh.children[0].color){
                        this.enemiesPool.push(enemy);
                    }
                    this.mesh.remove(enemy.mesh);

                    enemy.use = false;

                    if(game.rotateSpeed >  - game.basicRotateSpeed){
                        game.rotateSpeed -= 0.01;
                    }
                    game.life -= game.damage;
                    ambientLight.intensity = 1.5;
                }
            }
        }
    }

    GenerateEnemy(size, color, type) {
        let enemy;
        for (let i = 0; i < enemiesPool.length; i++) {
            let enemy = enemiesPool.pop();
            if (enemy.color === color && enemy.type === type) {
                enemy.mesh.scale.set(size, size, size);
                return enemy;
            }
            enemiesPool.push(enemy);
        }
        if (type === "ConeTree") {
            enemy = new ConeTree((color));
        } else if (type === "BoxTree") {
            enemy = new BoxTree((color));
        } else if (type === "ThreeConesTree") {
            enemy = new ThreeConesTree((color));
        } else if (type === "FiveConesTree") {
            enemy = new FiveConesTree((color));
        }
        if (enemy) {
            enemy.mesh.scale.set(size, size, size);
        }
        return enemy;
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
        this.perlin2 = [];
        this.treeGenerateProbability = treeGenerateProbability;
        this.cloudHeight = 4*amplify;
        // this.waterHeight = -amplify / 2;
        this.waterHeight = -20;


        this.waterDamping = 20;

        this.createTerrain(false);
        this.decorateTree();
        //this.createFireBall();
        // this.createWater2();
        this.createWater(); //using shader
        this.createWater3(); //using setY
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

            //generate cloud
            if (probability(0.1) && vz2 > 0.3){
                let cloud = new Cloud();
                cloud.mesh.position.y = this.cloudHeight;
                cloud.mesh.position.x = vx;
                cloud.mesh.position.z = vy;
                this.mesh.add(cloud.mesh)
            }//generate cloud
        }
        this.mesh.add(planeMesh);
        //directly apply rotation to the object vertex
        plane.rotateX(Math.PI / 2)
        plane.computeVertexNormals();
        plane.attributes.position.needsUpdate = true;
        planeMesh.receiveShadow = true;
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
        for (let i = 0; i < this.terrain.geometry.attributes.position.count; i += 3) {
            const vy = this.terrain.geometry.attributes.position.getY(i);
            const vx = this.terrain.geometry.attributes.position.getX(i);
            const vz = this.terrain.geometry.attributes.position.getZ(i);

            if (vy < this.waterHeight + 30) {
                continue;
            }
            // if (probability(this.treeGenerateProbability)) {
            //     treeAmt += 3;
            // }
            noise.seed(1000);
            if (noise.perlin2(this.samplingScale * vx / this.size + 0.5, this.samplingScale * vz / this.size + 0.5)
                > (0.4 + mapVal(Math.random(), 0, 1, -0.07, 0.07))) {
                treeAmt += 3;
            }


            if (treeAmt > 0) {
                treeAmt -= 1;
                // const vx = this.terrain.geometry.attributes.position.getX(i);
                // const vz = this.terrain.geometry.attributes.position.getZ(i);


                const nx = this.terrain.geometry.attributes.normal.getX(i);
                const ny = this.terrain.geometry.attributes.normal.getY(i);
                const nz = this.terrain.geometry.attributes.normal.getZ(i);

                // let normal = new THREE.Vector3(nx, ny, nz)
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
                let size = 0.09 + mapVal(Math.random(), 0, 1, -0.008, 0.008);
                let type = types[treeTypeIdx]
                let tree = treeFactory(type, Colors.green);

                let offset = this.size / this.segments;
                tree.mesh.position.y = vy;
                tree.mesh.position.x = vx + (this.x * this.size + this.size / 2) + offset * Math.random();
                tree.mesh.position.z = vz + (this.z * this.size + this.size / 2) + offset * Math.random();


                tree.color = color;
                tree.mesh.scale.set(size, size, size);
                tree.type = type;
                tree.mesh.position.y += 160 * size;

                //combination of the surface normal and a vertical vector is the direction of the tree
                //let look = tree.mesh.localToWorld(nsew THREE.Vector3(-100 * nx, 100 * nz, 100 * Math.abs(ny - 5)));
                // console.log(normal)
                //tree.mesh.lookAt(look);
                //tree.mesh.lookAt(normal);
                tree.mesh.rotation.x = -nz / 3;
                tree.mesh.rotation.z = nx / 3;
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

    //let waterMesh, waterMaterial, waterPlane;
    createWater() {
        const xT = this.x * this.size + this.size / 2; //translate
        const zT = this.z * this.size + this.size / 2; //translate
        this.waterPlane = new THREE.PlaneGeometry(this.size, this.size, this.segments / 4, this.segments / 4);
        this.waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time:{type:'f', value: 1.0},
                xt: {type:'f', value: this.x * this.size + this.size / 2},
                zt: {type:'f', value: this.z * this.size + this.size / 2},
            },
            vertexShader: _VS, fragmentShader: _FS,
            side: THREE.DoubleSide,
            //flatShading: true,
            //opacity: 0.5,
            //shininess: 60,
        })
        let waterMesh = new THREE.Mesh(this.waterPlane, this.waterMaterial);
        waterMesh.position.x = xT;
        waterMesh.position.z = zT;
        waterMesh.receiveShadow = true;
        waterMesh.rotation.x = -Math.PI/2;
        waterMesh.position.y = this.waterHeight;
        this.water = waterMesh;
        this.mesh.add(waterMesh);
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

    createWater3(){
        const plane = new THREE.PlaneBufferGeometry(this.size, this.size, 1, 1);
        let material = new THREE.MeshBasicMaterial({
            color: 0x2B90FF,
            side: THREE.DoubleSide,
        });
        waterMesh = new THREE.Mesh(plane, material);
        waterMesh.receiveShadow = true;
        plane.rotateX(-Math.PI / 2);
        const xTranslation = this.x * this.size + this.size / 2;
        const zTranslation = this.z * this.size + this.size / 2;

        waterMesh.position.x = xTranslation;
        waterMesh.position.z = zTranslation;
        waterMesh.position.y = this.waterHeight-10;
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

function Cloud() {
    this.mesh = new THREE.Object3D();
    let size = 50;

    let n = Math.round(mapVal(Math.random(), 0, 1, 2, 4));
    let material = new THREE.MeshLambertMaterial({
        color: 0xDFF3FF,
        side: THREE.DoubleSide,
        // shininess: 60,
        opacity: 0.5
    });
    for (let i = 0; i < n; i++) {
        let thisSize= mapVal(Math.random(), 0, 1 , 0.7,1)*size;
        let geo = new THREE.BoxGeometry(thisSize,thisSize,thisSize);
        let cloud = new THREE.Mesh(geo, material);
        cloud.position.x += mapVal(Math.random(), 0, 1, -n/2 , n/2)*size;
        cloud.position.z += mapVal(Math.random(), 0, 1, -n/2 , n/2)*size;
        cloud.position.y += mapVal(Math.random(), 0, 1, -1 , 1)*size;
        cloud.rotation.x = Math.PI/2 * Math.random();
        cloud.rotation.z = Math.PI/2 * Math.random();
        this.mesh.add(cloud);
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

let cherryCount, rainCount, balloonsCount, flakeCount, cherry, rain, balloons, snow, season, cnt = 0,
    cherryGeometry, cherryMaterial, cherryMesh, cherryArray, rainGeometry, rainMaterial, rainMesh, rainArray,
    balloonGeometry, balloonMaterial, balloonMesh, balloonsArray, flakeGeometry, flakeMaterial, flakeMesh, flakeArray;
const Spring = Symbol("Spring");
const Summer = Symbol("summer");
const Fall = Symbol("Fall");
const Winter = Symbol("winter");

class Weather {
    startCherry(density) {
        cherryCount = density;
        const shape = new THREE.Shape();
        const x = -2.5;
        const y = -5;
        shape.moveTo(x + 2.5, y + 2.5);
        shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
        shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
        shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
        shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
        shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
        shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

        const extrudeSettings = {
            steps: 2,
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 1,
            bevelSegments: 2,
        };
        cherryGeometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings); // radius
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
    updateCherry(){this.updateParticle(cherry, cherryArray, 1);}

    startRain(density){
        rainCount = density;
        const radius = 1;
        const height = 2;
        const segments = 16;
        rainGeometry = new THREE.ConeBufferGeometry(radius, height, segments);
        let rainGeometry2 = new THREE.SphereGeometry(radius);
        rainMaterial = new THREE.MeshBasicMaterial({color: Colors.blue});
        rain = new THREE.Group();
        for (let i = 0; i < rainCount; i++) {
            let x = (Math.random() - 0.5) * 2000;
            let y = (Math.random() - 0.5) * 4000;
            let z = (Math.random() - 0.5) * 2000;
            rainMesh = new THREE.Mesh(rainGeometry, rainMaterial);
            let rainMesh2 = new THREE.Mesh(rainGeometry2, rainMaterial);
            rainMesh.position.set(x, y, z); //cone
            rainMesh2.position.set(x,y-height/2,z); //sphere
            rain.add(rainMesh);
            rain.add(rainMesh2);
        }
        scene.add(rain);
        rainArray = rain.children;
    }
    updateRain(){
        this.updateParticle(rain, rainArray, 0);
    }

    startBalloons(density){
        balloonsCount = density;
        balloonMaterial = new THREE.MeshNormalMaterial({});
        let tubeGeo = new THREE.CylinderGeometry(1,1,50,32);
        balloonGeometry = new THREE.SphereGeometry(20);
        balloons = new THREE.Group();
        for (let i = 0; i < balloonsCount; i++) {
            let x = (Math.random() - 0.5) * 2000;
            let y = (Math.random() - 0.5) * 4000;
            let z = (Math.random() - 0.5) * 2000;
            let tube = new THREE.Mesh(tubeGeo, balloonMaterial);
            balloonMesh = new THREE.Mesh(balloonGeometry, balloonMaterial);
            tube.position.set(x,y,z);
            tube.rotation.set(0,0,0);//-Math.PI/2
            balloons.add(tube);
            balloonMesh.position.set(x,y+40,z);
            balloons.add(balloonMesh);
        }
        scene.add(balloons);
        balloonsArray = balloons.children;
    }
    updateBalloons(){this.updateParticle(balloons, balloonsArray, 0);}

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
    updateSnow(){this.updateParticle(snow, flakeArray, 1);}

    updateParticle(particle, array, rotationSpeed){
        for (let i = 0; i < array.length / 2; i++) {
            array[i].rotation.x += 0.02 * rotationSpeed;
            array[i].rotation.z += 0.03 * rotationSpeed;
            array[i].rotation.y += 0.01;
            array[i].position.y -= 0.9;
            array[i].position.x += 0.1;
            array[i].position.z += 0.1;
            if (array[i].position.y < 0) {
                array[i].position.y += 2000;
            }
            particle.rotation.y += 0.0000002;
        }
        for (let i = array.length / 2; i < array.length; i++) {
            array[i].rotation.x -= 0.03 * rotationSpeed;
            array[i].rotation.z -= 0.02 * rotationSpeed;
            array[i].rotation.y -= 0.03;
            array[i].position.y -= 0.8;
            array[i].position.x -= 0.1;
            array[i].position.z -= 0.1;
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
                this.updateBalloons();
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
            season = Spring; this.startCherry(300); scene.remove(snow);
            if(backgroundSound!==undefined) updateMusic("./music/Spring.mp3");
        }else if(cnt%4===1) {
            season = Summer; this.startRain(5000); scene.remove(cherry);
            if(backgroundSound!==undefined) updateMusic("./music/Summer.mp3");
        }else if(cnt%4===2) {
            season = Fall; this.startBalloons(100); scene.remove(rain);
            if(backgroundSound!==undefined) updateMusic("./music/Fall.mp3");
        }else {
            season = Winter; this.startSnow(5000); scene.remove(balloons);
            if(backgroundSound!==undefined) updateMusic("./music/Winter.mp3");
        }
        cnt++;
    }
}

function colorGradient(x ,y){
    var cols = [{
        stop: 0,
        color: new THREE.Color(0xf7b000)
    }, {
        stop: .25,
        color: new THREE.Color(0xdd0080)
    }, {
        stop: .5,
        color: new THREE.Color(0x622b85)
    }, {
        stop: .75,
        color: new THREE.Color(0x007dae)
    }, {
        stop: 1,
        color: new THREE.Color(0x77c8db)
    }];
}
//==================== shaders ==========================
const _VS = `uniform float time;
uniform float xt;
uniform float zt;
varying float yPosition;
void main(){
    float x = position.x;
    float y = position.y;
    float xx = (position.x+xt);
    float yy = (position.y+zt);
    float PI = 3.141592653589;

    float sx = 0.0;
    float sy = 0.0;
    float sz = 0.0;

    float ti = 0.0;
    float index = 1.0;
    vec2 dir;//水波方向
    for(int i = 0;i<3;i++){
        ti = ti + 0.0005;
        index +=1.0;
        if(mod(index,2.0)==0.0){
            dir = vec2(1.0,ti);
        }else{
            dir = vec2(-1.0,ti);
        }
        float l1 = 2.0 * PI / (0.5 + ti);//波长
        float s1 = 20.0 * 2.0 / l1;//速度
        float x1 = 1.0 * dir.x * sin(dot(normalize(dir),vec2(xx,yy)) * l1 + time * s1);
        float y1 = 1.0 * dir.y * sin(dot(normalize(dir),vec2(xx,yy)) * l1 + time * s1);
        float z1 = 1.0 * sin(dot(normalize(dir),vec2(xx,yy)) * l1 + time * s1);
        sx +=x1;
        sy +=y1;
        sz +=z1;
    }
    sx = x + sx;
    sy = y + sy;
    yPosition = sz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(sx,sy,sin(sz) * 10.0,1.0);
}`;
const _FS = `
varying float yPosition;
void main()
{
  vec3 white = vec3(255.,255.,255.);
  vec3 blue = vec3(90./255.,160./255.,248./255.);
  gl_FragColor = vec4(vec3(blue+0.0001*yPosition*white), 1);
}`;
const _fireballVS = `

uniform float time;
varying vec3 fNormal;
varying vec3 fPosition;
varying vec3 color;

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float map(float value, float low1, float high1, float low2, float high2) {
  return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

void main()
{
  // fNormal = normalize(normalMatrix * normal);
  
  fNormal = normal;
  
  float region = 2.5;
  float speed = 15.0;
  
  float displacement = 1.0 * cnoise(position * region - time * speed);
  
  color = 2.0 * vec3(map(displacement, 0.5 , 0.78, 0.3 , 0.0), map(displacement, 0.0, 0.5, 0.3, 0.0), map(displacement, 0.0, 0.3, 0.0 , 0.0));

  vec3 newPosition = position + normal * displacement * 0.5;
  
  vec4 pos = modelViewMatrix * vec4(newPosition, 1.0);
  fPosition = pos.xyz;
  gl_Position = projectionMatrix * pos;
}`;
const _fireballFS = `
precision highp float;
uniform float time;
uniform vec2 resolution;
varying vec3 fPosition;
varying vec3 fNormal;
varying vec3 color;

void main()
{
  gl_FragColor = vec4(color, 1.0);
}
`