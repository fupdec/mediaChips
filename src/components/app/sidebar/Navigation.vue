<template>   
  <div>
    <router-link 
      v-for="item in items" :key="item.title" 
      :to="item.path" class="nav-item"
    >
      <v-list-item link dense>
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>
              {{ item.name }}
            </v-list-item-title>
          </v-list-item-content>
      </v-list-item>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'Navigation',
  data: () => ({
    items: [
      { path: '/home', name: 'Home', icon: 'mdi-home-outline' },
      { path: '/videos',  name: 'Videos', icon: 'mdi-video-outline' },
      { path: '/performers', name: 'Performers', icon: 'mdi-account-outline' },
      { path: '/tags', name: 'Tags', icon: 'mdi-tag-outline' },
      { path: '/websites', name: 'Websites', icon: 'mdi-web' },
      { path: '/settings', name: 'Settings', icon: 'mdi-cog-outline' }
    ],
  }),
}
</script>