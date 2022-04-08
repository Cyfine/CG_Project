

"use strict";
let Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
};

let scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
    renderer, container, controls, speed = 100;

let clock = new THREE.Clock();


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
    // createCar();
    addTruck();
    addHelpers();

    // start a loop that will update the objects' positions
    // and render the scene on each frame
    document.addEventListener('mousemove', handleMousemove, false);

    loop();
}

function loop() {

    let delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    // Rotate the propeller, the sea and the sky
    //airplane.propeller.rotation.x += 0.3;
    sea.mesh.rotation.x += .005;
    sky.mesh.rotation.x += .01;
    controls.update();
    truck.move();
    //controls.update();

    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
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

function addHelpers() {
    let axesHelper = new THREE.AxesHelper(5000);
    scene.add(axesHelper);
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

const Road = function () {

    // create the geometry (shape) of the cylinder;
    // the parameters are:
    // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    let geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    // rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI / 2));

    // create the material
    let mat = new THREE.MeshPhongMaterial({
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

let sea;


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

    let geom = new THREE.BoxGeometry(20, 20, 20);
    // create a material; a simple white material will do the trick

    let mat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        transparent: true,
        opacity: .6,
        shading: THREE.FlatShading,
    });
    // duplicate the geometry a random number of times
    let nBlocs = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < nBlocs; i++) {
        // create the mesh by cloning the geometry

        let m = new THREE.Mesh(geom, mat);
        // set the position and the rotation of each cube randomly
        m.position.x = i * 15;
        m.position.y = Math.random() * 10;
        m.position.z = Math.random() * 10;
        m.rotation.z = Math.random() * Math.PI * 2;

        m.rotation.y = Math.random() * Math.PI * 2;
        // set the size of the cube randomly
        let s = .1 + Math.random() * .9;

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

    let stepAngle = Math.PI * 2 / this.nClouds;
    // create the clouds
    for (let i = 0; i < this.nClouds; i++) {


        let c = new Cloud();
        let a = stepAngle * i; // this is the final angle of the cloud

        let h = 1500 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself
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
        let s = 1 + Math.random() * 2;

        c.mesh.scale.set(s, s, s);
        // do not forget to add the mesh of each cloud in the scene
        this.mesh.add(c.mesh);
    }


}
let sky;


function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);

}
let mixer;

let car;
let Car = function () {

    let loader = new THREE.GLTFLoader();
    loader.load('models/car/scene.gltf', function (gltf) {
        gltf.scene.scale.set(.15, .15, .15);
        gltf.scene.position.z = 0;
        gltf.scene.position.y = 20;
        gltf.scene.rotation.y = 3.14 / 2;
        scene.add(gltf.scene);
        console.log('gltf', gltf);

        mixer = new THREE.AnimationMixer(gltf.scene);
        let clips = gltf.animations;

        let clip = THREE.AnimationClip.findByName(clips, 'Car engine');
        let action = mixer.clipAction(clip);

        action.play()

    }, undefined, function (error) {

        console.error(error);

    });


}
function updateCar() {
    let dx = normalize(mousePos.x, -1, 1, -100, 100);


    let dy = normalize(mousePos.y, -1, 1, 25, 175);

}
function createCar() {
    car = new Car();

}
let mousePos = {x: 0, y: 0}

function handleMousemove(event) {
    let normalizedX = -1 + (event.clientX / WIDTH) * 2;
    let normalizedY = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {x: normalizedX, y: normalizedY};


}

let truck;
function addTruck() {
    truck = new Cybertruck();
    truck.mesh.rotation.y = Math.PI;
    truck.mesh.position.y = 30;

    scene.add(truck.mesh);
}

