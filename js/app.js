/**
 * app.js — Lógica principal · Joyería Ruben's
 *
 * Funcionalidades:
 *  - Renderizado dinámico de productos
 *  - Filtros por categoría
 *  - Lightbox de imagen completa
 *  - Modal de cotización → abre WhatsApp con mensaje prellenado
 *  - Animaciones de entrada con IntersectionObserver
 *  - Menú hamburguesa en móvil
 */

const productos = [
  {
    id: 1,
    nombre: "Anillo Solitario",
    categoria: "anillos",
    img: "img/anillo.jpg",
    descripcion: "Anillo artesanal en plata 925. Diseño clásico solitario, ideal para compromisos o regalo especial. Disponible en tallas personalizadas.",
    destacado: true,
  },
  {
    id: 2,
    nombre: "Cadena Figaro",
    categoria: "cadenas",
    img: "img/cadena.jpg",
    descripcion: "Cadena estilo Figaro en acero inoxidable de alta calidad. Resistente al agua, antialérgica y de acabado brillante.",
    destacado: false,
  },
  {
    id: 3,
    nombre: "Aros Clásicos",
    categoria: "aros",
    img: "img/aro.jpg",
    descripcion: "Aros de plata con acabado pulido. Livianos y elegantes, perfectos para el uso diario.",
    destacado: false,
  },
  {
    id: 4,
    nombre: "Medalla Religiosa",
    categoria: "medallas",
    img: "img/medalla.jpg",
    descripcion: "Medalla religiosa en plata 925 con grabado en relieve. Personalizable con nombre o fecha.",
    destacado: true,
  },
  {
    id: 5,
    nombre: "Filigrana Artesanal",
    categoria: "especiales",
    img: "img/filigrama.jpg",
    descripcion: "Pieza única en técnica de filigrana. Trabajo artesanal de precisión con hilos de plata entrelazados.",
    destacado: true,
  },
  {
    id: 6,
    nombre: "Camino del Inca",
    categoria: "especiales",
    img: "img/caminodelinca.jpg",
    descripcion: "Diseño exclusivo inspirado en la orfebrería andina. Pieza de colección realizada a mano.",
    destacado: false,
  },
  {
    id: 7,
    nombre: "Aros de Oro",
    categoria: "aros",
    img: "img/arosdeoro.jpg",
    descripcion: "Aros bañados en oro 18k. Diseño atemporal que combina con cualquier estilo.",
    destacado: true,
  },
  {
    id: 8,
    nombre: "Medalla de Oro",
    categoria: "medallas",
    img: "img/medallaoro.jpg",
    descripcion: "Medalla en oro 18k con detalles en relieve. Pieza premium para momentos especiales.",
    destacado: false,
  },
];

const getCategorias = () => [
  "todos",
  ...new Set(productos.map((p) => p.categoria)),
];
/* ── Constantes ────────────────────────────────────────────── */
const WHATSAPP_NUM = '56930324713';

/* ── Referencias DOM ───────────────────────────────────────── */
const productosGrid    = document.getElementById('productosGrid');
const filtrosContenedor = document.getElementById('filtros');
const lightbox         = document.getElementById('lightbox');
const lbImg            = document.getElementById('lbImg');
const lbNombre         = document.getElementById('lbNombre');
const lbCategoria      = document.getElementById('lbCategoria');
const lbDesc           = document.getElementById('lbDesc');
const lbBtnCotizar     = document.getElementById('lbBtnCotizar');
const lbClose          = document.getElementById('lbClose');
const modalCotizacion  = document.getElementById('modalCotizacion');
const formCotizacion   = document.getElementById('formCotizacion');
const inputNombre      = document.getElementById('inputNombre');
const inputDetalle     = document.getElementById('inputDetalle');
const btnCancelar      = document.getElementById('btnCancelar');
const btnEnviar        = document.getElementById('btnEnviar');
const navToggle        = document.getElementById('navToggle');
const siteNav          = document.getElementById('siteNav');

/* ── Estado ────────────────────────────────────────────────── */
let categoriaActiva = 'todos';
let productoActivo  = null;  // producto abierto en lightbox/modal

/* ══════════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════════ */

/** Renderiza los botones de filtro a partir de las categorías del array */
function renderFiltros() {
  const categorias = getCategorias();

  filtrosContenedor.innerHTML = categorias.map((cat) => `
    <button
      class="filtros__btn ${cat === categoriaActiva ? 'activo' : ''}"
      data-categoria="${cat}"
      aria-pressed="${cat === categoriaActiva}"
    >
      ${cat === 'todos' ? 'Todos' : capitalizar(cat)}
    </button>
  `).join('');

  filtrosContenedor.querySelectorAll('.filtros__btn').forEach((btn) => {
    btn.addEventListener('click', () => filtrar(btn.dataset.categoria));
  });
}

