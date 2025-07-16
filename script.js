// Inicializar el mapa
const map = L.map('map').setView([4.711, -74.0721], 12);

// Cargar mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Variable global de zonas
let todasLasZonas = [];

// Función IA: predicción de mejora
function predecirMejora(estado, accion) {
  if (estado === "Crítico" && accion === "Reforestación") return "Regular";
  if (estado === "Crítico" && accion === "Limpieza") return "Crítico";
  if (estado === "Regular" && accion === "Campaña comunitaria") return "Bueno";
  if (estado === "Regular" && accion === "Reforestación") return "Bueno";
  if (estado === "Bueno") return "Bueno";
  return estado;
}

// Función para calcular distancia entre coordenadas
function distancia(coord1, coord2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);

  const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Buscar recomendaciones cercanas con estado similar
function recomendarZonas(zonaActual) {
  const recomendaciones = todasLasZonas.filter(z => 
    z.nombre !== zonaActual.nombre &&
    distancia(z.coordenadas, zonaActual.coordenadas) < 3 &&
    z.estado === zonaActual.estado
  );
  if (recomendaciones.length === 0) return "Sin recomendaciones similares cerca.";
  return recomendaciones.map(z => `• ${z.nombre}`).join("<br>");
}

// Cargar zonas verdes
fetch('zonas_verdes.json')
  .then(response => response.json())
  .then(data => {
    todasLasZonas = data.zonas;

    data.zonas.forEach(zona => {
      const marker = L.marker(zona.coordenadas).addTo(map);
      
      marker.on('click', () => {
        const contenedor = document.createElement('div');
        contenedor.innerHTML = `
          <b>${zona.nombre}</b><br>
          Estado actual: ${zona.estado}<br><br>
          <label for="accion">Aplicar acción:</label>
          <select id="accion">
            <option value="Reforestación">Reforestación</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Campaña comunitaria">Campaña comunitaria</option>
          </select><br><br>
          <button id="predecirBtn">Predecir mejora</button><br><br>
          <div id="resultadoPrediccion"></div>
          <hr>
          <b>Recomendaciones similares:</b><br>
          <div id="recomendaciones"></div>
        `;

        const popup = L.popup().setLatLng(zona.coordenadas).setContent(contenedor).openOn(map);

        setTimeout(() => {
          const btn = document.getElementById('predecirBtn');
          const accionSelect = document.getElementById('accion');
          const resultadoDiv = document.getElementById('resultadoPrediccion');
          const recomendacionesDiv = document.getElementById('recomendaciones');

          btn.onclick = () => {
            const accion = accionSelect.value;
            const nuevoEstado = predecirMejora(zona.estado, accion);
            resultadoDiv.innerHTML = `Nuevo estado estimado: <b>${nuevoEstado}</b>`;
          };

          recomendacionesDiv.innerHTML = recomendarZonas(zona);
        }, 100);
      });
    });
  });
