import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Text, MeshTransmissionMaterial, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
}

// Procedural Wireframe Model being "generated"
function GeneratingModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const wireframeRef = useRef<THREE.Mesh>(null!)
  const solidRef = useRef<THREE.Mesh>(null!)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  const geometry = useMemo(() => {
    // Create a parametric CAD-like shape
    const shape = new THREE.Shape()
    shape.moveTo(-1.5, -1)
    shape.lineTo(1.5, -1)
    shape.lineTo(1.5, 0.5)
    shape.lineTo(0.5, 0.5)
    shape.lineTo(0.5, 1)
    shape.lineTo(-0.5, 1)
    shape.lineTo(-0.5, 0.5)
    shape.lineTo(-1.5, 0.5)
    shape.lineTo(-1.5, -1)

    const extrudeSettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Wireframe layer */}
      <mesh ref={wireframeRef} geometry={geometry}>
        <meshBasicMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={1 - progress * 0.7}
        />
      </mesh>
      {/* Solid layer that fades in */}
      <mesh ref={solidRef} geometry={geometry}>
        <meshStandardMaterial
          color="#1a2f3a"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={progress}
        />
      </mesh>
    </group>
  )
}

// Floating particles suggesting AI computation
function ComputeParticles() {
  const count = 200
  const particlesRef = useRef<THREE.Points>(null!)

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return [pos, vel]
  }, [])

  useFrame(() => {
    if (particlesRef.current) {
      const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        posArray[i * 3] += velocities[i * 3]
        posArray[i * 3 + 1] += velocities[i * 3 + 1]
        posArray[i * 3 + 2] += velocities[i * 3 + 2]

        // Wrap around bounds
        if (Math.abs(posArray[i * 3]) > 4) velocities[i * 3] *= -1
        if (Math.abs(posArray[i * 3 + 1]) > 3) velocities[i * 3 + 1] *= -1
        if (Math.abs(posArray[i * 3 + 2]) > 4) velocities[i * 3 + 2] *= -1
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00ff88"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Glowing coordinate axes
function CoordinateAxes() {
  return (
    <group>
      {/* X axis - Red */}
      <mesh position={[2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>
      <mesh position={[4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>

      {/* Y axis - Green */}
      <mesh position={[0, 2, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>

      {/* Z axis - Blue */}
      <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
        <meshBasicMaterial color="#3388ff" />
      </mesh>
      <mesh position={[0, 0, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color="#3388ff" />
      </mesh>
    </group>
  )
}

// Glass sphere showing AI core
function AICore() {
  const coreRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.x = state.clock.elapsedTime * 0.5
      coreRef.current.rotation.z = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={coreRef} position={[0, 3, 0]} scale={0.4}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.5}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          color="#00ff88"
        />
      </mesh>
    </Float>
  )
}

// 3D Scene
function Scene({ generationProgress }: { generationProgress: number }) {
  return (
    <>
      <color attach="background" args={['#0a0f14']} />
      <fog attach="fog" args={['#0a0f14', 8, 25]} />

      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00ff88" />
      <pointLight position={[5, 2, 5]} intensity={0.3} color="#3388ff" />

      <Suspense fallback={null}>
        <GeneratingModel progress={generationProgress} />
        <ComputeParticles />
        <CoordinateAxes />
        <AICore />

        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1a3040"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#00ff88"
          fadeDistance={20}
          fadeStrength={1}
          followCamera={false}
        />

        <Text
          position={[0, -0.5, 3]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff"
        >
          FreeCAD AI Generator
        </Text>

        <Environment preset="night" />
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 + 0.3}
      />
    </>
  )
}

// Chat Interface Component
function ChatInterface({
  messages,
  onSendMessage,
  isGenerating
}: {
  messages: ChatMessage[]
  onSendMessage: (content: string, image?: string) => void
  isGenerating: boolean
}) {
  const [input, setInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() || imagePreview) {
      onSendMessage(input, imagePreview || undefined)
      setInput('')
      setImagePreview(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="absolute right-4 md:right-6 top-4 md:top-6 w-[calc(100%-2rem)] md:w-96 h-[60vh] md:h-[70vh] max-h-[600px] flex flex-col rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(10, 20, 30, 0.95), rgba(15, 30, 45, 0.9))',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        boxShadow: '0 0 40px rgba(0, 255, 136, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3"
        style={{ borderColor: 'rgba(0, 255, 136, 0.2)' }}
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
        <h2 className="text-sm font-mono tracking-widest uppercase" style={{ color: '#00ff88' }}>
          AI Model Generator
        </h2>
        <div className="ml-auto text-xs font-mono" style={{ color: 'rgba(0, 255, 136, 0.5)' }}>
          FreeCAD 1.1
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
        style={{ scrollbarColor: 'rgba(0, 255, 136, 0.3) transparent' }}
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(51, 136, 255, 0.1))',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#00ff88">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Describe the 3D model you want to create
            </p>
            <p className="text-xs font-mono mt-2" style={{ color: 'rgba(0, 255, 136, 0.4)' }}>
              You can also attach reference images
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
              }`}
              style={{
                background: message.role === 'user'
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 200, 100, 0.15))'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${message.role === 'user' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
              }}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Reference"
                  className="max-w-full h-auto rounded mb-2 max-h-32 object-contain"
                />
              )}
              <p className="text-sm font-mono leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-bl-none px-4 py-3"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background: '#00ff88',
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.6s'
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: 'rgba(0, 255, 136, 0.7)' }}>
                  Generating model...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(0, 255, 136, 0.2)' }}>
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-16 w-auto rounded" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: '#ff3366', color: 'white' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t" style={{ borderColor: 'rgba(0, 255, 136, 0.2)' }}>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-lg flex items-center justify-center transition-all hover:scale-105 shrink-0"
            style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)'
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#00ff88">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your 3D model..."
            className="flex-1 h-11 px-4 rounded-lg font-mono text-sm outline-none transition-all min-w-0"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              color: 'white'
            }}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || (!input.trim() && !imagePreview)}
            className="w-11 h-11 rounded-lg flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#0a0f14" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

// Status Bar
function StatusBar({ progress, isGenerating }: { progress: number; isGenerating: boolean }) {
  return (
    <div className="absolute left-4 md:left-6 bottom-16 md:bottom-20 flex flex-col gap-3">
      <div className="px-4 py-2 rounded-lg font-mono text-xs"
        style={{
          background: 'rgba(10, 20, 30, 0.9)',
          border: '1px solid rgba(0, 255, 136, 0.2)'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full"
            style={{
              background: isGenerating ? '#00ff88' : '#3388ff',
              boxShadow: isGenerating ? '0 0 8px #00ff88' : 'none'
            }}
          />
          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {isGenerating ? 'Generating...' : 'Ready'}
          </span>
        </div>
        {isGenerating && (
          <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #00ff88, #00cc6a)'
              }}
            />
          </div>
        )}
      </div>

      <div className="hidden md:flex gap-2">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="px-3 py-1 rounded font-mono text-xs"
            style={{
              background: 'rgba(10, 20, 30, 0.9)',
              border: `1px solid ${['#ff3366', '#00ff88', '#3388ff'][i]}40`,
              color: ['#ff3366', '#00ff88', '#3388ff'][i]
            }}
          >
            {axis}: 0.00
          </div>
        ))}
      </div>
    </div>
  )
}

// Tool Palette
function ToolPalette() {
  const tools = [
    { icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122', label: 'Select' },
    { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7', label: 'Zoom' },
    { icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4', label: 'Fit' },
    { icon: 'M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: '3D View' },
  ]

  return (
    <div className="absolute left-4 md:left-6 top-4 md:top-6 flex flex-col gap-2">
      {tools.map((tool, i) => (
        <button
          key={i}
          className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all hover:scale-110 group"
          style={{
            background: 'rgba(10, 20, 30, 0.9)',
            border: '1px solid rgba(0, 255, 136, 0.2)'
          }}
          title={tool.label}
        >
          <svg className="w-5 h-5 transition-colors group-hover:stroke-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="rgba(255, 255, 255, 0.6)" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
          </svg>
        </button>
      ))}
    </div>
  )
}

// Main App
export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const handleSendMessage = (content: string, image?: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      image
    }
    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate generation
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 1) {
          clearInterval(interval)
          return 1
        }
        return prev + 0.02
      })
    }, 100)

    // Simulate AI response
    setTimeout(() => {
      clearInterval(interval)
      setGenerationProgress(1)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Model generated successfully! I created a parametric part based on your description${image ? ' and reference image' : ''}. The model features beveled edges and precise dimensions. You can refine it further with more instructions.`
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsGenerating(false)
    }, 5000)
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#0a0f14' }}>
      {/* Background grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [5, 4, 5], fov: 50 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene generationProgress={generationProgress} />
      </Canvas>

      {/* UI Overlays */}
      <ToolPalette />
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
      />
      <StatusBar progress={generationProgress} isGenerating={isGenerating} />

      {/* Footer */}
      <footer className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] md:text-xs tracking-wide px-4 text-center"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        Requested by @web-user · Built by @clonkbot
      </footer>
    </div>
  )
}
