<script setup>
import { ref, onMounted } from 'vue'
// Importamos Leaflet para el mapa
import L from 'leaflet'

// Estado reactivo para almacenar los datos del formulario
const form = ref({
  nombre: '',
  descripcion: '',
  lat: null,
  lng: null,
  imagen: null,
  imagenPreview: null,
})

// Estado reactivo para manejar errores
const error = ref(null)
let map = null
let markersGroup = null

// Referencia al input file oculto en el template
const fileInput = ref(null)

// Función para disparar el input file oculto al hacer clic en el botón
function triggerFileInput() {
  fileInput.value?.click()
}

// Función que se ejecuta cuando cambia el archivo seleccionado
function onFileChange(event) {
  const file = event.target.files[0]
  if (file) {
     // Si ya hay una URL previa, la liberamos para no generar fugas de memoria
    if (form.value.imagenPreview) {
      URL.revokeObjectURL(form.value.imagenPreview)
    }
     // Guardamos el archivo en el formulario
    form.value.imagen = file
     // Creamos una URL temporal para mostrar la vista previa
    form.value.imagenPreview = URL.createObjectURL(file)
  }
}

// Función para inicializar el mapa Leaflet
function initMapa() {
  // Creamos el mapa centrado en La Plata
  map = L.map('map').setView([-34.9214, -57.9544], 12)

  // Agregamos la capa de mosaicos de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

   // Creamos un grupo para contener los marcadores
  markersGroup = L.layerGroup().addTo(map)

   // Al hacer clic en el mapa, guardamos la latitud y longitud seleccionada
  map.on('click', (e) => {
    form.value.lat = e.latlng.lat
    form.value.lng = e.latlng.lng
    alert(`Ubicación elegida: ${form.value.lat.toFixed(5)}, ${form.value.lng.toFixed(5)}`)
  })
}

// Hook de ciclo de vida que ejecuta código cuando el componente se monta
onMounted(() => {
  initMapa()
})
</script>

<template>
  <div id="app" class="h-screen w-screen flex flex-col">
    <!-- Div donde se monta el mapa -->
    <div id="map" style="flex: 1;"></div>

    <!-- Formulario para agregar lugar + subir imagen -->
    <form class="bg-pink-500 p-4 flex flex-col gap-3" @submit.prevent="alert('Aquí va lógica para guardar')">
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
        @change="onFileChange"
        style="display:none"
      />

      <div class="self-center" v-if="form.imagenPreview" style="margin-top: 10px;">
        <img :src="form.imagenPreview" alt="Vista previa" style="max-width: 200px; border-radius: 8px;" />
      </div>

      <button type="submit" class="w-md self-center">
        Guardar lugar
      </button>
    </form>
  </div>
</template>

<style>
@import 'leaflet/dist/leaflet.css';
</style>
