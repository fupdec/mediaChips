<script>
export default {
  methods: {
    showImage(event, itemId, imgType, cardId) {
      if (event.buttons !== 0) return
      let x = event.clientX
      let y = event.clientY
      let appHeight = window.innerHeight
      let appWidth = window.innerWidth
      let imgSize = 160
      let doubleOffset = 60
      if (appWidth < x + imgSize + doubleOffset) x -= (imgSize + doubleOffset)
      if (appHeight < y + imgSize + doubleOffset) y -= (imgSize + doubleOffset)
      this.$store.state.hoveredImageX = x
      this.$store.state.hoveredImageY = y
      this.$store.state.hoveredImage = true
      this.$store.state.hoveredImageId = itemId
      this.$store.state.hoveredImageMetaId = cardId
      this.$store.state.hoveredImageType = imgType

      this.$store.state.hoveredImageTime = new Date().getTime()
      setTimeout(()=>{
        let currentTime = new Date().getTime()
        if (currentTime - this.$store.state.hoveredImageTime > 4500) {
          this.$store.state.hoveredImage = false
        }
      }, 5000)
    },
  },
}
</script>