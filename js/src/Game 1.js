"use strict";
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    green: 0x24942c,
    grey: 0x777a7a,
    red2: 0xFd090e,
    orange: 0xFD6D06,
};

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
    renderer, container, controls, enemiesHolder, particlesHolder;

var musicFlag = true;
var backgroundSound, audioListener, glassBreak;

var level = 3;
var enemiesPool = [];
var particlesPool = [];
var cloudsPool = [];
var game;

window.addEventListener('load', init, false);

function init() {
    resetGame();
    fieldDistance = document.getElementById("distValue");
    energyBar = document.getElementById("energyBar");
    replayMessage = document.getElementById("replayMessage");

    // set up the scene, the camera and the renderer
    createScene();
    // randomly generate seed for the noise generator
    noise.seed(Math.random());

    // add the lights
    createLights();

    // add the objects
    //createPlane();
    createSea();
    createSky();
    createCar();
    createEnemies();
    createParticles();

    // start a loop that will update the objects' positions
    // and render the scene on each frame
    document.addEventListener('mousemove', handleMousemove, false);
    document.addEventListener('touchend', handleTouchEnd, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    loop();
}

function resetGame() {
    game = {
        enemyDistanceTolerance: 70,
        life: 20,
        damage: 7,
        status: "start",
        point: 0,
        clock: new THREE.Clock(),
        levelPoints: 5,
        season: "spring",
        basicRotateSpeed: 0.005,
        rotateSpeed: 0.005,
    }
    if(scene && car){
        scene.add(car.scene);
    }
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
    scene.fog = new THREE.Fog(0xF5986E, 100, 950);

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

    controls = new THREE.TrackballControls(camera);

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
        glassBreakInit();
    }
}

function updateMusic(musicName){
    backgroundSound.stop();
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

function glassBreakInit(){
    // instantiate a loader
    const audioLoader = new THREE.AudioLoader();
    glassBreak = new THREE.Audio(audioListener);
    audioLoader.load("./music/glass_break.mp3", function(buffer){
        glassBreak.setBuffer(buffer);
        glassBreak.setLoop(false);
        glassBreak.setVolume(0.6);
    })
}



function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

var ambientLight, hemisphereLight, shadowLight;

function createLights() {
    ambientLight = new THREE.AmbientLight(0xdc8874, 0);

    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .8)

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
    scene.add(ambientLight);
    scene.add(shadowLight);
}

// First let's define a Sea object :
const Sea = function () {
    this.mesh = new THREE.Object3D();

    // create the geometry (shape) of the cylinder;
    // the parameters are:
    // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    let geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    // rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // create the material
    let mat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        // color: 0x919899,
        transparent: false,
        opacity: .6,
        shading: THREE.FlatShading,
    });

    // To create an object in Three.js, we have to create a mesh
    // which is a combination of a geometry and some material
    let s = new THREE.Mesh(geom, mat);
    this.mesh.add(s);

    // Allow the sea to receive shadows
    this.mesh.receiveShadow = true;
}

// Instantiate the sea and add it to the scene:

let sea;

function createSea() {
    sea = new Sea();

    // push it a little bit at the bottom of the scene
    sea.mesh.position.y = -600;

    // add the mesh of the sea to the scene
    scene.add(sea.mesh);
}

const Cloud = function () {
    // Create an empty container that will hold the different parts of the cloud
    this.mesh = new THREE.Object3D();

    // create a cube geometry;
    // this shape will be duplicated to create the cloud
    var geom = new THREE.BoxGeometry(20, 20, 20);

    // create a material; a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        transparent: true,
        opacity: .6,
        shading: THREE.FlatShading,
    });

    // duplicate the geometry a random number of times
    var nBlocs = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < nBlocs; i++) {

        // create the mesh by cloning the geometry
        var m = new THREE.Mesh(geom, mat);

        // set the position and the rotation of each cube randomly
        m.position.x = i * 15;
        m.position.y = Math.random() * 10;
        m.position.z = Math.random() * 10;
        m.rotation.z = Math.random() * Math.PI * 2;
        m.rotation.y = Math.random() * Math.PI * 2;

        // set the size of the cube randomly
        var s = .1 + Math.random() * .9;
        m.scale.set(s, s, s);

        // allow each cube to cast and to receive shadows
        m.castShadow = true;
        m.receiveShadow = true;

        // add the cube to the container we first created
        this.mesh.add(m);
    }
}


// Define a Sky Object
const Sky = function () {
    // Create an empty container
    this.mesh = new THREE.Object3D();

    // choose a number of clouds to be scattered in the sky
    this.nClouds = 20;

    // To distribute the clouds consistently,
    // we need to place them according to a uniform angle
    var stepAngle = Math.PI * 2 / this.nClouds;

    // create the clouds
    for (var i = 0; i < this.nClouds; i++) {
        var c = new Cloud();
        var a = stepAngle * i; // this is the final angle of the cloud
        var h = 1000 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;

        c.mesh.rotation.z = a + Math.PI / 2;

        c.mesh.position.z = -400 + Math.random() * 1000;

        var s = 1 + Math.random() * 2;
        c.mesh.scale.set(s, s, s);

        cloudsPool.push(c.mesh);
        this.mesh.add(c.mesh);
    }
}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

