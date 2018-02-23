'use strict'

let camera, scene, renderer, clock, houseObject, rootObject
let mouseX = 0, mouseY = 0
const mouseXSensitivity = 3, mouseYSensitivity = 1
let orientationAlpha = 0, orientationBeta = 0, orientationGamma = 0
let hasMouseControls = false, hasGyroControls = false

let container = document.getElementById('3d-view')
let windowHalfX = container.clientWidth / 2
let windowHalfY = container.clientHeight / 2

let mixers = []

init()
animate()

function init() {

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 300)
    camera.lookAt(0,0,0)

    // scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)
    scene.fog = new THREE.Fog(0xffffff, 200, 1000)

    rootObject = new THREE.Object3D()
    scene.add(rootObject)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    hemisphereLight.position.set(0, 200, 0)
    rootObject.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(200, 200, 100)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.top = 180
    directionalLight.shadow.camera.bottom = -100
    directionalLight.shadow.camera.left = -120
    directionalLight.shadow.camera.right = 120
    rootObject.add(directionalLight);

    // ground
    const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    )
    groundMesh.rotation.x = - Math.PI / 2
    groundMesh.receiveShadow = true
    rootObject.add(groundMesh)

    const grid = new THREE.GridHelper(2000, 200, 0x000000, 0x000000)
    grid.material.opacity = 0.2
    grid.material.transparent = true
    rootObject.add(grid)

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
        rootObject.add(obj)
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
        orientationGamma = event.gamma
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
    const deltaTime = clock.getDelta()

    if (mixers.length > 0) {
        for (let i = 0; i < mixers.length; i ++) {
            mixers[i].update(deltaTime)
        }
    }

    requestAnimationFrame(animate)
    render(deltaTime)
}

function render(deltaTime) {
    const maxRotationPerSecond = 3

    if (rootObject && (hasMouseControls || hasGyroControls)) {
        let desiredRotationY = 0
        let desiredRotationX = 0

        if (hasGyroControls) {
            rootObject.rotation.x = THREE.Math.degToRad(-(orientationBeta - 90))
            rootObject.rotation.y = THREE.Math.degToRad(-orientationAlpha)
        } else if (hasMouseControls) {
            const fractionMouseX = (mouseX / container.clientWidth) * mouseXSensitivity
            const fractionMouseY = (Math.max(
                0,
                Math.min(
                    container.clientHeight,
                    mouseY
                )
            ) / container.clientHeight) * mouseYSensitivity

            desiredRotationY = fractionMouseX * Math.PI
            desiredRotationX = Math.max(0, Math.min(Math.PI / 2, fractionMouseY * Math.PI))
            rootObject.rotation.x = THREE.Math.lerp(
                rootObject.rotation.x,
                desiredRotationX,
                Math.min(deltaTime * maxRotationPerSecond,
                    Math.abs(rootObject.rotation.x - desiredRotationX))
            )
            rootObject.rotation.y = THREE.Math.lerp(
                rootObject.rotation.y,
                desiredRotationY,
                Math.min(deltaTime * maxRotationPerSecond,
                    Math.abs(rootObject.rotation.y - desiredRotationY))
            )
        }
    }

    renderer.render(scene, camera)
}
