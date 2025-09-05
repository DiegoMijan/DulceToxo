<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue"

// Interfaces
interface Position {
  x: number
  y: number
}

interface SparkleConfig {
  style: Record<string, string>
}

interface HeartConfig {
  style: Record<string, string>
}

// Referencias del DOM
const containerRef = ref<HTMLDivElement>()
const cupcakeSvgRef = ref<SVGSVGElement>()
const leftEyeBaseRef = ref<SVGCircleElement>()
const rightEyeBaseRef = ref<SVGCircleElement>()
const leftEyelidRef = ref<SVGPathElement>()
const rightEyelidRef = ref<SVGPathElement>()
const leftPupilRef = ref<SVGCircleElement>()
const rightPupilRef = ref<SVGCircleElement>()
const leftShine1Ref = ref<SVGCircleElement>()
const leftShine2Ref = ref<SVGCircleElement>()
const rightShine1Ref = ref<SVGCircleElement>()
const rightShine2Ref = ref<SVGCircleElement>()

// Estado reactivo
const eyesOpen = ref<boolean>(true)
const automaticBlinking = ref<boolean>(true)

// Posiciones de las pupilas y brillos
const leftPupilPos = reactive<Position>({ x: 150, y: 180 })
const rightPupilPos = reactive<Position>({ x: 200, y: 180 })
const leftShine1Pos = reactive<Position>({ x: 155, y: 175 })
const leftShine2Pos = reactive<Position>({ x: 160, y: 182 })
const rightShine1Pos = reactive<Position>({ x: 205, y: 175 })
const rightShine2Pos = reactive<Position>({ x: 210, y: 182 })

// Configuración de partículas
const sparkles: SparkleConfig[] = [
  { style: { top: "15%", left: "5%" } },
  { style: { top: "25%", right: "10%", animationDelay: "0.7s" } },
  { style: { bottom: "35%", left: "15%", animationDelay: "1.2s" } },
  { style: { bottom: "20%", right: "8%", animationDelay: "1.8s" } },
  { style: { top: "40%", left: "8%", animationDelay: "0.3s" } },
  { style: { top: "60%", right: "12%", animationDelay: "1.5s" } },
]

const hearts: HeartConfig[] = [
  { style: { top: "20%", left: "20%", animationDelay: "2s" } },
  { style: { top: "30%", right: "25%", animationDelay: "3.5s" } },
]

// Variables para control de intervalos
let blinkInterval: number | null = null

// Obtener las coordenadas del centro de cada ojo
const getEyeCenter = (eyeBase: SVGCircleElement): Position => {
  if (!cupcakeSvgRef.value) return { x: 0, y: 0 }

  const rect = cupcakeSvgRef.value.getBoundingClientRect()
  const svgRect = cupcakeSvgRef.value.viewBox.baseVal
  const scaleX = rect.width / svgRect.width
  const scaleY = rect.height / svgRect.height

  return {
    x: rect.left + parseFloat(eyeBase.getAttribute("cx") || "0") * scaleX,
    y: rect.top + parseFloat(eyeBase.getAttribute("cy") || "0") * scaleY,
  }
}

