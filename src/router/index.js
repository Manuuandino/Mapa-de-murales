import { createRouter, createWebHistory } from 'vue-router'
import Mapa from '../views/mapa.vue'

const routes = [
  {
    path: '/mapa',
    name: 'Mapa',
    component: Mapa,
  },
  // puedes agregar más rutas aquí
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
