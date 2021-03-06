"use strict";
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
};

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
    renderer, container, controls;

window.addEventListener('load', init, false);

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    // add the objects
    //createPlane();
    createRoad();
    createSky();
    createCar();
    addHelpers();

    // start a loop that will update the objects' positions
    // and render the scene on each frame
    document.addEventListener('mousemove', handleMousemove, false);

    loop();
}

function addHelpers(){
    var axesHelper = new THREE.AxesHelper(5000);
    scene.add( axesHelper );
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
    camera.position.x = 0;
    camera.position.z = 300;
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
}

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

var hemisphereLight, shadowLight;

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

// First let's define a Sea object :
const  Road = function () {

    // create the geometry (shape) of the cylinder;
    // the parameters are:
    // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    // rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI / 2));

    // create the material
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        transparent: false,
        opacity: .6,
        shading: THREE.FlatShading,
    });

    // To create an object in Three.js, we have to create a mesh
    // which is a combination of a geometry and some material
    this.mesh = new THREE.Mesh(geom, mat);

    // Allow the sea to receive shadows
    this.mesh.receiveShadow = true;
}

// Instantiate the sea and add it to the scene:

var sea;

function createRoad() {
    sea = new Road();

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


const Sky = function () {
    // Create an empty container
    this.mesh = new THREE.Object3D();

    this.nClouds = 70;

    // To distribute the clouds consistently,
    // we need to place them according to a uniform angle
    var stepAngle = Math.PI * 2 / this.nClouds;

    // create the clouds
    for (var i = 0; i < this.nClouds; i++) {
        var c = new Cloud();


        var a = stepAngle * i; // this is the final angle of the cloud
        var h = 1500 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

        // Trigonometry!!! I hope you remember what you've learned in Math :)
        // in case you don't:
        // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.z = Math.cos(a) * h;

        // rotate the cloud according to its position
        c.mesh.rotation.z = a + Math.PI / 2;

        // for a better result, we position the clouds
        // at random depths inside of the scene
        c.mesh.position.z = -400 + Math.random() * 1000;

        // we also set a random scale for each cloud
        var s = 1 + Math.random() * 2;
        c.mesh.scale.set(s, s, s);

        // do not forget to add the mesh of each cloud in the scene
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

    loader.load('models/car/scene.gltf', function (gltf) {
        gltf.scene.scale.set(.15, .15, .15);
        gltf.scene.position.z = 0;
        gltf.scene.position.y = 20;
        gltf.scene.rotation.y = 3.14/2;
        scene.add(gltf.scene);
        console.log('gltf', gltf);

        mixer = new THREE.AnimationMixer(gltf.scene);
        var clips = gltf.animations;

        var clip = THREE.AnimationClip.findByName(clips, 'Car engine');
        var action = mixer.clipAction(clip);

        action.play()

    }, undefined, function (error) {

        console.error(error);

    });
}

function createCar() {
    car = new Car();
}




var mousePos = {x:0, y:0}
function  handleMousemove(event){
    let normalizedX = -1 + (event.clientX / WIDTH)*2;
    let normalizedY = 1 - (event.clientY / HEIGHT)*2;
    mousePos = {x:normalizedX, y:normalizedY};
}

function updateCar(){
    let dx = normalize(mousePos.x, -1, 1, -100, 100);
    let dy = normalize(mousePos.y, -1, 1, 25, 175);


}




var clock = new THREE.Clock();

function loop() {

    var delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    // Rotate the propeller, the sea and the sky
    //airplane.propeller.rotation.x += 0.3;
    sea.mesh.rotation.x += .005;
    sky.mesh.rotation.x += .01;
    controls.update();
    //controls.update();

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}