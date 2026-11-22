// ============================================================
// Laboratorio 5 · Buscador de personajes con filtros combinados
// API: https://rickandmortyapi.com/documentation
// ============================================================

// ---------- 1. Configuración ----------
const URL_PERSONAJES = "https://rickandmortyapi.com/api/character";
const TEXTO_DESCONOCIDO = "Desconocido";
const SIN_VALOR = "";
const CLAVE_BUSQUEDA = "ultimaBusqueda";

// La API devuelve estos valores en inglés; los traducimos para mostrarlos
const ESTADOS = {
  Alive: { texto: "Vivo", clase: "estado-vivo" },
  Dead: { texto: "Muerto", clase: "estado-muerto" },
  unknown: { texto: TEXTO_DESCONOCIDO, clase: "estado-desconocido" },
};

const GENEROS = {
  Female: "Femenino",
  Male: "Masculino",
  Genderless: "Sin género",
  unknown: TEXTO_DESCONOCIDO,
};

// ---------- 2. Selección de elementos del DOM ----------
const formularioBusqueda = document.querySelector("#formulario-busqueda");
const campoNombre = document.querySelector("#campo-nombre");
const filtroEstado = document.querySelector("#filtro-estado");
const filtroGenero = document.querySelector("#filtro-genero");
const botonBuscar = document.querySelector("#boton-buscar");
const mensajeEstado = document.querySelector("#mensaje-estado");
const contadorResultados = document.querySelector("#contador-resultados");
const contenedorResultados = document.querySelector("#contenedor-resultados");

// ---------- 3. Criterios y construcción de la URL ----------
// Las claves coinciden con los nombres de los parámetros de la API
const leerCriterios = () => ({
  name: campoNombre.value.trim(),
  status: filtroEstado.value,
  gender: filtroGenero.value,
});

const hayCriterios = (criterios) =>
  Object.values(criterios).some((valor) => valor !== SIN_VALOR);

// Solo se agregan a la URL los criterios que tienen valor
const construirUrlBusqueda = (criterios) => {
  const url = new URL(URL_PERSONAJES);
  Object.entries(criterios).forEach(([parametro, valor]) => {
    if (valor !== SIN_VALOR) {
      url.searchParams.set(parametro, valor);
    }
  });
  return url;
};

// ---------- 3b. Persistencia en localStorage ----------
const guardarCriterios = (criterios) => {
  try {
    localStorage.setItem(CLAVE_BUSQUEDA, JSON.stringify(criterios));
  } catch (error) {
    console.warn("No se pudo guardar la búsqueda:", error);
  }
};

const leerCriteriosGuardados = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_BUSQUEDA);
    return guardado ? JSON.parse(guardado) : null;
  } catch (error) {
    return null;
  }
};

const rellenarFormulario = (criterios) => {
  campoNombre.value = criterios.name ?? SIN_VALOR;
  filtroEstado.value = criterios.status ?? SIN_VALOR;
  filtroGenero.value = criterios.gender ?? SIN_VALOR;
};

// ---------- 4. Acceso a la API (no toca el DOM) ----------
const buscarPersonajes = async (criterios) => {
  const respuesta = await fetch(construirUrlBusqueda(criterios));

  // Esta API responde 404 cuando los filtros no tienen coincidencias.
  // No es una falla: significa "cero resultados".
  if (respuesta.status === 404) {
    return { total: 0, personajes: [] };
  }

  // Cualquier otro código fuera del rango 200-299 sí es un error
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con el código ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  const personajes = datos.results ?? [];
  return { total: datos.info?.count ?? personajes.length, personajes };
};

// ---------- 5. Formateo de datos ----------
// Devuelve un texto legible aunque el dato venga vacío, nulo o como "unknown"
const textoSeguro = (valor) => {
  if (!valor || valor === "unknown") {
    return TEXTO_DESCONOCIDO;
  }
  return valor;
};

const obtenerEstado = (estado) => ESTADOS[estado] ?? ESTADOS.unknown;

const obtenerGenero = (genero) => GENEROS[genero] ?? TEXTO_DESCONOCIDO;

const formatearContador = (total, mostrados) => {
  const encontrados =
    total === 1 ? "1 personaje encontrado" : `${total} personajes encontrados`;
  const visibles = mostrados === 1 ? "se muestra 1" : `se muestran ${mostrados}`;
  return `${encontrados} · ${visibles}`;
};