var mixer;
var car;

var Car = function () {
    var loader = new THREE.GLTFLoader();
    var c = this;
    loader.load('models/car/scene.gltf', function (gltf) {
        gltf.scene.scale.set(.15, .15, .15);
        gltf.scene.position.z = 0;
        gltf.scene.position.y = 0;
        gltf.scene.position.x = 0;
        scene.add(gltf.scene);

        mixer = new THREE.AnimationMixer(gltf.scene);
        var clips = gltf.animations;

        var clip = THREE.AnimationClip.findByName(clips, 'Car engine');
        var action = mixer.clipAction(clip);

        c.scene = gltf.scene;
        action.play()
    }, undefined, function (error) {
        console.error(error);
    });
}

function createCar() {
    car = new Car();
}

function createPlane() {
    var airplane = new AirPlane();
    airplane.mesh.scale.set(.25, .25, .25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);
}

let BoxTree = function (color) {
    this.mesh = new THREE.Object3D();
    let leaf = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: .7,
        shading: THREE.FlatShading,
    });
    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading,
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
        shading: THREE.FlatShading,
    });
    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading,
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
        shading: THREE.FlatShading,
    });

    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading,
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
        shading: THREE.FlatShading,
    });

    let stunk = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading,
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

//  I rewrite the enemy holder as a class
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
                    if (glassBreak!==undefined) glassBreak.play();
                    particlesHolder.spawnParticles(enemy.mesh.position.clone(), (enemy.mesh.scale.x/0.7) * 20, enemy.color, (enemy.mesh.scale.x/0.7) * 20, "explode");
                    console.log(enemy.mesh.children[0]);
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
        for (let i; i < enemiesPool.length; i++) {
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

class Particle{
    constructor() {
        let geom = new THREE.TetrahedronGeometry(3,0);
        let mat = new THREE.MeshPhongMaterial({
            color:0x009999,
            shininess:0,
            specular:0xffffff,
            shading:THREE.FlatShading
        });
        this.mesh = new THREE.Mesh(geom,mat);
    }

    explode = function(pos, color, scale){
        let _this = this;
        let _p = this.mesh.parent;
        this.mesh.material.color = new THREE.Color( color);
        this.mesh.material.needsUpdate = true;
        this.mesh.scale.set(scale, scale, scale);
        let targetX = pos.x + (-1 + Math.random()*2)*250;
        let targetY = pos.y + (-1 + Math.random()*2)*250;
        let targetZ = pos.z + (-1 + Math.random()*2)*250;
        let speed = .6+Math.random()*.2;
        TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12, z:Math.random()*12});
        TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
        TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, z:targetZ, delay:Math.random() *.1, ease:Power1.easeOut, onComplete:function(){
                if(_p) _p.remove(_this.mesh);
                _this.mesh.scale.set(1,1,1);
                particlesPool.unshift(_this);
            }});
    }

    rise = function(pos, color, scale){
        let _this = this;
        let _p = this.mesh.parent;
        this.mesh.material.color = new THREE.Color(color);
        this.mesh.material.needsUpdate = true;
        this.mesh.scale.set(scale, scale, scale);
        let targetX = pos.x + (-1 + Math.random()*2)*10;
        let targetY = pos.y + (-1 + Math.random()*2)*250;
        let targetZ = pos.z + (-1 + Math.random()*2)*10;
        let speed = 2.0 + Math.random()*.5;
        TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12, z:Math.random()*12});
        TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
        TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, z:targetZ, ease:Power1.easeOut, onComplete:function(){
                if(_p) _p.remove(_this.mesh);
                _this.mesh.scale.set(1,1,1);
                particlesPool.unshift(_this);
            }});
    }
}

class ParticlesHolder {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.particlesInUse = [];
    }

    spawnParticles = function(pos, density, color, scale, type){
        for (let i=0; i<density; i++){
            let particle;
            if (particlesPool.length) {
                particle = particlesPool.pop();
            }else{
                particle = new Particle();
            }
            this.mesh.add(particle.mesh);
            particle.mesh.visible = true;
            let _this = this;
            particle.mesh.position.y = pos.y;
            particle.mesh.position.x = pos.x;
            particle.mesh.position.z = pos.z;
            if(type === "explode"){
                particle.explode(pos,color, scale);
            }else{particle.rise(pos,color, scale);

            }
        }
    }

    generateParticles = function(type){
        let temp = particlesPool.length;
        for(let i = 0; i < temp; i++){

        }
    }
}

