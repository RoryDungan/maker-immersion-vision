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
    scene.background = new THREE.Color(0xffffff)
    scene.fog = new THREE.Fog(0xffffff, 200, 1000)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    hemisphereLight.position.set(0, 200, 0)
    scene.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(0, 200, 100)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.top = 180
    directionalLight.shadow.camera.bottom = -100
    directionalLight.shadow.camera.left = -120
    directionalLight.shadow.camera.right = 120
    scene.add(directionalLight);

    // ground
    const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    )
    groundMesh.rotation.x = - Math.PI / 2
    groundMesh.receiveShadow = true
    scene.add(groundMesh)

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000)
    grid.material.opacity = 0.2
    grid.material.transparent = true
    scene.add(grid)

    // model
    const onProgress = xhr => {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100
            console.log(Math.round(percentComplete, 2) + '% downloaded')
        }
    }

    const loader = new THREE.FBXLoader()
    loader.load('models/MakerHouse_01.FBX', obj => {
        obj.mixer = new THREE.AnimationMixer(obj)
        mixers.push(obj.mixer)

        const action = obj.mixer.clipAction(obj.animations[0])
        action.play()
        action.setLoop(THREE.LoopPingPong)

        obj.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })

        obj.position.y = 24
        scene.add(obj)
        houseObject = obj
    }, onProgress, err => console.error(err))

    clock = new THREE.Clock()

    //

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
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
