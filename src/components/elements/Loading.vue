<template>
  <div class="loader">
    <svg
      viewBox="0 0 640 640"
      style="width: 20%; max-width: 180px; min-width: 120px"
    >
      <path
        class="logo m"
        d="M600.5,300.5C600.5,125,511,.5,450.5.5s-89.5,150-150,150S211,.5,150.5.5.5,125,.5,300.5s124.5,300,300,300S600.5,476,600.5,300.5Z"
      />
    </svg>
    <svg
      viewBox="0 0 640 640"
      style="width: 20%; max-width: 180px; min-width: 120px"
    >
      <path
        class="logo c"
        d="M440.5,240.5c-107.52,0-54.45,150-140,150-82.75,0-26.86-150-140-150-140.25,0-140.49,360,140,360S581.68,240.5,440.5,240.5Z"
      />
    </svg>
  </div>
</template>

<style lang="scss" scoped>
.loader {
  padding-top: 20px;
  display: flex;
  justify-content: center;
  width: 100%;
  position: relative;
  svg:last-of-type {
    bottom: 0;
    margin: auto;
    position: absolute;
  }
}
.logo {
  fill: none;
  stroke-width: 3px;
  &.m {
    stroke-dasharray: 1035;
    stroke-dashoffset: 2000;
    stroke: rgb(var(--v-theme-primary));
    animation-name: dash;
    animation-duration: 2s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  &.c {
    stroke-dasharray: 790;
    stroke-dashoffset: 1560;
    stroke: rgb(var(--v-theme-secondary));
    animation-name: dash;
    animation-delay: 0.3s;
    animation-duration: 2s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
}
@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>