// Función para mover las pupilas
const moveEyes = (mouseX: number, mouseY: number): void => {
  if (!eyesOpen.value || !leftEyeBaseRef.value || !rightEyeBaseRef.value || !cupcakeSvgRef.value)
    return

  const maxDistance = 10

  // Ojo izquierdo
  const leftEyeCenter = getEyeCenter(leftEyeBaseRef.value)
  const leftDx = mouseX - leftEyeCenter.x
  const leftDy = mouseY - leftEyeCenter.y
  const leftDistance = Math.sqrt(leftDx * leftDx + leftDy * leftDy)

  let leftMoveX = 0,
    leftMoveY = 0
  if (leftDistance > 0) {
    const leftRatio = Math.min(maxDistance / leftDistance, 1)
    leftMoveX = leftDx * leftRatio
    leftMoveY = leftDy * leftRatio
  }

  // Ojo derecho
  const rightEyeCenter = getEyeCenter(rightEyeBaseRef.value)
  const rightDx = mouseX - rightEyeCenter.x
  const rightDy = mouseY - rightEyeCenter.y
  const rightDistance = Math.sqrt(rightDx * rightDx + rightDy * rightDy)

  let rightMoveX = 0,
    rightMoveY = 0
  if (rightDistance > 0) {
    const rightRatio = Math.min(maxDistance / rightDistance, 1)
    rightMoveX = rightDx * rightRatio
    rightMoveY = rightDy * rightRatio
  }

  // Convertir coordenadas
  const rect = cupcakeSvgRef.value.getBoundingClientRect()
  const svgRect = cupcakeSvgRef.value.viewBox.baseVal
  const scaleX = svgRect.width / rect.width
  const scaleY = svgRect.height / rect.height

  const leftSvgMoveX = leftMoveX * scaleX
  const leftSvgMoveY = leftMoveY * scaleY
  const rightSvgMoveX = rightMoveX * scaleX
  const rightSvgMoveY = rightMoveY * scaleY

  // Actualizar posiciones reactivas
  leftPupilPos.x = 150 + leftSvgMoveX
  leftPupilPos.y = 180 + leftSvgMoveY

  rightPupilPos.x = 200 + rightSvgMoveX
  rightPupilPos.y = 180 + rightSvgMoveY

  // Actualizar brillo en los ojos
  leftShine1Pos.x = 155 + leftSvgMoveX * 0.6
  leftShine1Pos.y = 175 + leftSvgMoveY * 0.6
  leftShine2Pos.x = 160 + leftSvgMoveX * 0.4
  leftShine2Pos.y = 182 + leftSvgMoveY * 0.4

  rightShine1Pos.x = 205 + rightSvgMoveX * 0.6
  rightShine1Pos.y = 175 + rightSvgMoveY * 0.6
  rightShine2Pos.x = 210 + rightSvgMoveX * 0.4
  rightShine2Pos.y = 182 + rightSvgMoveY * 0.4
}

// Función para parpadear
const blink = (): void => {
  if (!automaticBlinking.value || !eyesOpen.value) return
  if (!leftEyelidRef.value || !rightEyelidRef.value) return
  if (!leftPupilRef.value || !rightPupilRef.value) return
  if (
    !leftShine1Ref.value ||
    !leftShine2Ref.value ||
    !rightShine1Ref.value ||
    !rightShine2Ref.value
  )
    return

  // Cerrar párpados
  leftEyelidRef.value.style.transform = "scaleY(1)"
  leftEyelidRef.value.style.opacity = "1"
  rightEyelidRef.value.style.transform = "scaleY(1)"
  rightEyelidRef.value.style.opacity = "1"

  // Ocultar pupilas y brillos
  const elementsToHide = [
    leftPupilRef.value,
    rightPupilRef.value,
    leftShine1Ref.value,
    leftShine2Ref.value,
    rightShine1Ref.value,
    rightShine2Ref.value,
  ]

  elementsToHide.forEach((el) => {
    if (el) el.style.opacity = "0"
  })

  setTimeout(() => {
    if (!leftEyelidRef.value || !rightEyelidRef.value) return

    // Abrir párpados
    leftEyelidRef.value.style.transform = "scaleY(0)"
    leftEyelidRef.value.style.opacity = "0"
    rightEyelidRef.value.style.transform = "scaleY(0)"
    rightEyelidRef.value.style.opacity = "0"

    // Mostrar pupilas y brillos
    elementsToHide.forEach((el) => {
      if (el) el.style.opacity = "1"
    })
  }, 200)
}

