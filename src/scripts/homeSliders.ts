
  interface Juego {
    id: number;
    titulo: string;
    descripcion: string;
    precio: number;
    imagen_url?: string;
    categoria?: string;
    fecha_lanzamiento?: string;
    categoria_id?: number;
  }

  interface Descuento {
    juego_id: number;
    titulo: string;
    descripcion: string;
    precio_original: number;
    precio_con_descuento: number;
    porcentaje: number;
    imagen_url?: string;
    categoria?: string;
  }

  interface WishlistItem {
    wishlist_id: number;
    juego_id: number;
    titulo: string;
    precio: number;
    imagen_url?: string;
  }

  interface Categoria {
    id: number;
    nombre: string;
  }

  interface CarouselState {
    items: string[];
    offset: number;
  }

  const API = "http://localhost:8080";

  const cartIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
  const notifyIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  const heartIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  const trashIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';

  const carouselState: Record<string, CarouselState> = {};

  function getCardWidth(id: string): number {
    const track = document.getElementById(`track-${id}`);
    if (!track) return 0;
    const card = track.querySelector<HTMLElement>("a, div[class*='rounded-xl']");
    if (!card) return 0;
    return card.offsetWidth + 20;
  }

  function applyTranslate(id: string, px: number): void {
    const track = document.getElementById(`track-${id}`);
    if (track) track.style.transform = `translateX(${px}px)`;
  }

  function clampOffset(id: string, offset: number): number {
    const state = carouselState[id];
    const cardW = getCardWidth(id);
    const maxOffset = -Math.max(0, (state.items.length - 4) * cardW);
    return Math.min(0, Math.max(maxOffset, offset));
  }

  function renderTrack(id: string): void {
    const state = carouselState[id];
    if (!state) return;
    const track = document.getElementById(`track-${id}`);
    if (!track) return;
    track.innerHTML = state.items.join("");
    applyTranslate(id, state.offset);
  }

  function prevCarousel(id: string): void {
    const state = carouselState[id];
    if (!state) return;
    const cardW = getCardWidth(id);
    state.offset = clampOffset(id, state.offset + cardW);
    const track = document.getElementById(`track-${id}`);
    if (track) {
      track.classList.remove("dragging");
      track.style.transition = "transform 500ms";
    }
    applyTranslate(id, state.offset);
  }

  function nextCarousel(id: string): void {
    const state = carouselState[id];
    if (!state) return;
    const cardW = getCardWidth(id);
    const newOffset = clampOffset(id, state.offset - cardW);
    if (newOffset === state.offset && state.offset !== 0) {
      state.offset = 0;
    } else {
      state.offset = newOffset;
    }
    const track = document.getElementById(`track-${id}`);
    if (track) {
      track.classList.remove("dragging");
      track.style.transition = "transform 500ms";
    }
    applyTranslate(id, state.offset);
  }

  function autoAdvance(id: string): void {
    setInterval(() => nextCarousel(id), 5000);
  }

  function initDrag(id: string): void {
    const track = document.getElementById(`track-${id}`);
    if (!track) return;
    let startX = 0,
      startOffset = 0,
      isDragging = false;

    track.addEventListener("mousedown", (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      startOffset = carouselState[id].offset;
      track.classList.add("dragging");
      track.style.transition = "none";
    });

    window.addEventListener("mousemove", (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const raw = startOffset + delta;
      carouselState[id].offset = clampOffset(id, raw);
      applyTranslate(id, carouselState[id].offset);
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove("dragging");
      track.style.transition = "transform 500ms";
      const cardW = getCardWidth(id);
      if (cardW > 0) {
        const snapped = Math.round(carouselState[id].offset / cardW) * cardW;
        carouselState[id].offset = clampOffset(id, snapped);
        applyTranslate(id, carouselState[id].offset);
      }
    });

    track.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        startOffset = carouselState[id].offset;
        track.style.transition = "none";
      },
      { passive: true },
    );

    track.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        const delta = e.touches[0].clientX - startX;
        carouselState[id].offset = clampOffset(id, startOffset + delta);
        applyTranslate(id, carouselState[id].offset);
      },
      { passive: true },
    );

    track.addEventListener("touchend", () => {
      track.style.transition = "transform 500ms";
      const cardW = getCardWidth(id);
      if (cardW > 0) {
        const snapped = Math.round(carouselState[id].offset / cardW) * cardW;
        carouselState[id].offset = clampOffset(id, snapped);
        applyTranslate(id, carouselState[id].offset);
      }
    });
  }

  function initCarousel(id: string, html: string[]): void {
    carouselState[id] = { items: html, offset: 0 };
    renderTrack(id);
    initDrag(id);
    autoAdvance(id);
    document
      .getElementById(`btn-prev-${id}`)
      ?.addEventListener("click", () => prevCarousel(id));
    document
      .getElementById(`btn-next-${id}`)
      ?.addEventListener("click", () => nextCarousel(id));
  }

  function showError(trackId: string): void {
    const el = document.getElementById(trackId);
    if (el)
      el.innerHTML =
        '<div class="text-center text-[#71717A] py-20 w-full">No se pudieron cargar los juegos.</div>';
  }

  function cardDestacado(j: Juego): string {
    return `
    <a href="/detail/${j.id}" class="flex flex-col bg-[#1A1A1D] rounded-xl overflow-hidden border border-[#27272A] hover:border-[#A78BFA] transition-all duration-300 group cursor-pointer flex-shrink-0 w-[calc(25%-15px)]">
      <figure class="relative aspect-[3/4] overflow-hidden">
        <img src="${j.imagen_url || "https://placehold.co/300x400/1A1A1D/A78BFA?text=XDG"}"
          alt="Portada de ${j.titulo}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
      </figure>
      <div class="p-4 flex flex-col grow justify-between">
        <div>
          <h3 class="text-white font-bold text-lg truncate">${j.titulo}</h3>
          <p class="text-[#71717A] text-xs mt-1 line-clamp-2">${j.descripcion}</p>
        </div>
        <div class="mt-4 flex justify-between items-center">
          <span class="text-white font-semibold">$${j.precio}</span>
          <button class="bg-[#27272A] text-white p-2 rounded-full hover:bg-[#A78BFA] hover:text-[#09090B] transition-colors">${cartIcon}</button>
        </div>
      </div>
    </a>`;
  }

  function cardDescuento(j: Descuento): string {
    return `
    <a href="/detail/${j.juego_id}" class="flex flex-col bg-[#1A1A1D] rounded-xl overflow-hidden border border-[#27272A] hover:border-[#F472B6] transition-all duration-300 group cursor-pointer flex-shrink-0 w-[calc(25%-15px)]">
      <figure class="relative aspect-[3/4] overflow-hidden">
        <img src="${j.imagen_url || "https://placehold.co/300x400/1A1A1D/F472B6?text=XDG"}"
          alt="Portada de ${j.titulo}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        <span class="absolute top-2 left-2 bg-[#F472B6] text-[#09090B] text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
          -${j.porcentaje}%
        </span>
      </figure>
      <div class="p-4 flex flex-col grow justify-between">
        <div>
          <h3 class="text-white font-bold text-lg truncate">${j.titulo}</h3>
          <p class="text-[#71717A] text-xs mt-1 line-clamp-2">${j.descripcion}</p>
        </div>
        <div class="mt-4 flex justify-between items-center">
          <div class="flex flex-col">
            <span class="text-[#71717A] text-xs line-through">$${j.precio_original}</span>
            <span class="text-[#F472B6] font-semibold">$${j.precio_con_descuento}</span>
          </div>
          <button class="bg-[#27272A] text-white p-2 rounded-full hover:bg-[#F472B6] hover:text-[#09090B] transition-colors">${cartIcon}</button>
        </div>
      </div>
    </a>`;
  }

  function cardProximo(j: Juego): string {
    return `
    <a href="/detail/${j.id}" class="flex flex-col bg-[#1A1A1D] rounded-xl overflow-hidden border border-[#27272A] hover:border-[#34D399] transition-all duration-300 group cursor-pointer flex-shrink-0 w-[calc(25%-15px)]">
      <figure class="relative aspect-[3/4] overflow-hidden">
        <img src="${j.imagen_url || "https://placehold.co/300x400/1A1A1D/34D399?text=XDG"}"
          alt="Portada de ${j.titulo}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"/>
        <span class="absolute top-2 left-2 bg-[#34D399] text-[#09090B] text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded">
          Pronto
        </span>
        <div class="absolute inset-0 bg-gradient-to-t from-[#09090B]/60 to-transparent"></div>
      </figure>
      <div class="p-4 flex flex-col grow justify-between">
        <div>
          <h3 class="text-white font-bold text-lg truncate">${j.titulo}</h3>
          <p class="text-[#71717A] text-xs mt-1 line-clamp-2">${j.descripcion}</p>
        </div>
        <div class="mt-4 flex justify-between items-center">
          <span class="text-[#34D399] font-semibold text-sm">${j.fecha_lanzamiento ?? "Próximamente"}</span>
          <button class="bg-[#27272A] text-white p-2 rounded-full hover:bg-[#34D399] hover:text-[#09090B] transition-colors">${notifyIcon}</button>
        </div>
      </div>
    </a>`;
  }

  function cardWishlist(j: WishlistItem): string {
    return `
    <div class="flex flex-col bg-[#1A1A1D] rounded-xl overflow-hidden border border-[#27272A] hover:border-[#F472B6] transition-all duration-300 group flex-shrink-0 w-[calc(25%-15px)]">
      <a href="/detail/${j.juego_id}" class="block">
        <figure class="relative aspect-[3/4] overflow-hidden">
          <img src="${j.imagen_url || "https://placehold.co/300x400/1A1A1D/F472B6?text=XDG"}"
            alt="Portada de ${j.titulo}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          <span class="absolute top-2 left-2 bg-[#F472B6]/20 border border-[#F472B6]/40 text-[#F472B6] text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1">
            ${heartIcon} Guardado
          </span>
        </figure>
      </a>
      <div class="p-4 flex flex-col grow justify-between">
        <div>
          <h3 class="text-white font-bold text-lg truncate">${j.titulo}</h3>
          <span class="text-[#F472B6] font-semibold text-sm">$${j.precio}</span>
        </div>
        <div class="mt-4 flex justify-between items-center gap-2">
          <button
            onclick="addToCart(${j.juego_id})"
            class="flex-1 bg-[#A78BFA] text-[#09090B] text-xs font-semibold py-2 rounded-full hover:bg-[#c4b5fd] transition-colors flex items-center justify-center gap-1">
            ${cartIcon} Agregar
          </button>
          <button
            onclick="removeFromWishlist(${j.wishlist_id})"
            class="bg-[#27272A] text-[#71717A] p-2 rounded-full hover:bg-red-900/40 hover:text-red-400 transition-colors"
            title="Quitar de la lista">
            ${trashIcon}
          </button>
        </div>
      </div>
    </div>`;
  }

  function cardGrid(
    j: Juego,
    descuentoMap: Map<number, Descuento>,
    hoy: Date,
  ): string {
    const descuento = descuentoMap.get(j.id);
    const esProximo = !!(j.fecha_lanzamiento && new Date(j.fecha_lanzamiento) > hoy);

    let badge = "";
    let hoverBorder = "hover:border-[#A78BFA]";
    let precioHtml = `<span class="text-white font-semibold">$${j.precio}</span>`;
    let btnHover = "hover:bg-[#A78BFA] hover:text-[#09090B]";
    let actionBtn = `<button class="bg-[#27272A] text-white p-2 rounded-full ${btnHover} transition-colors">${cartIcon}</button>`;

    if (esProximo) {
      badge = `<span class="absolute top-2 left-2 bg-[#34D399] text-[#09090B] text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded">Pronto</span>
               <div class="absolute inset-0 bg-gradient-to-t from-[#09090B]/60 to-transparent"></div>`;
      hoverBorder = "hover:border-[#34D399]";
      precioHtml = `<span class="text-[#34D399] font-semibold text-sm">${j.fecha_lanzamiento ?? "Próximamente"}</span>`;
      btnHover = "hover:bg-[#34D399] hover:text-[#09090B]";
      actionBtn = `<button class="bg-[#27272A] text-white p-2 rounded-full ${btnHover} transition-colors">${notifyIcon}</button>`;
    } else if (descuento) {
      badge = `<span class="absolute top-2 left-2 bg-[#F472B6] text-[#09090B] text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">-${descuento.porcentaje}%</span>`;
      hoverBorder = "hover:border-[#F472B6]";
      precioHtml = `
        <div class="flex flex-col">
          <span class="text-[#71717A] text-xs line-through">$${descuento.precio_original}</span>
          <span class="text-[#F472B6] font-semibold">$${descuento.precio_con_descuento}</span>
        </div>`;
      btnHover = "hover:bg-[#F472B6] hover:text-[#09090B]";
      actionBtn = `<button class="bg-[#27272A] text-white p-2 rounded-full ${btnHover} transition-colors">${cartIcon}</button>`;
    }

    return `
    <a href="/detail/${j.id}" class="flex flex-col bg-[#1A1A1D] rounded-xl overflow-hidden border border-[#27272A] ${hoverBorder} transition-all duration-300 group cursor-pointer">
      <figure class="relative aspect-[3/4] overflow-hidden">
        <img src="${j.imagen_url || "https://placehold.co/300x400/1A1A1D/A78BFA?text=XDG"}"
          alt="Portada de ${j.titulo}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500${esProximo ? " opacity-70" : ""}"/>
        ${badge}
      </figure>
      <div class="p-4 flex flex-col grow justify-between">
        <div>
          <h3 class="text-white font-bold text-lg truncate">${j.titulo}</h3>
          <p class="text-[#71717A] text-xs mt-1 line-clamp-2">${j.descripcion}</p>
        </div>
        <div class="mt-4 flex justify-between items-center">
          ${precioHtml}
          ${actionBtn}
        </div>
      </div>
    </a>`;
  }

  let todosJuegos: Juego[] = [];
  let todosDescuentos: Descuento[] = [];
  let descuentoMap: Map<number, Descuento> = new Map();

