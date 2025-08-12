// src/composables/useMapa.js
import { ref } from 'vue'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import imageCompression from 'browser-image-compression'

export function useMapa() {
  // Estado reactivo para el formulario
  const form = ref({
    nombre: '',
    descripcion: '',
    lat: null,
    lng: null,
    file: null,           // Archivo original para subir
    imagenPreview: null,  // URL temporal para mostrar preview
  })

  const error = ref(null)
  let map = null
  let markersGroup = null

  // Inicializa el mapa Leaflet (igual que antes)
  function initMapa(containerId, onClickMap) {
    map = L.map(containerId).setView([-34.9214, -57.9544], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    markersGroup = L.layerGroup().addTo(map)
    if (onClickMap) {
      map.on('click', (e) => {
        form.value.lat = e.latlng.lat
        form.value.lng = e.latlng.lng
        onClickMap(form.value.lat, form.value.lng)
      })
    }
  }

  // Carga los lugares guardados
  async function cargarLugares() {
    const { data, error: err } = await supabase.from('lugares').select('*')
    if (err) {
      error.value = 'No se pudieron cargar los lugares.'
      return
    }
    markersGroup.clearLayers()
    data.forEach(lugar => {
      const marker = L.marker([lugar.lat, lugar.lng])
      let popup = `<b>${lugar.nombre}</b><br/>`
      if (lugar.foto_thumb_url) {
        popup += `<img src="${lugar.foto_thumb_url}" style="width:150px;"><br/>`
      }
      if (lugar.descripcion) {
        popup += `<p>${lugar.descripcion}</p>`
      }
      marker.bindPopup(popup).addTo(markersGroup)
    })
  }

  // Maneja el cambio de archivo, guarda el archivo y crea URL para preview
  function handleFileChange(file) {
    if (file) {
      form.value.file = file
      form.value.imagenPreview = URL.createObjectURL(file)
    }
  }

  // Optimiza la imagen antes de subir
  async function optimizarImagen(file) {
    try {
      return await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
    } catch {
      return file
    }
  }

  // Sube la imagen al storage y devuelve la URL pública
  async function subirImagen(file, nombreArchivo) {
    const { error: uploadError } = await supabase
      .storage
      .from('fotos-lugares')
      .upload(nombreArchivo, file)

    if (uploadError) throw uploadError

    const { data: publicData, error: urlError } = supabase
      .storage
      .from('fotos-lugares')
      .getPublicUrl(nombreArchivo)

    if (urlError) throw urlError
    return publicData.publicUrl
  }

  // Guarda el lugar (con imagen) en la BD y actualiza mapa
  async function guardarLugar() {
  if (!form.value.lat || !form.value.lng) {
    error.value = 'Elegí una ubicación.'
    return
  }
  if (!form.value.file) {
    error.value = 'Seleccioná una foto.'
    return
  }

  const imagenOpt = await optimizarImagen(form.value.file)
  const nombreArchivo = `fotos/${Date.now()}_${form.value.file.name}`
  const urlFoto = await subirImagen(imagenOpt, nombreArchivo)

  const { error: insertError } = await supabase.from('lugares').insert({
    nombre: form.value.nombre,
    descripcion: form.value.descripcion,
    lat: form.value.lat,
    lng: form.value.lng,
    foto_url: urlFoto,
    foto_thumb_url: urlFoto
  })

  if (insertError) throw insertError

  await cargarLugares()

  // 🔹 Limpiar formulario y vista previa
  form.value = {
    nombre: '',
    descripcion: '',
    lat: null,
    lng: null,
    file: null,
    imagenPreview: null
  }
}


  // Exponemos las funciones y variables para usar en el componente
  return {
    form,
    error,
    initMapa,
    cargarLugares,
    handleFileChange,
    guardarLugar,
  }
}
