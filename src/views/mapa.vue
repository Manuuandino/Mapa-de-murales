<script setup>
import { ref, onMounted } from 'vue'
import { useMapa } from '../composables/mapa'

const { form, initMapa, cargarLugares, handleFileChange, guardarLugar, error } = useMapa()

// referencia al input file
const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value?.click()
}

onMounted(() => {
  initMapa('map', (lat, lng) => {
    window.alert(`Ubicación elegida: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
  })
  cargarLugares()
})
</script>

<template>
  <div id="app" class="w-full h-screen flex flex-col">
    <div id="map" style="flex: 1;"></div>

    <form class="bg-pink-500 p-4 flex flex-col gap-3" @submit.prevent="guardarLugar">
      <h2 class="font-bold text-xl">AGREGAR LUGAR</h2>
      <input v-model="form.nombre" placeholder="Nombre" required class="p-2 mb-2" />
      <input v-model="form.descripcion" placeholder="Descripción" class="p-2 mb-2" />

      <button type="button" class="w-md self-center" @click="triggerFileInput">
        Subir imagen
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="e => handleFileChange(e.target.files[0])"
        style="display:none"
      />

      <div class="self-center" v-if="form.imagenPreview" style="margin-top: 10px;">
        <img :src="form.imagenPreview" alt="Vista previa" style="max-width: 200px; border-radius: 8px;" />
      </div>

      <p v-if="error" class="text-red-500">{{ error }}</p>

      <button type="submit" class="w-md self-center">
        Guardar lugar
      </button>
    </form>
  </div>
</template>

<style>
@import 'leaflet/dist/leaflet.css';
</style>
