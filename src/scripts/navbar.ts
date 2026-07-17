const API = "http://localhost:8080";

(window as any).xdgStore = {
    juegosPromise: null,
    descuentosPromise: null,
    sessionPromise: fetch(`${API}/api/session.jsp`, { credentials: "include" }).then(r => r.json()),
    getJuegos: function() {
        if (!this.juegosPromise) {
            this.juegosPromise = fetch(`${API}/api/juegos.jsp`, { credentials: "include", cache: "no-store" }).then(r => r.json());
        }
        return this.juegosPromise;
    },
    getDescuentos: function() {
        if (!this.descuentosPromise) {
            this.descuentosPromise = fetch(`${API}/api/descuentos.jsp`, { credentials: "include", cache: "no-store" }).then(r => r.json());
        }
        return this.descuentosPromise;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("openModal") as HTMLButtonElement;
    const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
    const navUserName = document.getElementById("nav-user-name") as HTMLSpanElement;
    const navUserRole = document.getElementById("nav-user-role") as HTMLSpanElement;

    function updateNavUI(name: string, role: string, subRole?: string) {
        const displayRole = subRole && subRole !== "null" ? subRole : role;
        if (navUserName) navUserName.textContent = `Hola, ${name}`;
        if (navUserRole) {
            if (!displayRole || displayRole.toLowerCase() === "user" || displayRole.toUpperCase() === "CLIENTE") {
                navUserRole.classList.add("hidden");
            } else {
                navUserRole.textContent = displayRole.toUpperCase();
                navUserRole.classList.remove("hidden");
            }
        }
        if (btn) {
            btn.dataset.logged = "true";
            btn.classList.remove("hover:border-[#A78BFA]");
        }
        if (logoutBtn) logoutBtn.classList.remove("hidden");
    }

    btn?.addEventListener("click", () => {
        if (btn.dataset.logged === "true") {
            window.location.href = "/profile";
        } else {
            window.dispatchEvent(new CustomEvent("open-login-modal"));
        }
    });

    window.addEventListener("user-logged-in", (e: any) => {
        const userName = e.detail?.role === "admin" ? "Admin" : e.detail?.nombre || "Usuario";
        updateNavUI(userName, e.detail?.role, e.detail?.sub_role);
    });

    window.addEventListener("profile-updated", (e: any) => {
        if (e.detail?.nombre && navUserName) {
            navUserName.textContent = `Hola, ${e.detail.nombre}`;
        }
    });

    logoutBtn?.addEventListener("click", async () => {
        await fetch(`${API}/api/auth.jsp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action: "logout" }),
        });
        if (currentUserId) sessionStorage.removeItem("xdg_discounts_checked_" + currentUserId);
        if (navUserName) navUserName.textContent = "Iniciar sesión";
        if (navUserRole) navUserRole.classList.add("hidden");
        if (logoutBtn) logoutBtn.classList.add("hidden");

        currentUserId = "";
        const notifList = document.getElementById("notif-list");
        const notifDot = document.getElementById("notif-dot");
        if (notifList) notifList.innerHTML = `<div class="p-4 text-center text-xs text-zinc-500">Inicia sesión para ver tus notificaciones.</div>`;
        if (notifDot) notifDot.classList.add("hidden");

        window.dispatchEvent(new CustomEvent("user-logged-out"));
        
        if (window.location.pathname.startsWith("/profile")) {
            window.location.href = "/";
        }
    });

    let checkSession = async () => {
        try {
            const data = await (window as any).xdgStore.sessionPromise;
            if (data.logged) {
                updateNavUI(data.name, data.role, data.sub_role);
            }
        } catch (err) { console.error("Error al verificar sesión:", err); }
    };
    checkSession();

    const searchInput = document.getElementById("search-input") as HTMLInputElement;
    const searchDropdown = document.getElementById("search-dropdown") as HTMLDivElement;
    const searchClear = document.getElementById("search-clear") as HTMLButtonElement;
    const searchWrapper = document.getElementById("search-wrapper") as HTMLDivElement;

    interface Juego {
        id: number;
        titulo: string;
        descripcion: string;
        precio: number;
        imagen_url?: string;
        categoria?: string;
        fecha_lanzamiento?: string;
    }
    interface Descuento {
        juego_id: number;
        precio_con_descuento: number;
        porcentaje: number;
    }

    let allGames: Juego[] = [];
    let discountMap: Map<number, Descuento> = new Map();
    let dataLoaded = false;
    let debounceTimer: ReturnType<typeof setTimeout>;

    async function ensureData() {
        if (dataLoaded) return;
        dataLoaded = true;
        try {
            const [gData, dData] = await Promise.all([
                (window as any).xdgStore.getJuegos(),
                (window as any).xdgStore.getDescuentos()
            ]);
            allGames = gData as Juego[];
            discountMap = new Map((dData as Descuento[]).map(d => [d.juego_id, d]));
        } catch {}
    }

    function renderResults(query: string) {
        if (!searchDropdown) return;
        const q = query.trim().toLowerCase();

        if (!q) {
            closeDropdown();
            return;
        }

        const matches = allGames.filter(g =>
            g.titulo.toLowerCase().includes(q) ||
            (g.categoria ?? "").toLowerCase().includes(q) ||
            (g.descripcion ?? "").toLowerCase().includes(q)
        ).filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i).slice(0, 8);

        searchDropdown.classList.remove("hidden");

        if (!matches.length) {
            searchDropdown.innerHTML = `<div id="search-empty">No se encontraron resultados para "<strong style="color:#fff">${query}</strong>"</div>`;
            return;
        }

        const html = matches.map(g => {
            const disc = discountMap.get(g.id);
            const priceHtml = disc
                ? `<span class="search-item-price discounted">S/ ${disc.precio_con_descuento} <span style="text-decoration:line-through;color:#52525B;font-size:10px">S/ ${g.precio}</span></span>`
                : `<span class="search-item-price">$${g.precio}</span>`;
            const img = g.imagen_url || `https://placehold.co/36x48/1A1A1D/A78BFA?text=XDG`;
            const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const title = g.titulo.replace(re, '<mark style="background:transparent;color:#A78BFA;font-weight:700">$1</mark>');

            return `<a href="/detail/${g.id}" class="search-item"><img src="${img}" width="36" height="48" style="width:36px!important;min-width:36px!important;max-width:36px!important;height:48px!important;object-fit:cover;border-radius:5px;flex-shrink:0;display:block" /><div class="search-item-info"><span class="search-item-title">${title}</span><span class="search-item-meta">${g.categoria ?? ''}</span></div>${priceHtml}</a>`;
        }).join("");

        searchDropdown.innerHTML = `
            <div class="search-section-label">${matches.length} resultado${matches.length !== 1 ? 's' : ''}</div>
            ${html}`;
    }

    function closeDropdown() {
        if (searchDropdown) {
            searchDropdown.classList.add("hidden");
            searchDropdown.innerHTML = "";
        }
    }

    if (searchInput) {
        searchInput.addEventListener("focus", ensureData);
        searchInput.addEventListener("input", () => {
            const val = searchInput.value;
            if (searchClear) searchClear.classList.toggle("hidden", !val);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => renderResults(val), 180);
        });
        searchInput.addEventListener("keydown", (e: KeyboardEvent) => {
            if (!searchDropdown) return;
            const items = searchDropdown.querySelectorAll<HTMLAnchorElement>(".search-item");
            if (!items.length) return;
            const active = searchDropdown.querySelector<HTMLAnchorElement>(".search-item:focus");
            if (e.key === "ArrowDown") {
                e.preventDefault();
                (active ? (active.nextElementSibling as HTMLAnchorElement) : items[0])?.focus();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (active) (active.previousElementSibling as HTMLAnchorElement)?.focus() ?? searchInput.focus();
            } else if (e.key === "Escape") {
                closeDropdown();
                searchInput.blur();
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                searchInput.focus();
            }
            searchClear.classList.add("hidden");
            closeDropdown();
        });
    }

    document.addEventListener("click", (e) => {
        if (searchWrapper && !searchWrapper.contains(e.target as Node)) closeDropdown();
    });

    const nav = document.getElementById("main-nav");
    if (nav && nav.dataset.transparent === "true") {
        const onScroll = () => {
            if (window.scrollY > 60) {
                nav.style.background = "rgba(9,9,11,0.97)";
                nav.style.borderColor = "rgba(39,39,42,0.6)";
                nav.style.backdropFilter = "blur(12px)";
            } else {
                nav.style.background = "transparent";
                nav.style.borderColor = "transparent";
                nav.style.backdropFilter = "none";
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
    }


    interface XDGNotification {
        id: string;
        message: string;
        date: number;
        read: boolean;
        type?: string;
    }

    const notifBtn = document.getElementById("notif-btn");
    const notifDot = document.getElementById("notif-dot");
    const notifDropdown = document.getElementById("notif-dropdown");
    const notifList = document.getElementById("notif-list");

    let currentUserId = "";

    function getNotifications(): XDGNotification[] {
        if (!currentUserId) return [];
        try {
            return JSON.parse(localStorage.getItem("xdg_notifs_" + currentUserId) || "[]");
        } catch { return []; }
    }

    function saveNotifications(notifs: XDGNotification[]) {
        if (!currentUserId) return;
        localStorage.setItem("xdg_notifs_" + currentUserId, JSON.stringify(notifs.slice(0, 50))); // max 50
        renderNotifications();
    }

    function renderNotifications() {
        if (!notifList || !notifDot) return;
        const notifs = getNotifications();
        const unread = notifs.filter(n => !n.read).length;

        if (unread > 0) notifDot.classList.remove("hidden");
        else notifDot.classList.add("hidden");

        if (notifs.length === 0) {
            notifList.innerHTML = `<div class="p-4 text-center text-xs text-zinc-500">No hay notificaciones nuevas.</div>`;
        } else {
            notifList.innerHTML = notifs.map(n => {
                const dateStr = new Date(n.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                return `
                <div class="px-4 py-3 border-b border-zinc-800/50 hover:bg-white/5 transition-colors cursor-default">
                    <p class="text-sm ${!n.read ? 'text-white font-semibold' : 'text-zinc-400'}">${n.message}</p>
                    <span class="text-[10px] text-zinc-500 mt-1 block">${dateStr}</span>
                </div>`;
            }).join("");
        }
    }

    function markAllAsRead() {
        const notifs = getNotifications();
        let changed = false;
        notifs.forEach(n => {
            if (!n.read) { n.read = true; changed = true; }
        });
        if (changed) saveNotifications(notifs);
    }

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            notifDropdown.classList.toggle("hidden");
            if (!notifDropdown.classList.contains("hidden")) {
                markAllAsRead();
            }
        });
        document.addEventListener("click", (e) => {
            if (!notifBtn.contains(e.target as Node) && !notifDropdown.contains(e.target as Node)) {
                notifDropdown.classList.add("hidden");
            }
        });

        const clearBtn = document.getElementById("clear-notifs-btn");
        if (clearBtn) {
            clearBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                saveNotifications([]); 
            });
        }
    }

    window.addEventListener("add-notification", ((e: CustomEvent) => {
        if (!e.detail?.message || !currentUserId) return;
        const notifs = getNotifications();
        notifs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            message: e.detail.message,
            date: Date.now(),
            read: false,
            type: e.detail.type || "general"
        });
        saveNotifications(notifs);

        if (e.detail.type === 'cart' || e.detail.type === 'purchase') {
            const cartDot = document.getElementById("nav-cart-dot");
            if (cartDot) {
                if (e.detail.type === 'cart') cartDot.classList.remove("hidden");
                if (e.detail.type === 'purchase') cartDot.classList.add("hidden");
            }
        }
    }) as EventListener);

    async function checkDiscountsForNotifications() {
        if (!currentUserId) return;
        try {
            const discs = await (window as any).xdgStore.getDescuentos();
            if (Array.isArray(discs)) {
                const notifs = getNotifications();
                let changed = false;
                
                discs.forEach(d => {
                    if (d.porcentaje >= 20) {
                        const msg = `Oferta activada: Descuento del ${Math.round(d.porcentaje)}% en ${d.titulo || 'un juego top'}.`;
                        if (!notifs.some(n => n.message === msg)) {
                            notifs.unshift({ id: Math.random().toString(), message: msg, date: Date.now(), read: false, type: 'discount' });
                            changed = true;
                        }
                    }
                });
                if (changed) saveNotifications(notifs);
            }
        } catch (err) {}
    }

    const originalCheckSession = checkSession;
    checkSession = async () => {
        try {
            const data = await (window as any).xdgStore.sessionPromise;
            if (data.logged) {
                currentUserId = data.id;
                updateNavUI(data.name, data.role, data.sub_role);
                renderNotifications();

                const discountFlagKey = "xdg_discounts_checked_" + currentUserId;
                if (!sessionStorage.getItem(discountFlagKey)) {
                    sessionStorage.setItem(discountFlagKey, "1");
                    checkDiscountsForNotifications();
                }

                // Check new gifts for notifications
                try {
                    const gifts = await fetch(`${API}/api/regalos_nuevos.jsp?user_id=${data.id}`, { credentials: "include" }).then(r => r.json());
                    if (Array.isArray(gifts)) {
                        gifts.forEach((g: any) => {
                            const msg = `El usuario ${g.comprador_usuario || g.comprador_nombre} te regaló el juego ${g.juego_titulo}`;
                            window.dispatchEvent(new CustomEvent("add-notification", { detail: { message: msg, type: 'gift' } }));
                        });
                    }
                } catch (e) {
                    console.error("Error checking gifts:", e);
                }

                // Check cart indicator
                try {
                    const cart = await fetch(`${API}/api/carrito.jsp?user_id=${data.id}`, { credentials: "include" }).then(r => r.json());
                    const cartDot = document.getElementById("nav-cart-dot");
                    if (cartDot) {
                        if (cart.length > 0 && !cart.error) cartDot.classList.remove("hidden");
                        else cartDot.classList.add("hidden");
                    }
                } catch(e){}
            }
        } catch (err) { console.error("Error al verificar sesión:", err); }
    };

    window.addEventListener("user-logged-in", async () => {
        await checkSession();
    });

    checkSession();
});
