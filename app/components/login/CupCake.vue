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
const leftEyeBaseRef = ref<SVGEllipseElement>()
const rightEyeBaseRef = ref<SVGEllipseElement>()
const leftEyelidRef = ref<SVGGElement>()
const rightEyelidRef = ref<SVGGElement>()
const leftPupilRef = ref<SVGEllipseElement>()
const rightPupilRef = ref<SVGEllipseElement>()
const leftShine1Ref = ref<SVGCircleElement>()
const leftShine2Ref = ref<SVGCircleElement>()
const rightShine1Ref = ref<SVGCircleElement>()
const rightShine2Ref = ref<SVGCircleElement>()

// Estado reactivo
const eyesOpen = ref<boolean>(true)
const automaticBlinking = ref<boolean>(true)

// Posiciones de las pupilas y brillos
const leftPupilPos = reactive<Position>({ x: 150, y: 170 })
const rightPupilPos = reactive<Position>({ x: 200, y: 170 })
const leftShine1Pos = reactive<Position>({ x: 146, y: 161 })
const leftShine2Pos = reactive<Position>({ x: 153, y: 178 })
const rightShine1Pos = reactive<Position>({ x: 196, y: 161 })
const rightShine2Pos = reactive<Position>({ x: 203, y: 178 })

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
const getEyeCenter = (eyeBase: SVGEllipseElement): Position => {
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
  leftPupilPos.y = 170 + leftSvgMoveY

  rightPupilPos.x = 200 + rightSvgMoveX
  rightPupilPos.y = 170 + rightSvgMoveY

  // Actualizar brillo en los ojos
  leftShine1Pos.x = 146 + leftSvgMoveX * 0.6
  leftShine1Pos.y = 161 + leftSvgMoveY * 0.6
  leftShine2Pos.x = 153 + leftSvgMoveX * 0.4
  leftShine2Pos.y = 178 + leftSvgMoveY * 0.4

  rightShine1Pos.x = 196 + rightSvgMoveX * 0.6
  rightShine1Pos.y = 161 + rightSvgMoveY * 0.6
  rightShine2Pos.x = 203 + rightSvgMoveX * 0.4
  rightShine2Pos.y = 178 + rightSvgMoveY * 0.4
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
      <!-- Estilo rubber hose años 30 (Cuphead): contornos gruesos, colores planos crema/rojo -->
      <svg
        id="cupcake-svg"
        ref="cupcakeSvgRef"
        width="250"
        height="350"
        viewBox="0 0 350 450"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="strawClip">
            <path d="M127.6 109.6 L103.6 33.6 L88.4 38.4 L112.4 114.4 Z" />
          </clipPath>
        </defs>

        <!-- Sombra plana -->
        <ellipse
          cx="175"
          cy="424"
          rx="102"
          ry="14"
          fill="#241F1C"
          opacity="0.25"
        />

        <!-- Pajita a rayas (marca de la casa Cuphead) -->
        <g>
          <path
            d="M127.6 109.6 L103.6 33.6 L88.4 38.4 L112.4 114.4 Z"
            fill="#F2E4C0"
          />
          <g clip-path="url(#strawClip)">
            <line
              x1="95.2"
              y1="96.4"
              x2="131.4"
              y2="85.0"
              class="cc-accent-stroke"
              stroke-width="10"
            />
            <line
              x1="89.4"
              y1="78.2"
              x2="125.6"
              y2="66.8"
              class="cc-accent-stroke"
              stroke-width="10"
            />
            <line
              x1="83.7"
              y1="59.9"
              x2="119.9"
              y2="48.5"
              class="cc-accent-stroke"
              stroke-width="10"
            />
          </g>
          <path
            d="M127.6 109.6 L103.6 33.6 L88.4 38.4 L112.4 114.4 Z"
            fill="none"
            stroke="#241F1C"
            stroke-width="6"
            stroke-linejoin="round"
          />
        </g>

        <!-- Base del cupcake (wrapper) con estrías crema; el color acompaña a la cabecera -->
        <path
          d="M88 228 L262 228 L246 388 L104 388 Z"
          class="cc-accent-fill"
          stroke="#241F1C"
          stroke-width="7"
          stroke-linejoin="round"
        />
        <line
          x1="118"
          y1="240"
          x2="124"
          y2="378"
          stroke="#F2E4C0"
          stroke-width="7"
        />
        <line
          x1="146"
          y1="240"
          x2="149"
          y2="378"
          stroke="#F2E4C0"
          stroke-width="7"
        />
        <line
          x1="175"
          y1="240"
          x2="175"
          y2="378"
          stroke="#F2E4C0"
          stroke-width="7"
        />
        <line
          x1="204"
          y1="240"
          x2="201"
          y2="378"
          stroke="#F2E4C0"
          stroke-width="7"
        />
        <line
          x1="232"
          y1="240"
          x2="226"
          y2="378"
          stroke="#F2E4C0"
          stroke-width="7"
        />

        <!-- Frosting: nube crema con goterones, silueta cartoon -->
        <path
          d="M80 214
             C 72 240, 96 250, 104 234
             C 110 252, 136 254, 142 236
             C 150 256, 178 256, 184 236
             C 192 254, 216 252, 222 234
             C 230 248, 252 246, 258 228
             C 264 240, 276 232, 274 214
             C 282 196, 272 180, 258 176
             C 272 158, 262 136, 244 134
             C 252 112, 234 96, 214 100
             C 214 78, 190 68, 174 80
             C 158 64, 132 72, 130 94
             C 108 92, 96 110, 104 128
             C 86 132, 78 152, 90 166
             C 74 176, 72 200, 80 214
             Z"
          class="cc-frosting"
          stroke="#241F1C"
          stroke-width="7"
          stroke-linejoin="round"
        />

        <!-- Cereza con brillo y rabito -->
        <circle
          cx="212"
          cy="80"
          r="16"
          fill="#B3382C"
          stroke="#241F1C"
          stroke-width="6"
        />
        <ellipse
          cx="206"
          cy="74"
          rx="4.5"
          ry="6.5"
          fill="#F2E4C0"
          opacity="0.9"
          transform="rotate(-25 206 74)"
        />
        <path
          d="M212 64 Q218 48 230 42"
          fill="none"
          stroke="#241F1C"
          stroke-width="5"
          stroke-linecap="round"
        />
        <ellipse
          cx="234"
          cy="40"
          rx="9"
          ry="5"
          fill="#66803F"
          stroke="#241F1C"
          stroke-width="4"
          transform="rotate(-20 234 40)"
        />

        <!-- Ojos: óvalos verticales estilo rubber hose -->
        <ellipse
          ref="leftEyeBaseRef"
          cx="150"
          cy="170"
          rx="23"
          ry="30"
          fill="#FFFDF4"
          stroke="#241F1C"
          stroke-width="7"
        />
        <ellipse
          ref="rightEyeBaseRef"
          cx="200"
          cy="170"
          rx="23"
          ry="30"
          fill="#FFFDF4"
          stroke="#241F1C"
          stroke-width="7"
        />

        <!-- Párpados para el parpadeo: tapa crema + pestaña de ojo cerrado -->
        <g
          ref="leftEyelidRef"
          :style="{ transformOrigin: '150px 170px', transform: 'scaleY(0)', opacity: '0' }"
        >
          <ellipse
            cx="150"
            cy="170"
            rx="23"
            ry="30"
            class="cc-frosting"
            stroke="#241F1C"
            stroke-width="7"
          />
          <path
            d="M134 178 Q150 190 166 178"
            fill="none"
            stroke="#241F1C"
            stroke-width="5"
            stroke-linecap="round"
          />
        </g>
        <g
          ref="rightEyelidRef"
          :style="{ transformOrigin: '200px 170px', transform: 'scaleY(0)', opacity: '0' }"
        >
          <ellipse
            cx="200"
            cy="170"
            rx="23"
            ry="30"
            class="cc-frosting"
            stroke="#241F1C"
            stroke-width="7"
          />
          <path
            d="M184 178 Q200 190 216 178"
            fill="none"
            stroke="#241F1C"
            stroke-width="5"
            stroke-linecap="round"
          />
        </g>

        <!-- Pupilas: óvalos negros sólidos que siguen el ratón -->
        <ellipse
          ref="leftPupilRef"
          :cx="leftPupilPos.x"
          :cy="leftPupilPos.y"
          rx="10"
          ry="16"
          fill="#241F1C"
        />
        <ellipse
          ref="rightPupilRef"
          :cx="rightPupilPos.x"
          :cy="rightPupilPos.y"
          rx="10"
          ry="16"
          fill="#241F1C"
        />

        <!-- Brillos de las pupilas -->
        <circle
          ref="leftShine1Ref"
          :cx="leftShine1Pos.x"
          :cy="leftShine1Pos.y"
          r="4.5"
          fill="#FFFDF4"
        />
        <circle
          ref="leftShine2Ref"
          :cx="leftShine2Pos.x"
          :cy="leftShine2Pos.y"
          r="2.5"
          fill="#FFFDF4"
          opacity="0.8"
        />
        <circle
          ref="rightShine1Ref"
          :cx="rightShine1Pos.x"
          :cy="rightShine1Pos.y"
          r="4.5"
          fill="#FFFDF4"
        />
        <circle
          ref="rightShine2Ref"
          :cx="rightShine2Pos.x"
          :cy="rightShine2Pos.y"
          r="2.5"
          fill="#FFFDF4"
          opacity="0.8"
        />

        <!-- Sonrisa con remates curvos en los extremos -->
        <path
          d="M152 212 Q175 230 198 212"
          fill="none"
          stroke="#241F1C"
          stroke-width="7"
          stroke-linecap="round"
        />
        <path
          d="M152 212 Q145 209 143 202"
          fill="none"
          stroke="#241F1C"
          stroke-width="5"
          stroke-linecap="round"
        />
        <path
          d="M198 212 Q205 209 207 202"
          fill="none"
          stroke="#241F1C"
          stroke-width="5"
          stroke-linecap="round"
        />

        <!-- Mejillas -->
        <ellipse
          cx="116"
          cy="192"
          rx="11"
          ry="7"
          fill="#DE9E7F"
          opacity="0.6"
        />
        <ellipse
          cx="234"
          cy="192"
          rx="11"
          ry="7"
          fill="#DE9E7F"
          opacity="0.6"
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
  font-family: 'Arial Black', sans-serif;
  overflow: hidden;
}

.container {
  position: relative;
  cursor: url("../../../public/img/strawberry-icon.png"), none;
  padding-left: 25%;
}

#cupcake-svg {
  /* Modo claro: frosting de chocolate; acento = color de la cabecera */
  --cc-frosting: #7b4b2a;
  --cc-accent: var(--color-french-lilac-700);
  filter: drop-shadow(12px 12px 20px rgba(0, 0, 0, 0.4));
  animation: bounce 3s ease-in-out infinite;
}

/* Modo oscuro: frosting crema; acento = color de la cabecera en oscuro */
.dark #cupcake-svg {
  --cc-frosting: #f2e4c0;
  --cc-accent: var(--color-french-lilac-950);
}

.cc-frosting {
  fill: var(--cc-frosting);
}

.cc-accent-fill {
  fill: var(--cc-accent);
}

.cc-accent-stroke {
  stroke: var(--cc-accent);
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
}
</style>