async function loadDestacados(): Promise<void> {
  try {
      todosJuegos = (await (window as any).xdgStore.getJuegos()) as Juego[];

    const hoy = new Date();
    const disponibles = todosJuegos.filter(
      j => !j.fecha_lanzamiento || new Date(j.fecha_lanzamiento) <= hoy
    );

    initCarousel("destacados", disponibles.map(cardDestacado));
  } catch {
    showError("track-destacados");
  }
}

  async function loadDescuentos(): Promise<void> {
    try {
      todosDescuentos = (await (window as any).xdgStore.getDescuentos()) as Descuento[];
      descuentoMap = new Map(todosDescuentos.map((d) => [d.juego_id, d]));
      initCarousel("descuentos", todosDescuentos.map(cardDescuento));
    } catch {
      showError("track-descuentos");
    }
  }

  async function loadProximamente(filtro: string = ""): Promise<void> {
    const hoy = new Date();
    let proximos = todosJuegos.filter(
      (j: Juego) => j.fecha_lanzamiento && new Date(j.fecha_lanzamiento) > hoy,
    );
    if (filtro)
      proximos = proximos.filter(
        (j: Juego) => (j.categoria ?? "").toLowerCase() === filtro,
      );
    const track = document.getElementById("track-proximamente");
    if (proximos.length) {
      if (!carouselState["proximamente"]) {
        initCarousel("proximamente", proximos.map(cardProximo));
      } else {
        carouselState["proximamente"].items = proximos.map(cardProximo);
        carouselState["proximamente"].offset = 0;
        renderTrack("proximamente");
      }
    } else {
      if (track)
        track.innerHTML = `<div class="text-center text-[#71717A] py-20 w-full">No hay lanzamientos próximos${filtro ? " en esta categoría" : ""}.</div>`;
    }
  }

  window.addEventListener("filtrar-categoria", async (e: Event) => {
    const { categoriaId } = (e as CustomEvent<{ categoriaId: string }>).detail;
    const sectionesEl = document.getElementById("home-sections");

    if (!categoriaId) {
      if (sectionesEl) sectionesEl.style.display = "";
      document.getElementById("grid-categoria")?.remove();
      return;
    }

    if (!todosJuegos || todosJuegos.length === 0) {
      console.warn("Juegos aún no cargados");
      return;
    }

    const hoy = new Date();
    const res = await fetch(`${API}/api/juegos_por_categoria.jsp?categoria_id=${categoriaId}`, { cache: 'no-store' });
    const juegos = await res.json();

    const juegosVisibles: Juego[] = juegos.filter(
      (j: Juego) => !j.fecha_lanzamiento || new Date(j.fecha_lanzamiento) <= hoy,
    );

    if (sectionesEl) sectionesEl.style.display = "none";

    let grid = document.getElementById("grid-categoria");

    if (!grid) {
      grid = document.createElement("div");
      grid.id = "grid-categoria";
      grid.className = "font-space w-full px-4 max-w-360 mx-auto";
      sectionesEl?.insertAdjacentElement("afterend", grid);
    }

    if (juegosVisibles.length === 0) {
      grid.innerHTML = `
      <div class="text-center text-[#71717A] py-20">
        No hay juegos en esta categoría.
      </div>`;
      return;
    }

    grid.innerHTML = `
      <div class="grid grid-cols-4 gap-5 py-12">
        ${juegosVisibles.map((j) => cardGrid(j, descuentoMap, hoy)).join("")}
      </div>`;
  });

  async function loadWishlist(): Promise<void> {
    let userId: number | null = null;
    try {
      const session = await (window as any).xdgStore.sessionPromise;
userId = session?.id ?? null;
    } catch {}

    const loadingEl = document.getElementById("wishlist-loading");
    const noAuthEl = document.getElementById("wishlist-no-auth");
    const emptyEl = document.getElementById("wishlist-empty");
    const carouselEl = document.getElementById("wishlist-carousel");

    if (!userId) {
      loadingEl?.classList.add("hidden");
      noAuthEl?.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(`${API}/api/wishlist.jsp?user_id=${userId}`, {
        credentials: "include",
      });
      const items = (await res.json()) as WishlistItem[];

      loadingEl?.classList.add("hidden");

      if (!items || items.length === 0) {
        emptyEl?.classList.remove("hidden");
        return;
      }

      carouselEl?.classList.remove("hidden");
      const id = "wishlist-main";
      carouselState[id] = { items: items.map(cardWishlist), offset: 0 };
      const track = document.getElementById(`track-${id}`);
      if (track) track.innerHTML = carouselState[id].items.join("");
      initDrag(id);
      document
        .getElementById("btn-prev-wishlist-main")
        ?.addEventListener("click", () => prevCarousel(id));
      document
        .getElementById("btn-next-wishlist-main")
        ?.addEventListener("click", () => nextCarousel(id));
    } catch {
      loadingEl?.classList.add("hidden");
      emptyEl?.classList.remove("hidden");
    }
  }

  async function removeFromWishlist(wishlistId: number): Promise<void> {
    try {
      await fetch(`${API}/api/wishlist.jsp`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wishlistId }),
      });
      loadWishlist();
    } catch (e) {
      console.error(e);
    }
  }

