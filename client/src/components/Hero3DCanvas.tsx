import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const Hero3DCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement!
    const width = parent.clientWidth
    const height = parent.clientHeight

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.1, 1.45)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)

    // Load GLTF
    const loader = new GLTFLoader()
    let model: any = null
    let mixer: any = null
    const clock = new THREE.Clock()

    loader.load("/emeka.glb", (gltf) => {
      model = gltf.scene

      // Auto-center
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)

      model.scale.set(1.8, 1.8, 1.8)
      
      // Set initial rotation for best viewing angle
      model.rotation.x = -0.1
      model.rotation.y = 0.1
      
      scene.add(model)

      // Play animations
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model)
        gltf.animations.forEach((clip: any) => {
          mixer!.clipAction(clip).play()
        })
      }
      
      setIsLoading(false)
    })

    // Animate - static display only
    const animate = () => {
      requestAnimationFrame(animate)

      const delta = clock.getDelta()

      if (mixer) mixer.update(delta)

      // No user interaction - static display only
      // Model stays in fixed position with only animation playback
      
      renderer.render(scene, camera)
    }

    animate()

    // Resize handler
    const onResize = () => {
      const w = parent.clientWidth
      const h = parent.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        id="hero3DCanvas"
        className="w-full h-full"
        style={{ touchAction: 'none', cursor: 'default' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#29A378]/20 to-[#119e6c]/20 backdrop-blur-sm">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Loading 3D Model...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Hero3DCanvas