function createParticles(){
    for (let i=0; i<10; i++){
        let particle = new Particle();
        particlesPool.push(particle);
    }
    particlesHolder = new ParticlesHolder();
    scene.add(particlesHolder.mesh)
}

function createEnemies() {
    enemiesHolder = new EnemiesHolder();
    scene.add(enemiesHolder.mesh)
}

function normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}

var mousePos = {x: 0, y: 0}

function handleMousemove(event) {
    let normalizedX = -1 + (event.clientX / WIDTH) * 2;
    let normalizedY = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {x: normalizedX, y: normalizedY};
}

function updateCar() {
    //let dy = normalize(mousePos.y, -1, 1, 25, 175);
    if (car.scene) {
        car.scene.position.z = -1 * mousePos.y * 370;
        let pos = car.scene.position.clone();
        pos.x += 10;
        pos.z += 10;
        if(Math.random() > 0.92){
            let color;
            if(game.life > 5){
                color = Colors.white;
            }else if (game.life > 10){
                color = Colors.grey;
            }else{
                color = Colors.brownDark;
            }
            if(game.life > 0){
                particlesHolder.spawnParticles(pos, Math.min(5 * (20/game.life), 10), color, Math.min(4 * (20/game.life), 8), "rise" );
            }else if(game.life <= 0 && game.status === "start"){
                game.status = "over";
                scene.remove(car.scene);
                game.rotateSpeed = 0;
                particlesHolder.spawnParticles(pos, 100 , Colors.red2, 20, "explode" );
            }
        }
        //particlesHolder.spawnParticles(enemy.mesh.position.clone(), (enemy.mesh.scale.x/0.7) * 20, enemy.color, (enemy.mesh.scale.x/0.7) * 20, "explode");
    }
}

var fieldDistance, energyBar, replayMessage;

function updateDistance(){
    game.distance = 630 * (game.basicRotateSpeed/(Math.PI*2)) * game.clock.getElapsedTime () * 10;
    fieldDistance.innerHTML = Math.floor(game.distance);
}

function updateEnergy(){
    energyBar.style.right = 100 * (1 - game.life/20)+"%";
    energyBar.style.backgroundColor = (game.life<50)? "#f25346" : "#68c3c0";
}


function handleTouchEnd(event){
    if (game.status === "over"){
        resetGame();
        hideReplay();
    }
}

function handleMouseUp(event){
    if (game.status === "over"){
        resetGame();
        hideReplay();
    }
}

function showReplay(){
    replayMessage.style.display="block";
}

function hideReplay(){
    replayMessage.style.display="none";
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
            season = Spring; this.startCherry(5000); scene.remove(snow); updateMusic("./music/Spring.mp3");
        }else if(cnt%4===1) {
            season = Summer; this.startRain(5000); scene.remove(cherry); updateMusic("./music/Summer.mp3");
        }else if(cnt%4===2) {
            season = Fall; this.startLeaves(5000); scene.remove(rain); updateMusic("./music/Fall.mp3");
        }else {
            season = Winter; this.startSnow(5000); scene.remove(leaves); updateMusic("./music/Winter.mp3");
        }
        cnt++;
    }

    getSeasonColor(){
        if(season === Spring){
            return Colors.green;
        }else if(season === Summer){
            return Colors.red;
        }else if(season === Fall){
            return Colors.orange;
        }else if(season === Winter){
            return Colors.blue;
        }
    }
}

let weather = new Weather();
let sinBuffer;
let clock = new THREE.Clock();

function loop() {

    var delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    if(game.status === "over") game.rotateSpeed = 0;

    ambientLight.intensity += (.0 - ambientLight.intensity)*game.clock.getElapsedTime ()*0.005;
    sea.mesh.rotation.z += game.rotateSpeed;
    sky.mesh.rotation.z += .01;
    if (Math.random() > 0.97 && game.rotateSpeed >= game.basicRotateSpeed) {
        enemiesHolder.spawnEnemiesPerlin();
    }

    enemiesHolder.rotateEnemies();
    updateCar();
    if(game.status === "start"){
        updateDistance();
        updateEnergy();
    }else if(game.status === "over"){
        showReplay();
    }

    //<------------------season update------------------>
    let currentSin = Math.sin((game.clock.getElapsedTime())/4);
    if(currentSin*sinBuffer<0) { //indicate a sign change, corresponding to season change
        weather.switchSeason();
    }
    weather.moveParticles();
    sinBuffer = Math.sin((game.clock.getElapsedTime())/4);
    console.log(sea.mesh.children[0]);
    if(sea.mesh.children[0].material.color !== weather.getSeasonColor()){
        sea.mesh.children[0].material.color = new THREE.Color(weather.getSeasonColor());
    }
    //<------------------season update------------------>

    // Rotate the propeller, the sea and the sky
    //airplane.propeller.rotation.x += 0.3;

    controls.update();

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}
