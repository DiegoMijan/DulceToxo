<template>
  <div class="h-60 w-60">
    <TresCanvas>
      <!-- Tu escena vive aqui -->
      <TresPerspectiveCamera
        :position="[0, 0, 5]"
        :look-at="[0, 0, 0]"
        :fov="45"
      />
      <TresMesh>
        <TresTorusGeometry :args="[1, 0.5, 16, 32]" />
        <TresMeshBasicMaterial color="orange" />
      </TresMesh>
    </TresCanvas>
  </div>
</template>
