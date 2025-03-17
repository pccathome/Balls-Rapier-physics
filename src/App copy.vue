<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import RAPIER from '@dimforge/rapier3d'
import { getBody, getMouseBall } from './getBodies.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// import LoadingIco from './components/LoadingIco.vue'
import PageWrap from './components/PageWrap.vue'
import Header from './components/Header.vue'
import FooterInfo from './components/FooterInfo.vue'

// Refs
const webgl = ref(null)

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('#ff0000')

// Resize
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

const handleResize = () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

// Loading Manager
const loading = ref(true)
const loadingManager = new THREE.LoadingManager(
    () => {
        loading.value = false
    },
    (file, loaded, total) => {
        const progress = loaded / total
        console.log(`Loading: ${progress * 100}%`)
    }
)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

// Add shadow support
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(0, 0, 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false
controls.enableZoom = false
// controls.autoRotate = true
// controls.autoRotateSpeed = 0.5

// Lights
const hemiLight = new THREE.HemisphereLight(0x00bbff, 0xaa00ff)
hemiLight.intensity = 0.2
scene.add(hemiLight)

// Physics
const gravity = new RAPIER.Vector3(0, 0, 0)
const world = new RAPIER.World(gravity)

const mouseBall = getMouseBall(RAPIER, world)
scene.add(mouseBall.mesh)

let mousePos = new THREE.Vector2()
function handleMouseMove(e) {
    mousePos.x = (e.clientX / sizes.width) * 2 - 1
    mousePos.y = -(e.clientY / sizes.height) * 2 + 1
}

const Setup = () => {
    const numBodies = 100
    const bodies = []
    for (let i = 0; i < numBodies; i++) {
        const body = getBody(RAPIER, world)
        bodies.push(body)
        scene.add(body.mesh)
    }

    // Animate
    const clock = new THREE.Clock()

    const tick = () => {
        const elapsedTime = clock.getElapsedTime()

        world.step()
        mouseBall.update(mousePos)
        bodies.forEach((b) => b.update())

        // Render
        renderer.render(scene, camera)
        controls.update()

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
    }

    tick()
}

onMounted(() => {
    webgl.value.appendChild(renderer.domElement)
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, false)

    Setup()
})
</script>

<template>
    <PageWrap>
        <Header />
        <!-- <div v-if="loading" class="z-10 h-dvh inset-0 flex items-center justify-center">
            <LoadingIco />
        </div> -->
        <div class="outline-none w-full h-dvh" ref="webgl"></div>

        <FooterInfo>
            <template v-slot:title></template>
            <template v-slot:first>
                <a
                    href="https://www.youtube.com/watch?v=xECyFOsVZ0E&list=WL&index=4&t=351s"
                    target="_blank"
                    class="underline-offset-2 font-medium"
                >
                    @Irradiance Earth and planes - tutorial</a
                >
            </template>
            <template v-slot:second> </template>
            <template v-slot:github>
                <a href="https://github.com/pccathome/fly-around-the-world" target="_blank" class="underline-offset-2"
                    >GitHub</a
                >
            </template>
        </FooterInfo>
    </PageWrap>
</template>