class Cybertruck {
    constructor() {
        this.speed = speed;
        this.wireframes = false;
        this.width = 80;
        this.height = 75;
        this.depth = 230;
        this.mesh = new THREE.Object3D();

        let W = this.width,
            H = this.height,
            D = this.depth,
            flipXVertices = a => [-a[0],a[1],a[2]],
            toVectors = a => new THREE.Vector3(W * a[0],H * a[1],D * a[2]),
            reverseFaceDraws = a => a.reverse(),
            toFaces = a => new THREE.Face3(a[0],a[1],a[2]);

        // I. Body
        // A. Main
        let bodyVerticesArr = [
                // back (0–3)
                [-0.45, 0.26, -0.5],
                [0.45,  0.26, -0.5],
                [-0.45, -0.1, -0.48],
                [0.45,  -0.1, -0.48],
                // top (4–5)
                [-0.326, 0.5,  0.08],
                [0.326,  0.5,  0.08],
                // middle (6–19)
                [-0.45, -0.1, -0.38],
                [0.45,  -0.1, -0.38],
                [-0.45, 0.06, -0.36],
                [0.45,  0.06, -0.36],
                [-0.45, 0.06, -0.24],
                [0.45,  0.06, -0.24],
                [-0.45, -0.15,-0.18],
                [0.45,  -0.15,-0.18],
                [-0.45, -0.17,0.255],
                [0.45,  -0.17,0.255],
                [-0.45, 0.06, 0.303],
                [0.45,  0.06, 0.303],
                [-0.45, 0.06, 0.42],
                [0.45,  0.06, 0.42],
                // upper front (20–23)
                [-0.45, 0.08, 0.47],
                [0.45,  0.08, 0.47],
                [-0.33, 0.045,0.5],
                [0.33,  0.045,0.5],
                // lower front (24–27)
                [-0.45, -0.13,0.46],
                [0.45,  -0.13,0.46],
                [-0.343,-0.13,0.488],
                [0.343, -0.13,0.488],
                // bottom flaps (28–31)
                [-0.41, -0.21,-0.173],
                [0.41,  -0.21,-0.173],
                [-0.41, -0.23,0.25],
                [0.41,  -0.23,0.25],
                // windows (32–39)
                [-0.4225,0.27,-0.14],
                [0.4225, 0.27,-0.14],
                [-0.379, 0.39,-0.13],
                [0.379,  0.39,-0.13],
                [-0.337, 0.47,0.08],
                [0.337,  0.47,0.08],
                [-0.425, 0.17,0.36],
                [0.425,  0.17,0.36]
            ],
            bodyVertices = bodyVerticesArr.map(toVectors),
            bodyFacesArr = [
                [0,1,3],
                [3,2,0],
                [0,4,5],
                [5,1,0],
                [5,37,35],
                [1,5,35],
                [1,35,33],
                [33,21,1],
                [39,21,33],
                [5,21,37],
                [21,39,37],
                [4,34,36],
                [0,34,4],
                [0,32,34],
                [32,0,20],
                [38,32,20],
                [4,36,20],
                [20,36,38],
                [20,18,24],
                [20,0,18],
                [18,0,16],
                [16,0,10],
                [10,0,8],
                [8,0,2],
                [2,6,8],
                [16,10,14],
                [12,14,10],
                [14,12,28],
                [28,30,14],
                [21,25,19],
                [21,19,1],
                [19,17,1],
                [17,11,1],
                [11,9,1],
                [1,9,7],
                [7,3,1],
                [11,17,15],
                [15,13,11],
                [15,31,29],
                [29,13,15],
                [5,4,20],
                [20,21,5],
                [21,20,22],
                [22,23,21],
                [22,20,24],
                [24,26,22],
                [23,22,26],
                [26,27,23],
                [23,27,25],
                [25,21,23],
                [2,3,7],
                [7,6,2],
                [6,7,9],
                [9,8,6],
                [8,9,11],
                [11,10,8],
                [10,11,13],
                [13,12,10],
                [12,13,29],
                [29,28,12],
                [28,29,31],
                [31,30,28],
                [30,31,15],
                [15,14,30],
                [14,15,17],
                [17,16,14],
                [16,17,19],
                [19,18,16],
                [18,19,25],
                [25,24,18],
                [24,25,26],
                [25,27,26],
                [34,32,33],
                [33,35,34],
                [34,35,37],
                [37,36,34],
                [36,37,39],
                [39,38,36],
                [33,32,38],
                [38,39,33]
            ],
            bodyFaces = bodyFacesArr.map(toFaces),
            bodyGeo = new THREE.Geometry(),
            bodyMat = new THREE.MeshStandardMaterial({
                color: 0xbac3c8,
                wireframe: this.wireframes
            });

        bodyGeo.vertices = bodyVertices;
        bodyGeo.faces = bodyFaces;
        bodyGeo.computeFaceNormals();

        let body = new THREE.Mesh(bodyGeo,bodyMat);
        this.mesh.add(body);

        // B. Door Handles
        let doorHandleGeo = new THREE.BoxGeometry(W*0.01,W*0.024,D*0.0375),
            doorHandleFR = new THREE.Mesh(doorHandleGeo,bodyMat);

        // front right
        doorHandleFR.position.set(W*-0.45,H*0.13,D*0.0844);
        doorHandleFR.rotation.x = 4 * Math.PI/180;
        body.add(doorHandleFR);

        // front left
        let doorHandleFL = doorHandleFR.clone();
        doorHandleFL.position.x *= -1;
        body.add(doorHandleFL);

        // back right
        let doorHandleBR = doorHandleFR.clone();
        doorHandleBR.position.y = H*0.165;
        doorHandleBR.position.z = D*-0.1094;
        body.add(doorHandleBR);

        // back left
        let doorHandleBL = doorHandleBR.clone();
        doorHandleBL.position.x *= -1;
        body.add(doorHandleBL);

        // C. Door Outlines
        let doorOutlineMat = new THREE.LineBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.25
            }),
            doorOutlineFLVerticesArr = [
                [0.451,-0.17,0.255],
                [0.451,0.12, 0.255],
                [0.425,0.192,0.255],
                [0.424,0.192,0.255]
            ],
            doorOutlineFLVertices = doorOutlineFLVerticesArr.map(toVectors),
            doorOutlineFLGeo = new THREE.Geometry();

        // front left
        doorOutlineFLGeo.vertices = doorOutlineFLVertices;

        let doorOutlineFL = new THREE.Line(doorOutlineFLGeo,doorOutlineMat);
        this.mesh.add(doorOutlineFL);

        // front right
        let doorOutlineFRVerticesArr = doorOutlineFLVerticesArr.map(flipXVertices),
            doorOutlineFRVertices = doorOutlineFRVerticesArr.map(toVectors),
            doorOutlineFRGeo = new THREE.Geometry();

        doorOutlineFRGeo.vertices = doorOutlineFRVertices;

        let doorOutlineFR = new THREE.Line(doorOutlineFRGeo,doorOutlineMat);
        this.mesh.add(doorOutlineFR);

        // middle left
        let doorOutlineMLVerticesArr = [
                [0.41,  -0.23,0.0594],
                [0.4505,-0.16,0.0594],
                [0.4505,0.156,0.0531],
                [0.424, 0.233,0.05],
                [0.41,  0.233,0.048]
            ],
            doorOutlineMLVertices = doorOutlineMLVerticesArr.map(toVectors),
            doorOutlineMLGeo = new THREE.Geometry();

        doorOutlineMLGeo.vertices = doorOutlineMLVertices;

        let doorOutlineML = new THREE.Line(doorOutlineMLGeo,doorOutlineMat);
        this.mesh.add(doorOutlineML);

        // middle right
        let doorOutlineMRVerticesArr = doorOutlineMLVerticesArr.map(flipXVertices),
            doorOutlineMRVertices = doorOutlineMRVerticesArr.map(toVectors),
            doorOutlineMRGeo = new THREE.Geometry();

        doorOutlineMRGeo.vertices = doorOutlineMRVertices;

        let doorOutlineMR = new THREE.Line(doorOutlineMRGeo,doorOutlineMat);
        this.mesh.add(doorOutlineMR);

        // back left
        let doorOutlineBLVerticesArr = [
                [0.399, -0.23, -0.1313],
                [0.45,  -0.152,-0.1359],
                [0.4505,0.195, -0.1406],
                [0.424, 0.2705,-0.1396],
                [0.4,   0.2705,-0.1396]
            ],
            doorOutlineBLVertices = doorOutlineBLVerticesArr.map(toVectors),
            doorOutlineBLGeo = new THREE.Geometry();

        doorOutlineBLGeo.vertices = doorOutlineBLVertices;

        let doorOutlineBL = new THREE.Line(doorOutlineBLGeo,doorOutlineMat);
        this.mesh.add(doorOutlineBL);

        // back right
        let doorOutlineBRVerticesArr = doorOutlineBLVerticesArr.map(flipXVertices),
            doorOutlineBRVertices = doorOutlineBRVerticesArr.map(toVectors),
            doorOutlineBRGeo = new THREE.Geometry();

        doorOutlineBRGeo.vertices = doorOutlineBRVertices;

        let doorOutlineBR = new THREE.Line(doorOutlineBRGeo,doorOutlineMat);
        this.mesh.add(doorOutlineBR);

        // D. Fuel Cap
        let fuelCapVerticesArr = [
                [0.4502,-0.014,-0.378],
                [0.4502,-0.014,-0.4],
                [0.4502,0.06,  -0.4],
                [0.4502,0.06,  -0.36],
            ],
            fuelCapVertices = fuelCapVerticesArr.map(toVectors),
            fuelCapGeo = new THREE.Geometry();

        fuelCapGeo.vertices = fuelCapVertices;

        let fuelCap = new THREE.Line(fuelCapGeo,doorOutlineMat);
        this.mesh.add(fuelCap);

        // II. Top Parts
        // A. Window
        let windowMat = new THREE.MeshStandardMaterial({
                color: 0x101010,
                wireframe: this.wireframes
            }),
            lightMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: this.wireframes
            }),
            topWindowVerticesArr = [
                [-0.371, 0.415,-0.13],
                [0.371,  0.415,-0.13],
                [-0.326, 0.5,  0.08],
                [0.326,  0.5,  0.08],
                [-0.4145,0.2,  0.36],
                [0.4145, 0.2,  0.36]
            ],
            topWindowVertices = topWindowVerticesArr.map(toVectors),
            topWindowFacesArr = [
                [1,0,2],
                [2,3,1],
                [3,2,4],
                [4,5,3]
            ],
            topWindowFaces = topWindowFacesArr.map(toFaces),
            topWindowGeo = new THREE.Geometry();

        topWindowGeo.vertices = topWindowVertices;
        topWindowGeo.faces = topWindowFaces;
        topWindowGeo.computeVertexNormals();
        topWindowGeo.computeFaceNormals();

        let topWindow = new THREE.Mesh(topWindowGeo,windowMat);
        this.mesh.add(topWindow);

        // B. Light
        let topLightVerticesArr = [
                [-0.26,0.49,0.09],
                [0.26, 0.49,0.09],
                [-0.26,0.48,0.1],
                [0.26, 0.48,0.1]
            ],
            topLightVertices = topLightVerticesArr.map(toVectors),
            topLightFacesArr = [
                [1,0,2],
                [2,3,1]
            ],
            topLightFaces = topLightFacesArr.map(toFaces),
            topLightGeo = new THREE.Geometry();

        topLightGeo.vertices = topLightVertices;
        topLightGeo.faces = topLightFaces;
        topLightGeo.computeFaceNormals();

        let topLight = new THREE.Mesh(topLightGeo,lightMat);
        this.mesh.add(topLight);

        // C. Sliding Door
        let slidingDoorMat = new THREE.MeshStandardMaterial({
                color: 0x767c7f,
                wireframe: this.wireframes
            }),
            slidingDoorVerticesArr = [
                [-0.35,0.274,-0.472],
                [0.35, 0.274,-0.472],
                [-0.35,0.407,-0.145],
                [0.35, 0.407,-0.145]
            ],
            slidingDoorVertices = slidingDoorVerticesArr.map(toVectors),
            slidingDoorFacesArr = [
                [1,0,2],
                [2,3,1]
            ],
            slidingDoorFaces = slidingDoorFacesArr.map(toFaces),
            slidingDoorGeo = new THREE.Geometry();

        slidingDoorGeo.vertices = slidingDoorVertices;
        slidingDoorGeo.faces = slidingDoorFaces;
        slidingDoorGeo.computeFaceNormals();

        let slidingDoor = new THREE.Mesh(slidingDoorGeo,slidingDoorMat);
        this.mesh.add(slidingDoor);

        // III. Side Windows
        let sideWindowsVerticesArr = [
                [-0.4,  0.27,-0.14],
                [0.4,   0.27,-0.14],
                [-0.351,0.39,-0.13],
                [0.351, 0.39,-0.13],
                [-0.315,0.47,0.08],
                [0.315, 0.47,0.08],
                [-0.43, 0.17,0.36],
                [0.43,  0.17,0.36]
            ],
            sideWindowsVertices = sideWindowsVerticesArr.map(toVectors),
            sideWindowsFacesArr = [
                [2,3,1],
                [1,0,2],
                [2,4,5],
                [5,3,2],
                [4,6,7],
                [7,5,4],
                [4,2,0],
                [0,6,4],
                [5,7,1],
                [1,3,5],
                [0,1,7],
                [7,6,0]
            ],
            sideWindowsFaces = sideWindowsFacesArr.map(toFaces),
            sideWindowsGeo = new THREE.Geometry();

        sideWindowsGeo.vertices = sideWindowsVertices;
        sideWindowsGeo.faces = sideWindowsFaces;
        sideWindowsGeo.computeVertexNormals();
        sideWindowsGeo.computeFaceNormals();

        let sideWindows = new THREE.Mesh(sideWindowsGeo,windowMat);
        this.mesh.add(sideWindows);

        // IV. Front Lights
        // A. Upper
        let frontLightVerticesArr = [
                [-0.45,  0.075,0.4701],
                [-0.33,  0.04, 0.4999],
                [0.33,   0.04, 0.4999],
                [0.45,   0.075,0.4701],

                [-0.45,  0.043,0.4685],
                [-0.3315,0.02, 0.4985],
                [0.3315, 0.02, 0.4985],
                [0.45,   0.043,0.4685]
            ],
            frontLightVertices = frontLightVerticesArr.map(toVectors),
            frontLightFacesArr = [
                [1,0,4],
                [4,5,1],
                [2,1,5],
                [5,6,2],
                [3,2,6],
                [6,7,3]
            ],
            frontLightFaces = frontLightFacesArr.map(toFaces),
            frontLightGeo = new THREE.Geometry();

        frontLightGeo.vertices = frontLightVertices;
        frontLightGeo.faces = frontLightFaces;
        frontLightGeo.computeFaceNormals();

        let frontLight = new THREE.Mesh(frontLightGeo,lightMat);
        this.mesh.add(frontLight);

        // B. Lower
        let lowerLightMat = new THREE.MeshBasicMaterial({
                color: 0xff9e59,
                wireframe: this.wireframes
            }),
            lowerLFrontLightVerticesArr = [
                [0.343,-0.13,0.4881],
                [0.45, -0.13,0.4601],
                [0.343,-0.12,0.4885],
                [0.45, -0.12,0.4605]
            ],
            lowerLFrontLightVertices = lowerLFrontLightVerticesArr.map(toVectors),
            lowerLFrontLightFacesArr = [
                [0,1,3],
                [3,2,0]
            ],
            lowerLFrontLightFaces = lowerLFrontLightFacesArr.map(toFaces),
            lowerLFrontLightGeo = new THREE.Geometry();

        // left
        lowerLFrontLightGeo.vertices = lowerLFrontLightVertices;
        lowerLFrontLightGeo.faces = lowerLFrontLightFaces;
        lowerLFrontLightGeo.computeFaceNormals();

        let lowerLFrontLight = new THREE.Mesh(lowerLFrontLightGeo,lowerLightMat);
        this.mesh.add(lowerLFrontLight);

        // right
        let lowerRFrontLightVerticesArr = lowerLFrontLightVerticesArr.map(flipXVertices),
            lowerRFrontLightVertices = lowerRFrontLightVerticesArr.map(toVectors),
            lowerRFrontLightFacesArr = lowerLFrontLightFacesArr.map(reverseFaceDraws),
            lowerRFrontLightFaces = lowerRFrontLightFacesArr.map(toFaces),
            lowerRFrontLightGeo = new THREE.Geometry();

        lowerRFrontLightGeo.vertices = lowerRFrontLightVertices;
        lowerRFrontLightGeo.faces = lowerRFrontLightFaces;
        lowerRFrontLightGeo.computeFaceNormals();

        let lowerRFrontLight = new THREE.Mesh(lowerRFrontLightGeo,lowerLightMat);
        this.mesh.add(lowerRFrontLight);

        // V. Back Light
        let backLightGeo = new THREE.PlaneGeometry(W*0.9,H*0.06),
            backLightMat = new THREE.MeshStandardMaterial({
                color: 0x101010,
                wireframe: this.wireframes
            }),
            backLight = new THREE.Mesh(backLightGeo,backLightMat);

        backLightGeo.translate(0,H*0.03,0);
        backLight.position.set(0,H*0.26,D*-0.5);
        backLight.rotation.set(171 * Math.PI/180,0,0);

        // red part
        let backLightInnerGeo = new THREE.PlaneGeometry(W*0.9 - H*0.04, H*0.02),
            backLightInnerMat = new THREE.MeshBasicMaterial({
                color: 0xd65a65,
                wireframe: this.wireframes
            }),
            backLightInner = new THREE.Mesh(backLightInnerGeo,backLightInnerMat);

        backLightInnerGeo.translate(0,H*0.03,0);
        backLightInner.position.set(0,0,0.01);
        backLight.add(backLightInner);

        let backLightAreaGeo = new THREE.PlaneGeometry(W*0.18, H*0.02),
            backLightAreaMat = new THREE.MeshBasicMaterial({
                color: 0xfdffb8,
                wireframe: this.wireframes
            }),
            backLightArea2 = new THREE.Mesh(backLightAreaGeo,backLightAreaMat);

        // middle light
        backLightAreaGeo.translate(0,H*0.03,0);
        backLightArea2.position.set(0,0,0.01);
        backLightInner.add(backLightArea2);

        // left light
        let backLightArea1 = backLightArea2.clone();
        backLightArea1.position.set(W*-0.33,0,0.01);
        backLightInner.add(backLightArea1);

        // right light
        let backLightArea3 = backLightArea2.clone();
        backLightArea3.position.set(W*0.33,0,0.01);
        backLightInner.add(backLightArea3);

        this.mesh.add(backLight);

        // VI. Left Side Part Above Wheels
        let sideMat = new THREE.MeshStandardMaterial({
                color: 0x2b2b2b,
                wireframe: this.wireframes
            }),
            leftSideVerticesArr = [
                // top (0–19)
                [0.45, -0.1,  -0.4],
                [0.5,  -0.1,  -0.3825],
                [0.45, 0.06,  -0.36],
                [0.5,  0.03,  -0.35],
                [0.45, 0.06,  -0.236],
                [0.5,  0.03,  -0.24],
                [0.45, -0.15, -0.18],
                [0.5,  -0.15, -0.192],
                [0.41, -0.21, -0.173],
                [0.48, -0.21, -0.19],
                [0.41, -0.23, 0.2498],
                [0.48, -0.23, 0.261],
                [0.45, -0.17, 0.255],
                [0.5,  -0.17, 0.263],
                [0.45, 0.06,  0.3015],
                [0.5,  0.03,  0.3035],
                [0.45, 0.06,  0.42],
                [0.5,  0.03,  0.4165],
                [0.45, -0.13, 0.46],
                [0.5,  -0.13, 0.45],
                // bottom (20–41)
                [0.45, -0.074,-0.379],
                [0.5,  -0.1,  -0.3775],
                [0.45, 0.04,  -0.35],
                [0.5,  0.015, -0.348],
                [0.45, 0.04,  -0.2505],
                [0.5,  0.015, -0.2435],
                [0.45, -0.15, -0.197],
                [0.5,  -0.15, -0.197],
                [0.355,-0.29, -0.19],
                [0.4,  -0.29, -0.19],
                [0.355,-0.31, 0.2582],
                [0.4,  -0.31, 0.26],
                [0.45, -0.17, 0.265],
                [0.5,  -0.17, 0.267],
                [0.45, 0.04,  0.3099],
                [0.5,  0.015, 0.3065],
                [0.45, 0.04,  0.418],
                [0.5,  0.015, 0.4135],
                [0.45, -0.13, 0.455],
                [0.5,  -0.13, 0.445],
                [0.48, -0.21, -0.194],
                [0.48, -0.23, 0.265]
            ],
            leftSideVertices = leftSideVerticesArr.map(toVectors),
            leftSideFacesArr = [
                [0,2,3],
                [3,1,0],
                [2,4,5],
                [5,3,2],
                [4,6,7],
                [7,5,4],
                [6,8,9],
                [9,7,6],
                [8,10,11],
                [11,9,8],
                [10,12,13],
                [13,11,10],
                [12,14,15],
                [15,13,12],
                [14,16,17],
                [17,15,14],
                [16,18,19],
                [19,17,16],
                [23,22,20],
                [20,21,23],
                [25,24,22],
                [22,23,25],
                [27,26,24],
                [24,25,27],
                [31,30,28],
                [28,29,31],
                [35,34,32],
                [32,33,35],
                [37,36,34],
                [34,35,37],
                [39,38,36],
                [36,37,39],
                [0,1,21],
                [21,20,0],
                [20,22,2],
                [2,0,20],
                [22,24,4],
                [4,2,22],
                [24,26,6],
                [6,4,24],
                [26,28,8],
                [8,6,26],
                [28,30,10],
                [10,8,28],
                [30,32,12],
                [12,10,30],
                [32,34,14],
                [14,12,32],
                [34,36,16],
                [16,14,34],
                [36,38,18],
                [18,16,36],
                [3,23,21],
                [21,1,3],
                [5,25,23],
                [23,3,5],
                [7,27,25],
                [25,5,7],
                [27,7,9],
                [9,40,27],
                [40,9,29],
                [26,27,40],
                [40,29,26],
                [26,29,28],
                [11,31,29],
                [29,9,11],
                [11,41,31],
                [13,33,41],
                [41,11,13],
                [33,32,30],
                [30,41,33],
                [41,10,30],
                [30,31,41],
                [15,35,33],
                [33,13,15],
                [17,37,35],
                [35,15,17],
                [19,39,37],
                [37,17,19],
                [38,39,19],
                [19,18,38]
            ],
            leftSideFaces = leftSideFacesArr.map(toFaces),
            leftSideGeo = new THREE.Geometry();

        leftSideGeo.vertices = leftSideVertices;
        leftSideGeo.faces = leftSideFaces;
        leftSideGeo.computeFaceNormals();

        let leftSide = new THREE.Mesh(leftSideGeo,sideMat);
        leftSide.castShadow = true;
        this.mesh.add(leftSide);

        // VII. Right Side Part Above Wheels
        let rightSideVerticesArr = leftSideVerticesArr.map(flipXVertices),
            rightSideVertices = rightSideVerticesArr.map(toVectors),
            rightSideFacesArr = leftSideFacesArr.map(reverseFaceDraws),
            rightSideFaces = rightSideFacesArr.map(toFaces),
            rightSideGeo = new THREE.Geometry();

        rightSideGeo.vertices = rightSideVertices;
        rightSideGeo.faces = rightSideFaces;
        rightSideGeo.computeFaceNormals();

        let rightSide = new THREE.Mesh(rightSideGeo,sideMat);
        rightSide.castShadow = true;
        this.mesh.add(rightSide);

        // VIII. Back
        // A. Connecting Bumper
        let backVerticesArr = [
                [-0.423,-0.1,  -0.47],
                [0.423, -0.1,  -0.47],
                [-0.423,-0.222,-0.47],
                [0.423, -0.222,-0.47],
                [-0.423,-0.1,  -0.38],
                [0.423, -0.1,  -0.38],
                [-0.423,-0.285,-0.4],
                [0.423, -0.285,-0.4]
            ],
            backVertices = backVerticesArr.map(toVectors),
            backFacesArr = [
                [0,1,3],
                [3,2,0],
                [4,0,2],
                [2,6,4],
                [1,5,7],
                [7,3,1],
                [1,0,4],
                [4,5,1],
                [5,4,6],
                [6,7,5],
                [2,3,7],
                [7,6,2]
            ],
            backFaces = backFacesArr.map(toFaces),
            backGeo = new THREE.Geometry(),
            backMat = new THREE.MeshStandardMaterial({
                color: 0x101010,
                wireframe: this.wireframes
            });

        backGeo.vertices = backVertices;
        backGeo.faces = backFaces;
        backGeo.computeFaceNormals();

        let back = new THREE.Mesh(backGeo,backMat);
        this.mesh.add(back);

        // B. Red Lines
        let redLinesMat = new THREE.MeshStandardMaterial({
                color: 0xd81937,
                wireframe: this.wireframes
            }),
            leftRedLinesVerticesArr = [
                [0.356, -0.115,-0.4701],
                [0.4231,-0.115,-0.4701],
                [0.4231,-0.115,-0.385],
                [0.356, -0.135,-0.4701],
                [0.4231,-0.135,-0.4701],
                [0.4231,-0.135,-0.387]
            ],
            leftRedLinesVertices = leftRedLinesVerticesArr.map(toVectors),
            leftRedLinesFacesArr = [
                [0,1,4],
                [4,3,0],
                [1,2,5],
                [5,4,1]
            ],
            leftRedLinesFaces = leftRedLinesFacesArr.map(toFaces),
            leftRedLinesGeo = new THREE.Geometry();

        // left
        leftRedLinesGeo.vertices = leftRedLinesVertices;
        leftRedLinesGeo.faces = leftRedLinesFaces;
        leftRedLinesGeo.computeFaceNormals();

        let leftRedLines = new THREE.Mesh(leftRedLinesGeo,redLinesMat);
        this.mesh.add(leftRedLines);

        let leftSmallBackLightVerticesArr = [
                [0.4,   -0.135,-0.4702],
                [0.4231,-0.135,-0.4702],
                [0.4,   -0.115,-0.4702],
                [0.4231,-0.115,-0.4702]
            ],
            leftSmallBackLightVertices = leftSmallBackLightVerticesArr.map(toVectors),
            leftSmallBackLightFacesArr = [
                [2,3,1],
                [1,0,2]
            ],
            leftSmallBackLightFaces = leftSmallBackLightFacesArr.map(toFaces),
            leftSmallBackLightGeo = new THREE.Geometry();

        leftSmallBackLightGeo.vertices = leftSmallBackLightVertices;
        leftSmallBackLightGeo.faces = leftSmallBackLightFaces;
        leftSmallBackLightGeo.computeFaceNormals();

        let leftSmallBackLight = new THREE.Mesh(leftSmallBackLightGeo,backLightInnerMat);
        this.mesh.add(leftSmallBackLight);

        // right
        let rightRedLinesVerticesArr = leftRedLinesVerticesArr.map(flipXVertices),
            rightRedLinesVertices = rightRedLinesVerticesArr.map(toVectors),
            rightRedLinesFacesArr = [
                [1,0,3],
                [3,4,1],
                [2,1,4],
                [4,5,2]
            ],
            rightRedLinesFaces = rightRedLinesFacesArr.map(toFaces),
            rightRedLinesGeo = new THREE.Geometry();

        rightRedLinesGeo.vertices = rightRedLinesVertices;
        rightRedLinesGeo.faces = rightRedLinesFaces;
        rightRedLinesGeo.computeFaceNormals();

        let rightRedLines = new THREE.Mesh(rightRedLinesGeo,redLinesMat);
        this.mesh.add(rightRedLines);

        let rightSmallBackLightVerticesArr = leftSmallBackLightVerticesArr.map(flipXVertices),
            rightSmallBackLightVertices = rightSmallBackLightVerticesArr.map(toVectors),
            rightSmallBackLightFacesArr = leftSmallBackLightFacesArr.map(reverseFaceDraws),
            rightSmallBackLightFaces = rightSmallBackLightFacesArr.map(toFaces),
            rightSmallBackLightGeo = new THREE.Geometry();

        rightSmallBackLightGeo.vertices = rightSmallBackLightVertices;
        rightSmallBackLightGeo.faces = rightSmallBackLightFaces;
        rightSmallBackLightGeo.computeFaceNormals();

        let rightSmallBackLight = new THREE.Mesh(rightSmallBackLightGeo,backLightInnerMat);
        this.mesh.add(rightSmallBackLight);

        // C. Bumper
        let backBumperVerticesArr = [
                [-0.452,-0.15, -0.49],
                [-0.143,-0.15, -0.49],
                [-0.415,-0.223,-0.49],
                [-0.128,-0.223,-0.49],
                [0.143, -0.15, -0.49],
                [0.452, -0.15, -0.49],
                [0.128, -0.223,-0.49],
                [0.415, -0.223,-0.49],
                [-0.208,-0.25, -0.49],
                [0.208, -0.25, -0.49],
                [-0.423,-0.286,-0.4],
                [-0.226,-0.311,-0.4],
                [0.226, -0.311,-0.4],
                [0.423, -0.286,-0.4],
                [-0.424,-0.15, -0.47],
                [-0.143,-0.15, -0.47],
                [0.143, -0.15, -0.47],
                [0.424, -0.15, -0.47],
                [-0.128,-0.223,-0.47],
                [0.128, -0.223,-0.47],
                [-0.5,  -0.15, -0.385],
                [-0.424,-0.15, -0.385],
                [0.424, -0.15, -0.385],
                [0.5,   -0.15, -0.385],
                [-0.424,-0.223,-0.47],
                [0.424, -0.223,-0.47],
                [-0.226,-0.286,-0.4],
                [0.226, -0.286,-0.4]
            ],
            backBumperVertices = backBumperVerticesArr.map(toVectors),
            backBumperFacesArr = [
                [0,1,3],
                [3,2,0],
                [4,5,7],
                [7,6,4],
                [2,3,8],
                [6,7,9],
                [6,9,8],
                [3,6,8],
                [2,8,11],
                [11,10,2],
                [8,9,12],
                [12,11,8],
                [9,7,13],
                [13,12,9],
                [14,15,1],
                [1,0,14],
                [16,17,5],
                [5,4,16],
                [1,15,18],
                [18,3,1],
                [16,4,6],
                [6,19,16],
                [18,19,6],
                [6,3,18],
                [20,21,14],
                [20,14,0],
                [22,23,17],
                [23,5,17],
                [20,0,2],
                [2,10,20],
                [7,5,23],
                [23,13,7],
                [21,20,10],
                [23,22,13],
                [14,21,10],
                [10,24,14],
                [15,14,24],
                [24,18,15],
                [16,19,25],
                [25,17,16],
                [17,25,13],
                [13,22,17],
                [18,24,10],
                [10,26,18],
                [19,18,26],
                [26,27,19],
                [25,19,27],
                [27,13,25],
                [26,10,11],
                [27,26,11],
                [11,12,27],
                [13,27,12]
            ],
            backBumperFaces = backBumperFacesArr.map(toFaces),
            backBumperGeo = new THREE.Geometry();

        backBumperGeo.vertices = backBumperVertices;
        backBumperGeo.faces = backBumperFaces;
        backBumperGeo.computeFaceNormals();

        let backBumper = new THREE.Mesh(backBumperGeo,sideMat);
        backBumper.castShadow = true;
        this.mesh.add(backBumper);

        // IX. Front Bumper
        let frontBumperVerticesArr = [
                [-0.5,  -0.13, 0.4501],
                [0.5,   -0.13, 0.4501],
                [-0.346,-0.13, 0.495],
                [0.346, -0.13, 0.495],
                [-0.5,  -0.194,0.4501],
                [0.5,   -0.194,0.4501],
                [-0.346,-0.194,0.495],
                [0.346, -0.194,0.495],
                [-0.466,-0.242,0.4501],
                [0.466, -0.242,0.4501],
                [-0.346,-0.242,0.485],
                [0.346, -0.242,0.485],
                [-0.346,-0.31, 0.4501],
                [0.346, -0.31, 0.4501],
                [-0.346,-0.194,0.47],
                [0.346, -0.194,0.47],
                [-0.346,-0.242,0.47],
                [0.346, -0.242,0.47]
            ],
            frontBumperVertices = frontBumperVerticesArr.map(toVectors),
            frontBumperFacesArr = [
                [0,1,5],
                [5,4,0],
                [1,0,2],
                [2,3,1],
                [2,0,4],
                [4,6,2],
                [3,2,6],
                [6,7,3],
                [1,3,7],
                [7,5,1],
                [4,5,9],
                [9,8,4],
                [6,4,8],
                [8,10,6],
                [5,7,11],
                [11,9,5],
                [8,9,13],
                [13,12,8],
                [10,8,12],
                [11,10,12],
                [12,13,11],
                [9,11,13],
                [14,15,7],
                [7,6,14],
                [15,14,16],
                [16,17,15],
                [17,16,10],
                [10,11,17],
                [14,6,10],
                [10,16,14],
                [7,15,17],
                [17,11,7]
            ],
            frontBumperFaces = frontBumperFacesArr.map(toFaces),
            frontBumperGeo = new THREE.Geometry();

        frontBumperGeo.vertices = frontBumperVertices;
        frontBumperGeo.faces = frontBumperFaces;
        frontBumperGeo.computeFaceNormals();

        let frontBumper = new THREE.Mesh(frontBumperGeo,sideMat);
        frontBumper.castShadow = true;
        this.mesh.add(frontBumper);

        // X. Front Cylinders
        let cylinderGeo = new THREE.CylinderBufferGeometry(W*0.025,W*0.025,H*0.32,32),
            cylinderMat = new THREE.MeshStandardMaterial({
                color: 0x969696,
                wireframe: this.wireframes
            }),
            leftCylinder = new THREE.Mesh(cylinderGeo,cylinderMat);

        // left
        leftCylinder.position.set(W*0.33,H*-0.09,D*0.355);
        leftCylinder.rotation.x = -5 *Math.PI/180;
        this.mesh.add(leftCylinder);

        // right
        let rightCylinder = leftCylinder.clone();
        rightCylinder.position.x *= -1;
        this.mesh.add(rightCylinder);

        // XI. Axles
        // A. Axels Themselves
        let axleGeo = new THREE.CylinderBufferGeometry(W*0.02,W*0.02,W*0.72,32),
            axleMat = new THREE.MeshStandardMaterial({
                color: 0x7f7f7f,
                wireframe: this.wireframes
            }),
            frontAxle = new THREE.Mesh(axleGeo,axleMat);

        // front
        frontAxle.position.set(0,H*-0.27,D*0.36);
        frontAxle.rotation.z = -Math.PI/2;
        this.mesh.add(frontAxle);

        // back
        let backAxle = frontAxle.clone();
        backAxle.position.z = D*-0.3;
        this.mesh.add(backAxle);

        // B. Support Parts
        let supportMat = new THREE.MeshStandardMaterial({
                color: 0x595959,
                wireframe: this.wireframes
            }),
            frontAxleSupportVerticesArr = [
                // back (0–7)
                [-0.3,  -0.31, 0.2582],
                [0.3,   -0.31, 0.2582],
                [-0.3,  -0.17, 0.265],
                [0.3,   -0.17, 0.265],
                [-0.3,  -0.31, 0.31],
                [0.3,   -0.31, 0.31],
                [-0.3,  0.04,  0.31],
                [0.3,   0.04,  0.31],
                // front (8–15)
                [-0.3,  -0.31, 0.42],
                [0.3,   -0.31, 0.42],
                [-0.3,  0.04,  0.42],
                [0.3,   0.04,  0.42],
                [-0.3,  -0.31, 0.45],
                [0.3,   -0.31, 0.45],
                [-0.3,  -0.13, 0.45],
                [0.3,   -0.13, 0.45],
                // right side (16–22)
                [-0.355,-0.31, 0.2582],
                [-0.45, -0.17, 0.265],
                [-0.45, 0.04,  0.3099],
                [-0.45, 0.04,  0.42],
                [-0.45, -0.13, 0.45],
                [-0.45, -0.13, 0.455],
                [-0.346,-0.31, 0.45],
                // left side (23-29)
                [0.355, -0.31, 0.2582],
                [0.45,  -0.17, 0.265],
                [0.45,  0.04,  0.3099],
                [0.45,  0.04,  0.42],
                [0.45,  -0.13, 0.45],
                [0.45,  -0.13, 0.455],
                [0.346, -0.31, 0.45]
            ],
            frontAxleSupportVertices = frontAxleSupportVerticesArr.map(toVectors),
            frontAxleSupportFacesArr = [
                [2,3,1],
                [1,0,2],
                [6,7,3],
                [3,2,6],
                [7,6,10],
                [10,11,7],
                [11,10,14],
                [14,15,11],
                [15,14,12],
                [12,13,15],
                [6,2,0],
                [0,4,6],
                [10,6,4],
                [4,8,10],
                [14,10,8],
                [8,12,14],
                [3,7,5],
                [5,1,3],
                [7,11,9],
                [9,5,7],
                [11,15,13],
                [13,9,11],
                [0,1,5],
                [5,4,0],
                [4,5,9],
                [9,8,4],
                [8,9,13],
                [13,12,8],
                [0,2,17],
                [17,16,0],
                [6,18,2],
                [2,18,17],
                [18,6,10],
                [10,19,18],
                [19,10,14],
                [14,20,19],
                [19,20,21],
                [20,14,12],
                [12,22,20],
                [3,1,23],
                [23,24,3],
                [7,3,24],
                [24,25,7],
                [7,25,26],
                [26,11,7],
                [11,26,27],
                [27,15,11],
                [28,27,26],
                [15,27,29],
                [29,13,15]
            ],
            frontAxleSupportFaces = frontAxleSupportFacesArr.map(toFaces),
            frontAxleSupportGeo = new THREE.Geometry();

        frontAxleSupportGeo.vertices = frontAxleSupportVertices;
        frontAxleSupportGeo.faces = frontAxleSupportFaces;
        frontAxleSupportGeo.computeFaceNormals();

        let frontAxleSupport = new THREE.Mesh(frontAxleSupportGeo,supportMat);
        frontAxleSupport.castShadow = true;
        this.mesh.add(frontAxleSupport);

        let backAxleSupportVerticesArr = [
                // back (0–7)
                [-0.3,  -0.29, -0.3999],
                [0.3,   -0.29, -0.3999],
                [-0.3,  -0.1,  -0.38],
                [0.3,   -0.1,  -0.38],
                [-0.3,  -0.31, -0.35],
                [0.3,   -0.31, -0.35],
                [-0.3,  0.04,  -0.35],
                [0.3,   0.04,  -0.35],
                // front (8–15)
                [-0.3,  -0.31, -0.24],
                [0.3,   -0.31, -0.24],
                [-0.3,  0.04,  -0.24],
                [0.3,   0.04,  -0.24],
                [-0.3,  -0.29, -0.19],
                [0.3,   -0.29, -0.19],
                [-0.3,  -0.15, -0.19],
                [0.3,   -0.15, -0.19],
                // right side (16–22)
                [-0.423,-0.285,-0.3999],
                [-0.423,-0.1,  -0.3799],
                [-0.45, 0.04,  -0.3501],
                [-0.45, 0.04,  -0.24],
                [-0.45, -0.15, -0.19],
                [-0.45, -0.15, -0.197],
                [-0.355,-0.29, -0.19],
                // left side (23-29)
                [0.423, -0.285,-0.3999],
                [0.423, -0.1,  -0.3799],
                [0.45,  0.04,  -0.3501],
                [0.45,  0.04,  -0.24],
                [0.45,  -0.15, -0.19],
                [0.45,  -0.15, -0.197],
                [0.355, -0.29, -0.19]
            ],
            backAxleSupportVertices = backAxleSupportVerticesArr.map(toVectors),
            backAxleSupportFacesArr = [
                [2,3,1],
                [1,0,2],
                [6,7,3],
                [3,2,6],
                [7,6,10],
                [10,11,7],
                [11,10,14],
                [14,15,11],
                [15,14,12],
                [12,13,15],
                [6,2,0],
                [0,4,6],
                [10,6,4],
                [4,8,10],
                [14,10,8],
                [8,12,14],
                [3,7,5],
                [5,1,3],
                [7,11,9],
                [9,5,7],
                [11,15,13],
                [13,9,11],
                [0,1,5],
                [5,4,0],
                [4,5,9],
                [9,8,4],
                [8,9,13],
                [13,12,8],
                [0,2,17],
                [17,16,0],
                [6,18,2],
                [2,18,17],
                [18,6,10],
                [10,19,18],
                [19,10,14],
                [14,20,19],
                [20,14,12],
                [12,22,20],
                [3,1,23],
                [23,24,3],
                [7,3,24],
                [24,25,7],
                [7,25,26],
                [26,11,7],
                [11,26,27],
                [27,15,11],
                [15,27,29],
                [29,13,15]
            ],
            backAxleSupportFaces = backAxleSupportFacesArr.map(toFaces),
            backAxleSupportGeo = new THREE.Geometry();

        backAxleSupportGeo.vertices = backAxleSupportVertices;
        backAxleSupportGeo.faces = backAxleSupportFaces;
        backAxleSupportGeo.computeFaceNormals();

        let backAxleSupport = new THREE.Mesh(backAxleSupportGeo,supportMat);
        backAxleSupport.castShadow = true;
        this.mesh.add(backAxleSupport);

        // C. Bottom Plane Between
        let bottomVerticesArr = [
                [-0.355,-0.29,-0.19],
                [-0.3,  -0.29,-0.19],
                [0.3,   -0.29,-0.19],
                [0.355, -0.29,-0.19],
                [-0.355,-0.31,0.2582],
                [-0.3,  -0.31,0.2582],
                [0.3,   -0.31,0.2582],
                [0.355, -0.31,0.2582]
            ],
            bottomVertices = bottomVerticesArr.map(toVectors),
            bottomFacesArr = [
                [0,1,5],
                [5,4,0],
                [1,2,6],
                [6,5,1],
                [2,3,7],
                [7,6,2]
            ],
            bottomFaces = bottomFacesArr.map(toFaces),
            bottomGeo = new THREE.Geometry();

        bottomGeo.vertices = bottomVertices;
        bottomGeo.faces = bottomFaces;
        bottomGeo.computeFaceNormals();

        let bottom = new THREE.Mesh(bottomGeo,supportMat);
        bottom.castShadow = true;
        this.mesh.add(bottom);




        // XIII. Wheels
        // A. Tire
        let wheelGeo = new THREE.CylinderBufferGeometry(H*0.23,H*0.23,W*0.14,32),
            wheelMat = new THREE.MeshLambertMaterial({
                color: 0x1c1c1c,
                wireframe: this.wireframes
            });

        this.wheels = [
            new THREE.Mesh(wheelGeo,wheelMat)
        ];

        // B. Hub
        let wheelHub = new THREE.Object3D();
        wheelHub.position.y = W*0.075;
        this.wheels[0].add(wheelHub);

        let hubBaseGeo = new THREE.CylinderBufferGeometry(H*0.16,H*0.17,W*0.01,7),
            hubBaseMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                wireframe: this.wireframes
            }),
            hubBase = new THREE.Mesh(hubBaseGeo,hubBaseMat);
        wheelHub.add(hubBase);

        let hubCenterGeo = new THREE.TorusBufferGeometry(H*0.03,H*0.03,4,7),
            hubCenter = new THREE.Mesh(hubCenterGeo,hubBaseMat);
        hubCenter.position.y = W*0.005;
        hubCenter.rotation.x = -Math.PI/2;
        hubCenter.rotation.z = 3/28 * Math.PI*2;
        hubBase.add(hubCenter);

        let hubCenterPlateGeo = new THREE.CircleBufferGeometry(H*0.03,7),
            hubCenterPlate = new THREE.Mesh(hubCenterPlateGeo,hubBaseMat);
        hubCenterPlate.position.z = W*0.025;
        hubCenter.add(hubCenterPlate);

        let spokeVerticesArr = [
                // back (0–5)
                [-0.02,-0.063,-0.003],
                [0.02, -0.063,-0.003],
                [-0.02,0.03,  -0.003],
                [0.02, 0.03,  -0.003],
                [-0.02,0.063,-0.003],
                [0.02, 0.063,-0.003],
                // front (6–9)
                [-0.015,-0.063,0.003],
                [0.015, -0.063,0.003],
                [-0.015,0.03,0.003],
                [0.015, 0.03,0.003]
            ],
            spokeVertices = spokeVerticesArr.map(toVectors),
            spokeFacesArr = [
                [5,4,8],
                [8,9,5],
                [9,8,6],
                [6,7,9],
                [4,2,8],
                [5,9,3],
                [3,9,7],
                [7,1,3],
                [8,2,0],
                [0,6,8]
            ],
            spokeFaces = spokeFacesArr.map(toFaces),
            spokeGeo = new THREE.Geometry();

        spokeGeo.vertices = spokeVertices;
        spokeGeo.faces = spokeFaces;
        spokeGeo.computeFaceNormals();
        spokeGeo.translate(0,H*0.1135,0);

        let spoke = new THREE.Mesh(spokeGeo,hubBaseMat);
        spoke.rotation.z = 3/28 * Math.PI*2;
        hubCenter.add(spoke);

        for (let s = 1; s < 7; ++s) {
            let spokeClone = spoke.clone();
            spokeClone.rotation.z += ((Math.PI*2)/7) * s;
            hubCenter.add(spokeClone);
        }

        // C. Positioning and Cloning
        this.wheels[0].position.set(W*0.43,H*-0.27,D*0.36);
        this.wheels[0].rotation.z = -Math.PI/2;
        this.wheels[0].castShadow = true;
        this.wheels[0].receiveShadow = true;
        this.mesh.add(this.wheels[0]);

        this.wheels.push(this.wheels[0].clone());
        this.wheels[1].position.set(W*-0.43,H*-0.27,D*0.36);
        this.wheels[1].rotation.z = Math.PI/2;
        this.mesh.add(this.wheels[1]);

        this.wheels.push(this.wheels[0].clone());
        this.wheels[2].position.set(W*0.43,H*-0.27,D*-0.3);
        this.wheels[2].rotation.z = -Math.PI/2;
        this.mesh.add(this.wheels[2]);

        this.wheels.push(this.wheels[0].clone());
        this.wheels[3].position.set(W*-0.43,H*-0.27,D*-0.3);
        this.wheels[3].rotation.z = Math.PI/2;
        this.mesh.add(this.wheels[3]);

        // XIV. Light Effects
        this.headlight = new THREE.SpotLight(0x30d2d5,0);
        this.headlight.position.set(0,0,this.depth * 0.48);
        this.headlight.target.position.set(0,0,this.depth/2 + 0.1);
        this.headlight.angle = 75 * Math.PI/180;
        this.headlight.penumbra = 0.2;
        this.headlight.distance = -10;
        this.headlight.castShadow = true;
        this.headlight.shadow.mapSize = new THREE.Vector2(512,512);
        this.mesh.add(this.headlight);
        this.mesh.add(this.headlight.target);

        this.rearlight = new THREE.SpotLight(0xd65a65,0);
        this.rearlight.position.set(0,0,-this.depth * 0.42);
        this.rearlight.target.position.set(0,0,-this.depth/2 - 0.1);
        this.rearlight.angle = 60 * Math.PI/180;
        this.rearlight.penumbra = 0.2;
        this.rearlight.distance = 10;
        this.rearlight.castShadow = true;
        this.rearlight.shadow.mapSize = new THREE.Vector2(512,512);
        this.mesh.add(this.rearlight);
        this.mesh.add(this.rearlight.target);

    }
    move() {
        let fps = 60,
            scaleBy = 10,

            inchesInMile = 5280 * 12,
            incZ1MPH = (inchesInMile / 3600) / fps,
            incZ = incZ1MPH * this.speed,

            tireRadius = this.height * 0.23,
            feetPerMin = (this.speed * 5280) / 60,
            rpm = feetPerMin / (2 * Math.PI * (tireRadius / 12)),
            incRotate = (Math.PI * 2) * (rpm / 6e4) * (1e3 / fps);

        this.wheels.forEach(e => {
            e.rotation.x += incRotate / scaleBy;

            if (e.rotation.x >= Math.PI * 2)
                e.rotation.x = 0;
        });
        // this.mesh.position.z += incZ / scaleBy;
    }
}
