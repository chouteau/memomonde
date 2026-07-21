/**
 * MemoMonde - Contrôleur de la Carte Mondiale SVG (Pan/Zoom, Surbrillance, Tooltips & Interactivité)
 */

const MapController = {
    svg: null,
    gContainer: null,
    tooltip: null,

    // Pan/Zoom state
    viewBox: { x: 0, y: 0, w: 1000, h: 500 },
    isDragging: false,
    startPoint: { x: 0, y: 0 },
    scale: 1,
    minScale: 0.5,
    maxScale: 6,

    // Callbacks
    countryClickCallback: null,
    antiCheat: false,

    init(svgElementId, tooltipElementId) {
        this.svg = document.getElementById(svgElementId);
        this.tooltip = document.getElementById(tooltipElementId);
        if (!this.svg) return;

        // Render countries into SVG
        this.renderMap();
        this.setupPanZoom();
        this.setupTooltips();
    },

    renderMap() {
        this.svg.innerHTML = '';
        
        // Background ocean
        const ocean = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        ocean.setAttribute("width", "100%");
        ocean.setAttribute("height", "100%");
        ocean.setAttribute("fill", "var(--map-ocean-bg)");
        this.svg.appendChild(ocean);

        // Group container for zoom/pan
        this.gContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.gContainer.setAttribute("id", "world-map-group");

        const countries = CountryDB.getAll();
        countries.forEach(country => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", country.path);
            path.setAttribute("id", `country-${country.id}`);
            path.setAttribute("data-code", country.id);
            path.setAttribute("data-name", country.name);
            path.setAttribute("class", "country-path");
            
            // Click handler
            path.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.countryClickCallback) {
                    this.countryClickCallback(country);
                }
            });

            this.gContainer.appendChild(path);
        });

        this.svg.appendChild(this.gContainer);
        this.updateViewBox();
    },

    setupPanZoom() {
        // Mouse wheel zoom
        this.svg.addEventListener("wheel", (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
            this.zoom(zoomFactor, e.clientX, e.clientY);
        }, { passive: false });

        // Mouse drag pan
        this.svg.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return; // Left click only
            this.isDragging = true;
            this.startPoint = { x: e.clientX, y: e.clientY };
            this.svg.style.cursor = "grabbing";
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return;
            const dx = (e.clientX - this.startPoint.x) * (this.viewBox.w / this.svg.clientWidth);
            const dy = (e.clientY - this.startPoint.y) * (this.viewBox.h / this.svg.clientHeight);

            this.viewBox.x -= dx;
            this.viewBox.y -= dy;
            this.startPoint = { x: e.clientX, y: e.clientY };
            this.updateViewBox();
        });

        window.addEventListener("mouseup", () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.svg.style.cursor = "grab";
            }
        });
    },

    zoom(factor, cursorX = null, cursorY = null) {
        const newW = this.viewBox.w * factor;
        const newH = this.viewBox.h * factor;

        // Scale bounds
        if (newW > 1000 / this.minScale || newW < 1000 / this.maxScale) return;

        if (cursorX !== null && cursorY !== null) {
            const rect = this.svg.getBoundingClientRect();
            const mouseXRatio = (cursorX - rect.left) / rect.width;
            const mouseYRatio = (cursorY - rect.top) / rect.height;

            this.viewBox.x += (this.viewBox.w - newW) * mouseXRatio;
            this.viewBox.y += (this.viewBox.h - newH) * mouseYRatio;
        } else {
            // Zoom to center
            this.viewBox.x += (this.viewBox.w - newW) / 2;
            this.viewBox.y += (this.viewBox.h - newH) / 2;
        }

        this.viewBox.w = newW;
        this.viewBox.h = newH;
        this.updateViewBox();
    },

    resetZoom() {
        this.viewBox = { x: 0, y: 0, w: 1000, h: 500 };
        this.updateViewBox();
    },

    updateViewBox() {
        this.svg.setAttribute("viewBox", `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
    },

    setupTooltips() {
        if (!this.tooltip) return;

        this.svg.addEventListener("mousemove", (e) => {
            if (this.antiCheat) {
                this.hideTooltip();
                return;
            }

            const target = e.target;
            if (target && target.classList.contains("country-path")) {
                const countryId = target.getAttribute("data-code");
                const country = CountryDB.getById(countryId);
                if (country) {
                    this.tooltip.innerHTML = `<strong>${country.flag} ${country.name}</strong><br><small>Capitale: ${country.capital}</small>`;
                    this.tooltip.style.left = `${e.pageX + 12}px`;
                    this.tooltip.style.top = `${e.pageY + 12}px`;
                    this.tooltip.classList.add("visible");
                }
            } else {
                this.hideTooltip();
            }
        });

        this.svg.addEventListener("mouseleave", () => {
            this.hideTooltip();
        });
    },

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove("visible");
        }
    },

    setAntiCheat(enabled) {
        this.antiCheat = enabled;
        if (enabled) {
            this.hideTooltip();
        }
    },

    highlightCountry(countryId, statusClass = "target") {
        const path = document.getElementById(`country-${countryId}`);
        if (path) {
            path.classList.add(statusClass);
        }
    },

    clearHighlights() {
        const paths = this.svg.querySelectorAll(".country-path");
        paths.forEach(p => {
            p.classList.remove("target", "correct", "wrong", "selected");
        });
    },

    focusOnCountry(countryId) {
        const country = CountryDB.getById(countryId);
        if (!country) return;

        const path = document.getElementById(`country-${countryId}`);
        if (!path) return;

        try {
            const bbox = path.getBBox();
            const padding = 80;
            const w = Math.max(bbox.width + padding * 2, 250);
            const h = Math.max(bbox.height + padding * 2, 150);
            const x = bbox.x + bbox.width / 2 - w / 2;
            const y = bbox.y + bbox.height / 2 - h / 2;

            this.viewBox = { x, y, w, h };
            this.updateViewBox();
        } catch (e) {
            // Fallback if BBox is unavailable
            this.resetZoom();
        }
    },

    onCountryClick(callback) {
        this.countryClickCallback = callback;
    }
};