// Función para cerrar/abrir ojos manualmente
const toggleEyes = (): void => {
  eyesOpen.value = !eyesOpen.value
  automaticBlinking.value = eyesOpen.value

  if (!leftEyelidRef.value || !rightEyelidRef.value) return
  if (!leftPupilRef.value || !rightPupilRef.value) return
  if (
    !leftShine1Ref.value ||
    !leftShine2Ref.value ||
    !rightShine1Ref.value ||
    !rightShine2Ref.value
  )
    return

  const elementsToToggle = [
    leftPupilRef.value,
    rightPupilRef.value,
    leftShine1Ref.value,
    leftShine2Ref.value,
    rightShine1Ref.value,
    rightShine2Ref.value,
  ]

  if (eyesOpen.value) {
    // Abrir ojos
    leftEyelidRef.value.style.transform = "scaleY(0)"
    leftEyelidRef.value.style.opacity = "0"
    rightEyelidRef.value.style.transform = "scaleY(0)"
    rightEyelidRef.value.style.opacity = "0"

    elementsToToggle.forEach((el) => {
      if (el) el.style.opacity = "1"
    })
  } else {
    // Cerrar ojos
    leftEyelidRef.value.style.transform = "scaleY(1)"
    leftEyelidRef.value.style.opacity = "1"
    rightEyelidRef.value.style.transform = "scaleY(1)"
    rightEyelidRef.value.style.opacity = "1"

    elementsToToggle.forEach((el) => {
      if (el) el.style.opacity = "0"
    })
  }
}

// Event handler para el movimiento del ratón
const handleMouseMove = (event: MouseEvent): void => {
  moveEyes(event.clientX, event.clientY)
}

// Programar próximo parpadeo
const scheduleNextBlink = (): void => {
  blinkInterval = window.setTimeout(
    () => {
      blink()
      scheduleNextBlink()
    },
    4000 + Math.random() * 4000,
  )
}

// Lifecycle hooks
onMounted(() => {
  // Añadir event listener para movimiento del ratón
  document.addEventListener("mousemove", handleMouseMove)

  // Añadir transiciones suaves a los elementos de los ojos
  const eyeElements = [
    leftEyelidRef.value,
    rightEyelidRef.value,
    leftPupilRef.value,
    rightPupilRef.value,
    leftShine1Ref.value,
    leftShine2Ref.value,
    rightShine1Ref.value,
    rightShine2Ref.value,
  ]

  eyeElements.forEach((element) => {
    if (element) {
      element.style.transition = "all 0.3s ease-out"
    }
  })

  // Iniciar parpadeo automático
  scheduleNextBlink()
})

onUnmounted(() => {
  // Limpiar event listeners e intervalos
  document.removeEventListener("mousemove", handleMouseMove)
  if (blinkInterval) {
    clearTimeout(blinkInterval)
  }
})

