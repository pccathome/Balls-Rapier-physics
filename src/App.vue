<script setup>
import { onMounted, onBeforeUnmount, computed, ref } from 'vue'
import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d'
import { getBody, getMouseBall, createLightFormers } from './getBodies-2.js'

import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, FXAAEffect } from 'postprocessing'

// import LoadingIco from './components/LoadingIco.vue'
import PageWrap from './components/PageWrap.vue'
import Header from './components/Header.vue'
import FooterInfo from './components/FooterInfo.vue'

// Refs
const webgl = ref(null)

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('#141622')
scene.fog = new THREE.Fog('#000000', 0.1, 3.3)

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
const renderer = new THREE.WebGLRenderer({ powerPreference: 'high-performance', antialias: false, alpha: false })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

// Camera
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 1, 40)
camera.position.set(0, 0, 2.8)
scene.add(camera)

// postprocessing
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(
    new EffectPass(
        camera,
        new BloomEffect({
            mipmapBlur: true,
            luminanceThreshold: 0.1,
            levels: 7
        })
    )
)
composer.addPass(new EffectPass(camera, new FXAAEffect(), new ToneMappingEffect()))

// const accents = ['#ff4060', '#ffcc00', '#20ffa0', '#4060ff']
const accents = ['#ff4030', '#ffcc00', '#10ff40', '#2030ff']
const shuffle = (accent = 0) => [
    { color: '#444', roughness: 0.1, metalness: 0.5 },
    { color: '#444', roughness: 0.1, metalness: 1 },
    { color: '#444', roughness: 0.1, metalness: 0.5 },
    { color: 'white', roughness: 0.1, metalness: 0.1 },
    { color: 'white', roughness: 0.1, metalness: 0.1 },
    { color: 'white', roughness: 0.1, metalness: 0.1 },
    { color: accents[accent], roughness: 0.1, accent: true },
    { color: accents[accent], roughness: 0.1, accent: true },
    { color: accents[accent], roughness: 0.1, accent: true },
    { color: '#444', roughness: 0.1 },
    { color: '#444', roughness: 0.3 },
    { color: '#444', roughness: 0.3, metalness: 1 },
    { color: 'white', roughness: 0.1 },
    { color: 'white', roughness: 0.2 },
    { color: 'white', roughness: 0.1 },
    { color: accents[accent], roughness: 0.1, accent: true, transparent: true, opacity: 0.3 },
    { color: accents[accent], roughness: 0.3, accent: true },
    { color: accents[accent], roughness: 0.1, accent: true }
]

const accent = ref(0)

// Lights group
const lightFormers = createLightFormers()
scene.add(lightFormers)

// Physics setup
const gravity = new RAPIER.Vector3(0, 0, 0)
const world = new RAPIER.World(gravity)

// Mouse Ball
const mouseBall = getMouseBall(RAPIER, world)
scene.add(mouseBall.mesh)

let mousePos = new THREE.Vector2()
function handleMouseMove(e) {
    mousePos.x = (e.clientX / sizes.width) * 2 - 1
    mousePos.y = -(e.clientY / sizes.height) * 2 + 1
}

// 處理觸控移動（手機）
function handleTouchMove(e) {
    if (e.touches.length > 0) {
        let touch = e.touches[0] // 取得第一個觸控點
        mousePos.x = (touch.clientX / sizes.width) * 2 - 1
        mousePos.y = -(touch.clientY / sizes.height) * 2 + 1
    }
}

let numBodies = 18
let bodies = []

const click = () => {
    accent.value = (accent.value + 1) % accents.length

    // Update bodies color
    bodies.forEach((body) => {
        if (body.materialOptions && body.materialOptions.accent) {
            if (body.mesh.material.color) {
                body.mesh.material.color.set(accents[accent.value])
            } else {
                body.mesh.material.forEach((material) => {
                    if (material.color) {
                        material.color.set(accents[accent.value])
                    }
                })
            }
        }
    })
}

const Setup = () => {
    for (let i = 0; i < numBodies; i++) {
        const body = getBody(RAPIER, world, accents, shuffle, accent.value)
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
        composer.render()

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
    }

    tick()
}

onMounted(() => {
    webgl.value.appendChild(renderer.domElement)
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, false)
    window.addEventListener('touchmove', handleTouchMove, { passive: true }) // `passive: true` 可提高滾動效能

    Setup()
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', handleMouseMove, false)
    window.removeEventListener('touchmove', handleTouchMove, { passive: true })
})
</script>

<template>
    <PageWrap>
        <Header />
        <!-- <div v-if="loading" class="z-10 h-dvh inset-0 flex items-center justify-center">
            <LoadingIco />
        </div> -->
        <div @click="click" class="outline-none w-full h-dvh" ref="webgl"></div>

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
