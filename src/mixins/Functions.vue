<script>
export default {
  methods: {
    getVideosTotalSize(videos) {
      let sizes = videos.map(video=>(video.size))
      let total = 0
      for (let i=0; i<sizes.length; i++) {
        total += sizes[i]
      }
      if (total > 1000000000000) {
        total = (total/1024/1024/1024/1024-0.01).toFixed(2) + ' TB'
      } else if (total > 1000000000) {
        total = (total/1024/1024/1024-0.01).toFixed(2) + ' GB'
      } else if (total > 1000000) {
        total = (total/1024/1024-0.01).toFixed(0) + ' MB'
      } else if (total > 1000) {
        total = (total/1024-0.01).toFixed(0) + ' KB'
      } else {
        total += ' B'
      }
      return total
    },
    calcSize(size) {
      if (size > 1000000000000) {
        size = (size/1024/1024/1024/1024-0.01).toFixed(2) + ' TB'
      } else if (size > 1000000000) {
        size = (size/1024/1024/1024-0.01).toFixed(2) + ' GB'
      } else if (size > 1000000) {
        size = (size/1024/1024-0.01).toFixed(0) + ' MB'
      } else if (size > 1000) {
        size = (size/1024-0.01).toFixed(0) + ' KB'
      } else {
        size += ' B'
      }
      return size
    },
    calcBitrate(value) {
      if (value > 1000000) {
        value = (value/1024/1024-0.01).toFixed(0) + ' Mbps'
      } else if (value > 1000) {
        value = (value/1024-0.01).toFixed(0) + ' Kbps'
      } else {
        value += ' bps'
      }
      return value
    },
    calcHeightTitle(resolution) {
      let height = resolution.match(/\x(.*)/)[1]
      let title = {}
      if (height < 720) {
        title = 'SD'
      } else if (height >= 720 && height < 1080) {
        title = 'HD'
      } else if (height >= 1080 && height < 1800) {
        title = 'FHD'
      } else if (height >= 1800) {
        title = 'UHD'
      }
      return title
    },
    calcHeightValue(resolution) {
      let height = resolution.match(/\x(.*)/)[1]
      let title = {}
      if (height > 1800) {
        title = '4K'
      } else {
        title = height + 'p'
      }
      return title
    },
    calcDur(duration) {
      let sec = Math.floor(duration);
      let h = sec / 3600 ^ 0 
      let m = (sec - h * 3600) / 60 ^ 0 
      let s = sec - h * 3600 - m * 60 
      h = h < 10 ? "0" + h + ":" : h
      if (h === "00:") h = ""
      m = m < 10 ? "0" + m : m
      s = s < 10 ? "0" + s : s
      let total = h + m + ":" + s
      return total
    },
  },
}
</script>