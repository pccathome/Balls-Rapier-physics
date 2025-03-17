import * as THREE from 'three'

const sceneMiddle = new THREE.Vector3(0, 0, 0)

function getBody(RAPIER, world, accents, shuffle, accentIndex) {
    // ball size
    const size = 0.17

    const range = 3
    const density = size * 3.5
    let x = Math.random() * range - range * 0.5
    let y = Math.random() * range - range * 0.5 + 2
    let z = Math.random() * range - range * 0.5

    // physics
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setLinearDamping(1)
        .setAngularDamping(0.6)
        .setTranslation(x, y, z)
    let rigid = world.createRigidBody(rigidBodyDesc)
    let colliderDesc = RAPIER.ColliderDesc.ball(size)
        .setDensity(density)
        .setRestitution(0.8)
        .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max)
    world.createCollider(colliderDesc, rigid)

    // ball
    const geometry = new THREE.SphereGeometry(size, 64, 64)
    const materialOptions = shuffle(accentIndex)[Math.floor(Math.random() * shuffle(accentIndex).length)]
    const material = new THREE.MeshStandardMaterial({
        color: materialOptions.color,
        roughness: materialOptions.roughness || 0.1,
        metalness: materialOptions.metalness || 0.1,
        transparent: materialOptions.transparent || false,
        opacity: materialOptions.opacity || 1
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    mesh.castShadow = true

    function update() {
        rigid.resetForces(true)
        let { x, y, z } = rigid.translation()
        let pos = new THREE.Vector3(x, y, z)
        let dir = pos.clone().sub(sceneMiddle).normalize()
        rigid.addForce(dir.multiplyScalar(-0.1), true) // center gravity

        mesh.position.set(x, y, z)
    }
    return { mesh, rigid, update, materialOptions }
}

// mouse ball

function getMouseBall(RAPIER, world) {
    const mouseSize = 0.3
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 8)
    const material = new THREE.MeshStandardMaterial({
        opacity: 0.0,
        transparent: true
    })
    const mouseLight = new THREE.PointLight(0xffffff, 0.02)
    const mouseMesh = new THREE.Mesh(geometry, material)
    mouseMesh.add(mouseLight)

    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc)
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 1.5)
        .setDensity(10)
        .setRestitution(0.5)
        .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max)
    world.createCollider(dynamicCollider, mouseRigid)
    function update(mousePos) {
        mouseRigid.setTranslation({ x: mousePos.x, y: mousePos.y, z: 0.1 })
        let { x, y, z } = mouseRigid.translation()
        mouseMesh.position.set(x, y, z)
    }
    return { mesh: mouseMesh, update }
}

function createLightFormers() {
    const group = new THREE.Group()

    const light1 = new THREE.HemisphereLight(0xffffbb, 0x080820, 2.5)
    light1.position.set(2.5, 20, -2)
    light1.castShadow = true
    group.add(light1)

    const width = 10
    const height = 10
    const intensity = 1
    const light2 = new THREE.RectAreaLight(0xffffff, intensity, width, height)
    light2.position.set(-2.5, -5, -1)
    light2.lookAt(0, 0, 0)
    light2.castShadow = true
    group.add(light2)

    const light3 = new THREE.DirectionalLight(0xe0fe0e, 2)
    light3.position.set(-3, 10, -7)
    light3.castShadow = true
    light3.shadow.mapSize.width = 256
    light3.shadow.mapSize.height = 256
    group.add(light3)

    const light4 = new THREE.DirectionalLight(0xffffff, 3)
    light4.position.set(0, 0, 1)
    light4.castShadow = true
    light4.shadow.mapSize.width = 1024
    light4.shadow.mapSize.height = 1024
    group.add(light4)

    return group
}

export { getBody, getMouseBall, createLightFormers }