// ---------- 6. Renderizado ----------
const crearDato = (etiqueta, valor) => {
  const termino = document.createElement("dt");
  termino.textContent = etiqueta;

  const descripcion = document.createElement("dd");
  descripcion.textContent = valor;

  return [termino, descripcion];
};

const crearTarjeta = (personaje) => {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarjeta");

  const imagen = document.createElement("img");
  imagen.src = personaje.image;
  imagen.alt = `Retrato de ${textoSeguro(personaje.name)}`;
  imagen.loading = "lazy";
  imagen.width = 300;
  imagen.height = 300;

  const cuerpo = document.createElement("div");
  cuerpo.classList.add("tarjeta-cuerpo");

  const titulo = document.createElement("h2");
  titulo.textContent = textoSeguro(personaje.name);

  const estado = obtenerEstado(personaje.status);
  const indicadorEstado = document.createElement("span");
  indicadorEstado.classList.add("estado", estado.clase);
  indicadorEstado.textContent = `${estado.texto} · ${textoSeguro(personaje.species)}`;

  const listaDatos = document.createElement("dl");
  const cantidadEpisodios = personaje.episode?.length ?? 0;
  listaDatos.append(
    ...crearDato("Género", obtenerGenero(personaje.gender)),
    ...crearDato("Origen", textoSeguro(personaje.origin?.name)),
    ...crearDato("Última ubicación", textoSeguro(personaje.location?.name)),
    ...crearDato("Episodios", `${cantidadEpisodios}`)
  );

  cuerpo.append(titulo, indicadorEstado, listaDatos);
  tarjeta.append(imagen, cuerpo);
  return tarjeta;
};

const mostrarPersonajes = (personajes) => {
  contenedorResultados.replaceChildren(...personajes.map(crearTarjeta));
};

const limpiarResultados = () => {
  contenedorResultados.replaceChildren();
  contadorResultados.textContent = SIN_VALOR;
  contadorResultados.hidden = true;
};

const mostrarContador = (total, mostrados) => {
  contadorResultados.textContent = formatearContador(total, mostrados);
  contadorResultados.hidden = false;
};

// ---------- 7. Estados de la interfaz ----------
const mostrarMensaje = (texto, esError = false) => {
  mensajeEstado.textContent = texto;
  mensajeEstado.classList.toggle("error", esError);
};

const activarCarga = (estaCargando) => {
  botonBuscar.disabled = estaCargando;
  botonBuscar.textContent = estaCargando ? "Buscando…" : "Buscar";
  contenedorResultados.setAttribute("aria-busy", String(estaCargando));
};

// ---------- 8. Manejador del formulario ----------
const ejecutarBusqueda = async (criterios) => {
  if (!hayCriterios(criterios)) {
    limpiarResultados();
    mostrarMensaje("Escribe un nombre o elige un filtro para buscar.", true);
    campoNombre.focus();
    return;
  }

  guardarCriterios(criterios);
  activarCarga(true);
  mostrarMensaje("Buscando personajes…");
  limpiarResultados();

  try {
    const { total, personajes } = await buscarPersonajes(criterios);

    if (personajes.length === 0) {
      mostrarMensaje("No se encontraron personajes con esos criterios.");
      return;
    }

    mostrarPersonajes(personajes);
    mostrarContador(total, personajes.length);
    mostrarMensaje(SIN_VALOR);
  } catch (error) {
    console.error("Error al buscar personajes:", error);

    // fetch lanza TypeError cuando no hay conexión o el servidor no responde
    const mensaje =
      error instanceof TypeError
        ? "No se pudo conectar con la API. Revisa tu conexión e inténtalo de nuevo."
        : `Ocurrió un problema al consultar la API (${error.message}).`;
    mostrarMensaje(mensaje, true);
  } finally {
    activarCarga(false);
  }
};

const manejarBusqueda = (evento) => {
  evento.preventDefault();
  ejecutarBusqueda(leerCriterios());
};

// Al cargar la página, recupera la última búsqueda y la repite
const restaurarUltimaBusqueda = () => {
  const criterios = leerCriteriosGuardados();
  if (!criterios) {
    return;
  }
  rellenarFormulario(criterios);
  if (hayCriterios(leerCriterios())) {
    ejecutarBusqueda(leerCriterios());
  }
};

// ---------- 9. Registro de eventos ----------
formularioBusqueda.addEventListener("submit", manejarBusqueda);
restaurarUltimaBusqueda();
