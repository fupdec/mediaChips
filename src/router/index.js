import Vue from 'vue'
import VueRouter from 'vue-router'
const Home = () => import('../views/HomePage.vue')
const HomeAppbar = () => import('../components/pages/home/HomeAppbar.vue')
const Videos = () => import('../views/VideosPage.vue')
const VideosAppbar = () => import('../components/pages/videos/VideosAppbar.vue')
const Playlists = () => import('../views/PlaylistsPage.vue')
const PlaylistsAppbar = () => import('../components/pages/playlists/PlaylistsAppbar.vue')
const Settings = () => import('../views/SettingsPage.vue')
const SettingsAppbar = () => import('../components/pages/settings/SettingsAppbar.vue')
const Meta = () => import('../views/MetaPage.vue')
const MetaAppbar = () => import('../components/pages/meta/MetaAppbar.vue')
const MetaCard = () => import('../views/MetaCardPage.vue')
const MetaCardAppbar = () => import('../components/pages/meta/MetaCardAppbar.vue')

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    components: {
      default: Home,
      appbar: HomeAppbar,
    }
  },
  {
    path: '/videos/:id?',
    name: 'Videos',
    components: {
      default: Videos,
      appbar: VideosAppbar,
    }
  },
  {
    path: '/playlists/:id?',
    name: 'Playlists',
    components: {
      default: Playlists,
      appbar: PlaylistsAppbar,
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    components: {
      default: Settings,
      appbar: SettingsAppbar,
    }
  },
  {
    path: '/meta',
    name: 'Meta',
    components: {
      default: Meta,
      appbar: MetaAppbar,
    }
  },
  {
    path: '/metacard',
    name: 'MetaCard',
    components: {
      default: MetaCard,
      appbar: MetaCardAppbar,
    }
  },
]

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
