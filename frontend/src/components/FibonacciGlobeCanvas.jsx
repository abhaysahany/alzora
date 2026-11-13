import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function FibonacciGlobeCanvas() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5.4

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      return
    }
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    container.appendChild(renderer.domElement)

    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // 1. Fibonacci Sphere Point Cloud
    const pointCount = 900
    const radius = 1.9
    const positions = new Float32Array(pointCount * 3)
    const colors = new Float32Array(pointCount * 3)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    const colorPrimary = new THREE.Color('#d97706')
    const colorHighlight = new THREE.Color('#fbbf24')
    const colorGold = new THREE.Color('#ffd700')

    for (let i = 0; i < pointCount; i++) {
      const y = 1 - (i / (pointCount - 1)) * 2
      const rAtY = Math.sqrt(1 - y * y)
      const theta = goldenAngle * i
      const x = Math.cos(theta) * rAtY
      const z = Math.sin(theta) * rAtY

      positions[i * 3] = x * radius
      positions[i * 3 + 1] = y * radius
      positions[i * 3 + 2] = z * radius

      const t = (y + 1) * 0.5
      const mixed =
        t < 0.75
          ? colorPrimary.clone().lerp(colorHighlight, t / 0.75)
          : colorHighlight.clone().lerp(colorGold, (t - 0.75) / 0.25)
      colors[i * 3] = mixed.r
      colors[i * 3 + 1] = mixed.g
      colors[i * 3 + 2] = mixed.b
    }

    const globeGeom = new THREE.BufferGeometry()
    globeGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    globeGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const globeMat = new THREE.PointsMaterial({
      size: 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    })
    const globePoints = new THREE.Points(globeGeom, globeMat)
    rootGroup.add(globePoints)

    // 2. Wireframe Inner Sphere
    const wireGeom = new THREE.IcosahedronGeometry(1.52, 2)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    })
    const wireSphere = new THREE.Mesh(wireGeom, wireMat)
    rootGroup.add(wireSphere)

    // 3. Orbiting Neon Nodes
    const orbitGroup = new THREE.Group()
    const nodeGeom = new THREE.SphereGeometry(0.055, 12, 12)
    const nodeColors = [0xffd700, 0xfbbf24, 0xf59e0b, 0xfef08a]
    const nodeMaterials = []
    const orbitingNodes = []

    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: nodeColors[i % nodeColors.length] })
      nodeMaterials.push(mat)
      const mesh = new THREE.Mesh(nodeGeom, mat)
      const angle = (i / 6) * Math.PI * 2
      const orbitRadius = 2.35 + (i % 2) * 0.3
      mesh.userData = { angle, orbitRadius, speed: 0.004 + i * 0.0012, tilt: (i - 2.5) * 0.28 }
      orbitGroup.add(mesh)
      orbitingNodes.push(mesh)
    }
    rootGroup.add(orbitGroup)

    // 4. Ambient Dust Particles
    const dustCount = 260
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 14
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1
    }
    const dustGeom = new THREE.BufferGeometry()
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.03,
      transparent: true,
      opacity: 0.42,
    })
    const dustPoints = new THREE.Points(dustGeom, dustMat)
    scene.add(dustPoints)

    let targetMouseX = 0
    let targetMouseY = 0
    const onMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.7
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.5
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    let rafId = 0
    const animate = () => {
      rafId = requestAnimationFrame(animate)

      rootGroup.rotation.y += 0.0022
      rootGroup.rotation.x += (targetMouseY * 0.45 - rootGroup.rotation.x) * 0.04
      rootGroup.position.x += (targetMouseX * 0.8 - rootGroup.position.x) * 0.03
      wireSphere.rotation.y -= 0.0014
      dustPoints.rotation.y += 0.0005

      for (const node of orbitingNodes) {
        node.userData.angle += node.userData.speed
        const a = node.userData.angle
        const r = node.userData.orbitRadius
        node.position.set(
          Math.cos(a) * r,
          Math.sin(a * 0.8) * node.userData.tilt,
          Math.sin(a) * r
        )
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      globeGeom.dispose()
      globeMat.dispose()
      wireGeom.dispose()
      wireMat.dispose()
      nodeGeom.dispose()
      nodeMaterials.forEach((m) => m.dispose())
      dustGeom.dispose()
      dustMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div id="bg3d" ref={containerRef} className="pe-canvas-3d" aria-hidden="true" />
}

export default FibonacciGlobeCanvas