/** Renderiza las cards de productos */
function renderProductos() {
  // Duplicamos los productos para el efecto de carrusel infinito
  const carruselProductos = [...productos, ...productos];
  
  productosGrid.innerHTML = carruselProductos.map((p, index) => `
    <article
      class="producto-card fade-up ${p.categoria !== categoriaActiva && categoriaActiva !== 'todos' ? 'oculto' : ''}"
      data-id="${p.id}"
      data-categoria="${p.categoria}"
      role="button"
      tabindex="0"
      aria-label="Ver ${p.nombre}"
    >
      ${p.destacado ? '<span class="badge-destacado">Destacado</span>' : ''}
      <div class="producto-card__img-wrap">
        <img src="${p.img}" alt="${p.nombre}" loading="lazy" />
      </div>
    </article>
  `).join('');

  // Eventos en las cards
  productosGrid.querySelectorAll('[data-action="ver"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirLightbox(Number(btn.dataset.id));
    });
  });

  productosGrid.querySelectorAll('[data-action="cotizar"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModalCotizacion(Number(btn.dataset.id));
    });
  });

  // También click en la card completa abre lightbox
  productosGrid.querySelectorAll('.producto-card').forEach((card) => {
    card.addEventListener('click', () => abrirLightbox(Number(card.dataset.id)));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') abrirLightbox(Number(card.dataset.id));
    });
  });

  observarAnimaciones();
}

/* ══════════════════════════════════════════════════════════════
   FILTROS
══════════════════════════════════════════════════════════════ */

function filtrar(categoria) {
  categoriaActiva = categoria;

  // Actualizar botones
  filtrosContenedor.querySelectorAll('.filtros__btn').forEach((btn) => {
    const activo = btn.dataset.categoria === categoria;
    btn.classList.toggle('activo', activo);
    btn.setAttribute('aria-pressed', activo);
  });

  // Mostrar / ocultar cards con transición suave
  productosGrid.querySelectorAll('.producto-card').forEach((card) => {
    const coincide = categoria === 'todos' || card.dataset.categoria === categoria;
    if (coincide) {
      card.classList.remove('oculto');
      // Reset animación
      card.classList.remove('visible');
      requestAnimationFrame(() => observarAnimaciones());
    } else {
      card.classList.add('oculto');
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════════ */

function abrirLightbox(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;
  productoActivo = producto;

  lbImg.src        = producto.img;
  lbImg.alt        = producto.nombre;
  lbNombre.textContent    = producto.nombre;
  lbCategoria.textContent = capitalizar(producto.categoria);
  lbDesc.textContent      = producto.descripcion;

  lightbox.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function cerrarLightbox() {
  lightbox.classList.remove('abierto');
  document.body.style.overflow = '';
  productoActivo = null;
}

lbClose?.addEventListener('click', cerrarLightbox);

lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) cerrarLightbox();
});

lbBtnCotizar?.addEventListener('click', () => {
  cerrarLightbox();
  if (productoActivo) abrirModalCotizacion(productoActivo.id);
  else abrirModalCotizacion(null);
});

/* ══════════════════════════════════════════════════════════════
   MODAL DE COTIZACIÓN
══════════════════════════════════════════════════════════════ */

function abrirModalCotizacion(id) {
  productoActivo = id ? productos.find((p) => p.id === id) : null;

  if (productoActivo && inputDetalle) {
    inputDetalle.value = `Hola, me interesa cotizar: ${productoActivo.nombre}.`;
  } else if (inputDetalle) {
    inputDetalle.value = '';
  }

  modalCotizacion.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  inputNombre?.focus();
}

function cerrarModalCotizacion() {
  modalCotizacion.classList.remove('abierto');
  document.body.style.overflow = '';
  formCotizacion?.reset();
  productoActivo = null;
}

btnCancelar?.addEventListener('click', cerrarModalCotizacion);

modalCotizacion?.addEventListener('click', (e) => {
  if (e.target === modalCotizacion) cerrarModalCotizacion();
});

document.getElementById('modalClose')?.addEventListener('click', cerrarModalCotizacion);

formCotizacion?.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre  = inputNombre?.value.trim() || '';
  const detalle = inputDetalle?.value.trim() || '';

  if (!nombre || !detalle) return;

  const msg = encodeURIComponent(
    `Hola, soy ${nombre}.\n${detalle}\n\n(Enviado desde la web de Joyería Ruben's)`
  );

  window.open(`https://wa.me/${WHATSAPP_NUM}?text=${msg}`, '_blank', 'noopener,noreferrer');
  cerrarModalCotizacion();
});

/* Botón flotante de cotización en header */
document.getElementById('navCotizar')?.addEventListener('click', (e) => {
  e.preventDefault();
  abrirModalCotizacion(null);
});

/* ══════════════════════════════════════════════════════════════
   MENÚ HAMBURGUESA
══════════════════════════════════════════════════════════════ */

navToggle?.addEventListener('click', () => {
  const abierto = siteNav.classList.toggle('abierto');
  navToggle.classList.toggle('active', abierto);
  navToggle.setAttribute('aria-expanded', abierto);
});

/* Cerrar menú al hacer click en un link */
siteNav?.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    siteNav.classList.remove('abierto');
    navToggle?.classList.remove('active');
  });
});

/* ══════════════════════════════════════════════════════════════
   ANIMACIONES (IntersectionObserver)
══════════════════════════════════════════════════════════════ */

function observarAnimaciones() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-up:not(.visible):not(.oculto)').forEach((el) => {
    observer.observe(el);
  });
}

/* ── ESC cierra modales ────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarLightbox();
    cerrarModalCotizacion();
  }
});

/* ══════════════════════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════════════════════ */

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderProductos();
  observarAnimaciones();
});
