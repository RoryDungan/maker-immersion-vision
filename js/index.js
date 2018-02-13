'use strict'

let container, stats
let camera, scene, renderer, clock, houseObject
let mouseX = 0, mouseY = 0

let windowHalfX = window.innerWidth / 2
let windowHalfY = window.innerHeight / 2

init()
animate()

function init() {
    container = document.createElement('div')
    document.body.appendChild(container)

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100)
    camera.position.z = 2.5

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

    const mtlLoader = new THREE.MTLLoader()
    mtlLoader.setPath('models/')
    mtlLoader.load('PUSHILIN_house.mtl', materials => {
        materials.preload()

        const objLoader = new THREE.OBJLoader()
        objLoader.setMaterials(materials)
        objLoader.setPath('models/')
        objLoader.load('PUSHILIN_house.obj', obj => {
            obj.position.y = 0;
            scene.add(obj)
            houseObject = obj
        }, onProgress, err => console.error(err))
    })

    clock = new THREE.Clock()

    //

    renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    document.addEventListener('mousemove', onDocumentMouseMove, false)

    window.addEventListener('deviceorientation', event => {

    })

    //

    window.addEventListener('resize', onWindowResize, false)
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2
    windowHalfY = window.innerHeight / 2

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 2
    mouseY = (event.clientY - windowHalfY) / 2
}

//

function animate() {
    requestAnimationFrame(animate)
    render()
}

function render() {
    const deltaTime = clock.getDelta()
    const maxRotationPerSecond = 0.1

    if (houseObject) {
        const desiredRotationY = -THREE.Math.degToRad((mouseX - camera.position.x))
        const desiredRotationX = THREE.Math.degToRad((-mouseY - camera.position.y))
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
    }

    renderer.render(scene, camera)
}
