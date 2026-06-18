import { createRouter, createWebHistory } from 'vue-router';
import PageHome from '@/pages/PageHome.vue';
import PageItems from '@/pages/PageItems.vue';
import PagePlaylists from '@/pages/PagePlaylists.vue';
import PageMarkers from '@/pages/PageMarkers.vue';
import PageTag from '@/pages/PageTag.vue';
import PageSettings from '@/pages/PageSettings.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: PageHome,
  },
  {
    path: '/media',
    alias: '/meta',
    name: 'Items',
    component: PageItems,
  },
  {
    path: '/playlists',
    name: 'Playlists',
    component: PagePlaylists,
  },
  {
    path: '/markers',
    name: 'Markers',
    component:  PageMarkers,
  },
  {
    path: '/tag',
    name: 'Tag',
    component: PageTag,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: PageSettings,
  },
];

routes.forEach(r => {
  if (!r.component) {
    console.error("❌ Маршрут без компонента:", r.path);
  }
});

export default createRouter({
  history: createWebHistory(),
  routes
});