<template>
  <div id="app" style="height: 100vh; display: flex; flex-direction: column;">
    <div id="map" style="flex: 1;"></div>

    <form @submit.prevent="handleSubmit" style="padding: 1rem; background: #f0f0f0;">
      <h2>Agregar lugar</h2>
      <input v-model="form.nombre" placeholder="Nombre" required />
      <input v-model="form.descripcion" placeholder="Descripción" />
      <input type="file" @change="handleFileChange" accept="image/*" required />
      <button type="submit">Guardar lugar</button>
      <p v-if="error" style="color: red;">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabase'
import L from 'leaflet'
import imageCompression from 'browser-image-compression'

const form = ref({
  nombre: '',
  descripcion: '',
  lat: null,
  lng: null,
  file: null,
})

const error = ref(null)
let map = null
let markersGroup = null

// Inicializar mapa Leaflet
onMounted(() => {
map = L.map('map').setView([-34.9214, -57.9544], 12) // centrado en La Plata

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  markersGroup = L.layerGroup().addTo(map)

  // Cargar lugares guardados de Supabase
  cargarLugares()

  // Permitir elegir lat/lng con clic
  map.on('click', (e) => {
    form.value.lat = e.latlng.lat
    form.value.lng = e.latlng.lng
    alert(`Ubicación elegida: ${form.value.lat.toFixed(5)}, ${form.value.lng.toFixed(5)}`)
  })
})

// Cargar lugares y mostrarlos en el mapa
async function cargarLugares() {
  const { data, error: err } = await supabase.from('lugares').select('*')
  if (err) {
    console.error('Error cargando lugares:', err)
    return
  }
  markersGroup.clearLayers()

  data.forEach(lugar => {
    const marker = L.marker([lugar.lat, lugar.lng])
    let popupContent = `<b>${lugar.nombre}</b><br/>`
    if (lugar.foto_thumb_url) {
      popupContent += `<img src="${lugar.foto_thumb_url}" alt="${lugar.nombre}" style="width: 150px;"/><br/>`
    }
    if (lugar.descripcion) {
      popupContent += `<p>${lugar.descripcion}</p>`
    }
    marker.bindPopup(popupContent)
    marker.addTo(markersGroup)
  })
}

// Manejar cambio de archivo y guardar en form
function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) form.value.file = file
}

// Optimizar imagen con browser-image-compression
async function optimizarImagen(file) {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  }
  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (e) {
    console.error('Error optimizando imagen:', e)
    return file
  }
}

// Subir imagen y retornar URL pública
async function subirImagen(file, nombreArchivo) {
  const { data, error } = await supabase.storage
    .from('fotos-lugares')
    .upload(nombreArchivo, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  // Obtener URL pública (si el bucket es público)
  const { publicURL, error: urlError } = supabase.storage
    .from('fotos-lugares')
    .getPublicUrl(nombreArchivo)
  if (urlError) throw urlError
  return publicURL
}

// Manejar envío de formulario
async function handleSubmit() {
  error.value = null

  if (!form.value.lat || !form.value.lng) {
    error.value = 'Por favor elegí una ubicación en el mapa haciendo clic.'
    return
  }
  if (!form.value.file) {
    error.value = 'Por favor seleccioná una foto.'
    return
  }

  try {
    // Optimizar imagen original
    const imagenOptimizada = await optimizarImagen(form.value.file)

    // Subir imagen optimizada
    const timestamp = Date.now()
    const nombreArchivo = `fotos/${timestamp}_${form.value.file.name}`
    const urlFoto = await subirImagen(imagenOptimizada, nombreArchivo)

    // Para simplificar, usamos la misma imagen como miniatura (más adelante podemos generar una mini thumbnail)
    const urlMini = urlFoto

    // Insertar registro en la tabla
    const { data, error: insertError } = await supabase.from('lugares').insert({
      nombre: form.value.nombre,
      descripcion: form.value.descripcion,
      lat: form.value.lat,
      lng: form.value.lng,
      foto_url: urlFoto,
      foto_thumb_url: urlMini,
    })

    if (insertError) throw insertError

    // Recargar marcadores
    cargarLugares()

    // Limpiar form
    form.value.nombre = ''
    form.value.descripcion = ''
    form.value.file = null
    form.value.lat = null
    form.value.lng = null
    document.querySelector('input[type="file"]').value = ''

  } catch (e) {
    console.error(e)
    error.value = 'Error al guardar el lugar.'
  }
}
</script>

<style>
@import 'leaflet/dist/leaflet.css';

#map {
  width: 100%;
  height: 60vh;
}
</style>
