const accents = ['#ff4060', '#ffcc00', '#20ffa0', '#4060ff']
const shuffle = (accent = 0) => [
    { color: '#444', roughness: 0.1, metalness: 0.5 },
    { color: '#444', roughness: 0.1, metalness: 0.5 },
    { color: '#444', roughness: 0.1, metalness: 0.5 },
    { color: 'white', roughness: 0.1, metalness: 0.1 },
    { color: 'white', roughness: 0.1, metalness: 0.1 },
    { color: 'white', roughness: 0.1, metalness: 0.1 },
    { color: accents[accent], roughness: 0.1, accent: true },
    { color: accents[accent], roughness: 0.1, accent: true },
    { color: accents[accent], roughness: 0.1, accent: true },
    { color: '#444', roughness: 0.1 },
    { color: '#444', roughness: 0.3 },
    { color: '#444', roughness: 0.3 },
    { color: 'white', roughness: 0.1 },
    { color: 'white', roughness: 0.2 },
    { color: 'white', roughness: 0.1 },
    { color: accents[accent], roughness: 0.1, accent: true, transparent: true, opacity: 0.5 },
    { color: accents[accent], roughness: 0.3, accent: true },
    { color: accents[accent], roughness: 0.1, accent: true }
]

const accent = ref(0)
const click = () => {
    accent.value = (accent.value + 1) % accents.length
}
const connectors = computed(() => shuffle(accent.value))

const container = ref(null)
let scene, camera, renderer, world

onMounted(() => {
    // 初始化場景
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(17.5, window.innerWidth / window.innerHeight, 10, 40)
    camera.position.set(0, 0, 30)

    renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    container.value.appendChild(renderer.domElement)

    scene.background = new THREE.Color('#141622')

    // 初始化 Rapier 物理世界
    world = new RAPIER.World({ x: 0, y: 0, z: 0 }) // 重力設為 0

    // 創建 Pointer
    const pointer = createPointer(world)
    scene.add(pointer.mesh)

    // 創建 Spheres
    const spheres = connectors.value.map((props, i) => createSphere(props, i, world))
    spheres.forEach((sphere) => scene.add(sphere.mesh))

    // 創建 Lightformers
    const lightFormers = createLightFormers()
    scene.add(lightFormers)

    // 動畫循環
    const animate = () => {
        requestAnimationFrame(animate)
        world.step() // 更新物理世界
        updatePointer(pointer)
        renderer.render(scene, camera)
    }
    animate()

    // 點擊事件
    window.addEventListener('click', click)
})

onUnmounted(() => {
    window.removeEventListener('click', click)
})

function createSphere(props, i, world) {
    const geometry = new THREE.SphereGeometry(1, 64, 64)
    const material = new THREE.MeshStandardMaterial(props)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true

    // Rapier 剛體
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
        props.position?.[0] || THREE.MathUtils.randFloatSpread(10),
        props.position?.[1] || THREE.MathUtils.randFloatSpread(10),
        props.position?.[2] || THREE.MathUtils.randFloatSpread(10)
    )
    const rigidBody = world.createRigidBody(rigidBodyDesc)
    const colliderDesc = RAPIER.ColliderDesc.ball(1).setRestitution(0.5).setFriction(0.1)
    world.createCollider(colliderDesc, rigidBody)

    return { mesh, rigidBody }
}

function createPointer(world) {
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false })
    const mesh = new THREE.Mesh(geometry, material)

    // Rapier 剛體（Kinematic 類型）
    const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    const rigidBody = world.createRigidBody(rigidBodyDesc)
    const colliderDesc = RAPIER.ColliderDesc.ball(1)
    world.createCollider(colliderDesc, rigidBody)

    return { mesh, rigidBody }
}

function updatePointer(pointer) {
    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    ray.setFromCamera(mouse, camera)

    const direction = ray.ray.direction
    const distance = -camera.position.z / direction.z
    const position = ray.ray.origin.clone().add(direction.multiplyScalar(distance))

    pointer.rigidBody.setNextKinematicTranslation({
        x: position.x,
        y: position.y,
        z: position.z
    })
}

function createLightFormers() {
    const group = new THREE.Group()
    group.rotation.set(-Math.PI / 3, 0, 1)

    const light1 = new THREE.Mesh(
        new THREE.CircleGeometry(2, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, intensity: 100 })
    )
    light1.position.set(0, 5, -9)
    light1.rotation.x = Math.PI / 2
    group.add(light1)

    const light2 = new THREE.Mesh(
        new THREE.CircleGeometry(2, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, intensity: 2 })
    )
    light2.position.set(-5, 1, -1)
    light2.rotation.y = Math.PI / 2
    group.add(light2)

    const light3 = new THREE.Mesh(
        new THREE.CircleGeometry(2, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, intensity: 2 })
    )
    light3.position.set(-5, -1, -1)
    light3.rotation.y = Math.PI / 2
    group.add(light3)

    const light4 = new THREE.Mesh(
        new THREE.CircleGeometry(8, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, intensity: 2 })
    )
    light4.position.set(10, 1, 0)
    light4.rotation.y = -Math.PI / 2
    group.add(light4)

    const light5 = new THREE.Mesh(
        new THREE.RingGeometry(8, 10, 32),
        new THREE.MeshBasicMaterial({ color: 0x4060ff, intensity: 80 })
    )
    light5.position.set(10, 10, 0)
    light5.lookAt(0, 0, 0)
    group.add(light5)

    return group
}