defineExpose({
  toggleEyes,
})
</script>
<template>
  <div class="cupcake-container mt-[-160px]">
    <div
      ref="containerRef"
      class="container"
    >
      <svg
        id="cupcake-svg"
        ref="cupcakeSvgRef"
        width="250"
        height="350"
        viewBox="0 0 350 450"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- Gradientes mejorados -->
          <radialGradient
            id="baseGradient"
            cx="50%"
            cy="20%"
          >
            <stop
              offset="0%"
              stop-color="#D2B48C"
            />
            <stop
              offset="50%"
              stop-color="#8B4513"
            />
            <stop
              offset="100%"
              stop-color="#654321"
            />
          </radialGradient>
          <radialGradient
            id="frostingGradient"
            cx="40%"
            cy="30%"
          >
            <stop
              offset="0%"
              stop-color="#FF91A4"
            />
            <stop
              offset="50%"
              stop-color="#FF69B4"
            />
            <stop
              offset="100%"
              stop-color="#E91E63"
            />
          </radialGradient>
          <radialGradient
            id="cherryGradient"
            cx="30%"
            cy="30%"
          >
            <stop
              offset="0%"
              stop-color="#FF4444"
            />
            <stop
              offset="100%"
              stop-color="#CC0000"
            />
          </radialGradient>
          <linearGradient
            id="wrapperGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stop-color="#FFF"
            />
            <stop
              offset="20%"
              stop-color="#F5F5F5"
            />
            <stop
              offset="100%"
              stop-color="#E0E0E0"
            />
          </linearGradient>
          <!-- Patrón de rayas para el wrapper -->
          <pattern
            id="stripes"
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
            patternTransform="rotate(45)"
          >
            <rect
              width="4"
              height="8"
              fill="#FFB6C1"
            />
            <rect
              x="4"
              width="4"
              height="8"
              fill="#FF69B4"
            />
          </pattern>
        </defs>

        <!-- Sombra mejorada -->
        <ellipse
          cx="175"
          cy="430"
          rx="100"
          ry="18"
          fill="rgba(0,0,0,0.3)"
        />

        <!-- Base del cupcake (wrapper) con patrón -->
        <path
          d="M85 230 L265 230 L250 390 L100 390 Z"
          fill="url(#wrapperGradient)"
          stroke="#2C3E50"
          stroke-width="5"
        />

        <!-- Patrón decorativo en el wrapper -->
        <rect
          x="95"
          y="240"
          width="160"
          height="140"
          fill="url(#stripes)"
          opacity="0.3"
        />

        <!-- Líneas decorativas mejoradas -->
        <line
          x1="105"
          y1="250"
          x2="245"
          y2="250"
          stroke="#2C3E50"
          stroke-width="3"
          opacity="0.7"
        />
        <line
          x1="110"
          y1="270"
          x2="240"
          y2="270"
          stroke="#2C3E50"
          stroke-width="3"
          opacity="0.7"
        />
        <line
          x1="115"
          y1="290"
          x2="235"
          y2="290"
          stroke="#2C3E50"
          stroke-width="3"
          opacity="0.7"
        />
        <line
          x1="120"
          y1="310"
          x2="230"
          y2="310"
          stroke="#2C3E50"
          stroke-width="3"
          opacity="0.7"
        />

        <!-- Frosting base -->
        <ellipse
          cx="175"
          cy="210"
          rx="95"
          ry="50"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="5"
        />

        <!-- Remolinos de frosting más detallados -->
        <circle
          cx="140"
          cy="170"
          r="30"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="4"
        />
        <circle
          cx="210"
          cy="175"
          r="28"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="4"
        />
        <circle
          cx="175"
          cy="145"
          r="35"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="4"
        />

        <!-- Remolinos pequeños adicionales -->
        <circle
          cx="125"
          cy="195"
          r="18"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="3"
        />
        <circle
          cx="225"
          cy="200"
          r="16"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="3"
        />

        <!-- Cara mejorada -->
        <!-- Ojos base más grandes -->
        <circle
          ref="leftEyeBaseRef"
          cx="150"
          cy="180"
          r="28"
          fill="white"
          stroke="#2C3E50"
          stroke-width="5"
        />
        <circle
          ref="rightEyeBaseRef"
          cx="200"
          cy="180"
          r="28"
          fill="white"
          stroke="#2C3E50"
          stroke-width="5"
        />

        <!-- Párpados para el parpadeo -->
        <path
          ref="leftEyelidRef"
          d="M122 180 A28 28 0 0 1 178 180 Z"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="4"
          :style="{ transformOrigin: '150px 180px', transform: 'scaleY(0)', opacity: '0' }"
        />
        <path
          ref="rightEyelidRef"
          d="M172 180 A28 28 0 0 1 228 180 Z"
          fill="url(#frostingGradient)"
          stroke="#8B008B"
          stroke-width="4"
          :style="{ transformOrigin: '200px 180px', transform: 'scaleY(0)', opacity: '0' }"
        />

        <!-- Pupilas que seguirán el ratón -->
        <circle
          ref="leftPupilRef"
          :cx="leftPupilPos.x"
          :cy="leftPupilPos.y"
          r="15"
          fill="#2C3E50"
        />
        <circle
          ref="rightPupilRef"
          :cx="rightPupilPos.x"
          :cy="rightPupilPos.y"
          r="15"
          fill="#2C3E50"
        />

        <!-- Brillo en los ojos más detallado -->
        <circle
          ref="leftShine1Ref"
          :cx="leftShine1Pos.x"
          :cy="leftShine1Pos.y"
          r="6"
          fill="white"
        />
        <circle
          ref="leftShine2Ref"
          :cx="leftShine2Pos.x"
          :cy="leftShine2Pos.y"
          r="3"
          fill="white"
          opacity="0.7"
        />
        <circle
          ref="rightShine1Ref"
          :cx="rightShine1Pos.x"
          :cy="rightShine1Pos.y"
          r="6"
          fill="white"
        />
        <circle
          ref="rightShine2Ref"
          :cx="rightShine2Pos.x"
          :cy="rightShine2Pos.y"
          r="3"
          fill="white"
          opacity="0.7"
        />

        <!-- Boca sonriente mejorada -->
        <path
          d="M155 205 Q175 225 195 205"
          fill="none"
          stroke="#2C3E50"
          stroke-width="6"
          stroke-linecap="round"
        />

        <!-- Lengua -->
        <ellipse
          cx="175"
          cy="215"
          rx="12"
          ry="8"
          fill="#FF69B4"
          stroke="#E91E63"
          stroke-width="2"
        />

        <!-- Mejillas rosadas mejoradas -->
        <circle
          cx="115"
          cy="195"
          r="15"
          fill="#FFB6C1"
          opacity="0.8"
        />
        <circle
          cx="235"
          cy="195"
          r="15"
          fill="#FFB6C1"
          opacity="0.8"
        />

        <!-- Cerezas múltiples -->
        <circle
          cx="165"
          cy="110"
          r="14"
          fill="url(#cherryGradient)"
          stroke="#8B0000"
          stroke-width="4"
        />
        <circle
          cx="185"
          cy="115"
          r="12"
          fill="url(#cherryGradient)"
          stroke="#8B0000"
          stroke-width="3"
        />

        <!-- Tallos de las cerezas -->
        <path
          d="M165 96 Q160 80 155 75"
          fill="none"
          stroke="#228B22"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M185 103 Q188 88 190 82"
          fill="none"
          stroke="#228B22"
          stroke-width="3"
          stroke-linecap="round"
        />

        <!-- Hojas -->
        <ellipse
          cx="157"
          cy="78"
          rx="8"
          ry="12"
          fill="#32CD32"
          stroke="#228B22"
          stroke-width="2"
          transform="rotate(-30 157 78)"
        />
        <ellipse
          cx="192"
          cy="85"
          rx="6"
          ry="10"
          fill="#32CD32"
          stroke="#228B22"
          stroke-width="2"
          transform="rotate(20 192 85)"
        />

        <!-- Sprinkles decorativos -->
        <rect
          x="130"
          y="160"
          width="3"
          height="12"
          fill="#FFD700"
          transform="rotate(20 130 160)"
        />
        <rect
          x="220"
          y="165"
          width="3"
          height="10"
          fill="#00CED1"
          transform="rotate(-30 220 165)"
        />
        <rect
          x="160"
          y="125"
          width="3"
          height="8"
          fill="#FF4500"
          transform="rotate(45 160 125)"
        />
        <rect
          x="190"
          y="130"
          width="3"
          height="10"
          fill="#9370DB"
          transform="rotate(-15 190 130)"
        />
      </svg>

      <!-- Partículas decorativas mejoradas -->
      <div
        v-for="(sparkle, index) in sparkles"
        :key="`sparkle-${index}`"
        class="sparkle"
        :style="sparkle.style"
      />

      <!-- Corazones flotantes -->
      <div
        v-for="(heart, index) in hearts"
        :key="`heart-${index}`"
        class="floating-heart"
        :style="heart.style"
      >
        ♥
      </div>
    </div>
  </div>
</template>
<style scoped>
.cupcake-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /*background: linear-gradient(135deg, #4a90e2 0%, #7b68ee 50%, #ff6b9d 100%);*/
  font-family: 'Arial Black', sans-serif;
  overflow: hidden;
}

.container {
  position: relative;
  cursor: url("../../../public/img/strawberry-icon.png"), none;
  padding-left: 25%;
}

#cupcake-svg {
  filter: drop-shadow(12px 12px 20px rgba(0, 0, 0, 0.4));
  animation: bounce 3s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0px) rotate(-2deg);
  }
  50% {
    transform: translateY(-15px) rotate(2deg);
  }
}

.sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #ffd700, #ffa500);
  border-radius: 50%;
  animation: sparkle 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.5) rotate(180deg);
  }
}

.floating-heart {
  position: absolute;
  color: #ff69b4;
  font-size: 20px;
  animation: float 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes float {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-20px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.5);
  }
}
</style>