async function addToCart(juegoId: number): Promise<void> {
  try {
    const sessionRes = await fetch($API/api/session.jsp, { credentials: "include" });
    const session = await sessionRes.json();
    if (!session.id) return;

    await fetch($API/api/carrito.jsp, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ juego_id: juegoId, user_id: session.id }),
    });
  } catch (e) {
    console.error(e);
  }
}

  async function preloadAndShow() {
    // Iniciar peticiones en paralelo para que no se bloqueen unas a otras
    const p1 = (window as any).xdgStore.getJuegos();
    const p2 = (window as any).xdgStore.getDescuentos();
    const p3 = loadWishlist();

    // Esperamos a que los datos base lleguen
    await Promise.all([p1, p2]);

    // Renderizamos los sliders que dependían de los juegos
    await Promise.all([
      loadDestacados(),
      loadDescuentos()
    ]);

    // loadProximamente necesita todosJuegos que se llena en loadDestacados
    loadProximamente();

    // Extraemos las imágenes que van a ser visibles inicialmente (primeras 4 de cada slider)
    const tracks = ["track-destacados", "track-descuentos", "track-proximamente", "wishlist-carousel"];
    const urls: string[] = [];
    for (const trackId of tracks) {
      const el = document.getElementById(trackId);
      if (el) {
        const imgs = el.querySelectorAll('img');
        for (let i = 0; i < Math.min(imgs.length, 4); i++) {
          if (imgs[i].src) urls.push(imgs[i].src);
        }
      }
    }

    // Pre-cargamos en memoria las imágenes para evitar parpadeos
    if (urls.length > 0) {
      await Promise.all(urls.map(url => new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      })));
    }

    // Finalmente mostramos todo de golpe (parejo)
    const sections = document.getElementById("home-sections");
    if (sections) {
      sections.classList.remove("opacity-0");
      sections.classList.add("opacity-100");
    }
  }

  preloadAndShow();

export {};
