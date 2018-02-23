'use strict'

let camera, scene, renderer, clock, houseObject
let mouseX = 0, mouseY = 0
let orientationAlpha = 0, orientationBeta = 0
let hasMouseControls = false, hasGyroControls = false

let container = document.getElementById('3d-view')
let windowHalfX = container.clientWidth / 2
let windowHalfY = container.clientHeight / 2

let mixers = []

init()
animate()

function init() {

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.z = 300

    // scene
    scene = new THREE.Scene()

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.8)
    camera.add(pointLight)
    scene.add(camera)

    // model
    const onProgress = xhr => {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100
            console.log(Math.round(percentComplete, 2) + '% downloaded')
        }
    }

    const loader = new THREE.FBXLoader()
    loader.load('models/MakerHouse_01.fbx', obj => {
        obj.mixer = new THREE.AnimationMixer( obj );
        mixers.push( obj.mixer );

        const action = obj.mixer.clipAction(obj.animations[0])
        action.play()
        action.setLoop(THREE.LoopPingPong)

        obj.position.y = 0
        scene.add(obj)
        houseObject = obj
    }, onProgress, err => console.error(err))

    clock = new THREE.Clock()

    //

    renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    document.addEventListener('mousemove', onDocumentMouseMove, false)

    window.addEventListener('deviceorientation', event => {
        hasGyroControls = true
        orientationAlpha = event.alpha
        orientationBeta = event.beta
    })

    //

    window.addEventListener('resize', onWindowResize, false)
}

function onWindowResize() {
    windowHalfX = container.clientWidth / 2
    windowHalfY = container.clientHeight / 2

    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()

    renderer.setSize(container.clientWidth, container.clientHeight)
}

function onDocumentMouseMove(event) {
    hasMouseControls = true
    mouseX = (event.clientX - windowHalfX) / 2
    mouseY = (event.clientY - windowHalfY) / 2
}

//

function animate() {
    if ( mixers.length > 0 ) {
        for ( var i = 0; i < mixers.length; i ++ ) {
            mixers[ i ].update( clock.getDelta() );
        }
    }

    requestAnimationFrame(animate)
    render()
}

function render() {
    const deltaTime = clock.getDelta()
    const maxRotationPerSecond = 0.1

    if (houseObject && (hasMouseControls || hasGyroControls)) {
        let desiredRotationY = 0
        let desiredRotationX = 0

        if (hasMouseControls) {
            desiredRotationY = -THREE.Math.degToRad((mouseX - camera.position.x))
            desiredRotationX = Math.max(0, THREE.Math.degToRad((-mouseY - camera.position.y)))
            houseObject.rotation.x = THREE.Math.lerp(
                houseObject.rotation.x,
                desiredRotationX,
                Math.min(maxRotationPerSecond, deltaTime)
            )
            houseObject.rotation.y = THREE.Math.lerp(
                houseObject.rotation.y,
                desiredRotationY,
                Math.min(maxRotationPerSecond, deltaTime)
            )
        } else if (hasGyroControls) {
            houseObject.rotation.x = THREE.Math.degToRad(-(orientationBeta - 90))
            houseObject.rotation.y = THREE.Math.degToRad(-orientationAlpha)
        }
    }

    renderer.render(scene, camera)
}
