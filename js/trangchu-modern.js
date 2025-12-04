// ==================== HOMEPAGE MODULE ====================
// Modern ES6+ HomePage Controller

class HomePageController {
    constructor() {
        this.itemsPerPage = 12;
        this.currentPage = 1;
        this.filteredProducts = [];
        this.allProducts = [];
        this.initialize();
    }

    initialize() {
        if (!app) {
            console.error('App module not initialized');
            return;
        }

        this.allProducts = app.products || [];
        this.setupBanner();
        this.setupFilters();
        this.setupSearch();
        this.loadProductsFromURL();
        this.render();
    }

    setupBanner() {
        const banners = [
            'img/banners/banner0.gif',
            'img/banners/banner1.png',
            'img/banners/banner2.png',
            'img/banners/banner3.png',
            'img/banners/banner4.png',
            'img/banners/banner5.png',
            'img/banners/banner6.png',
            'img/banners/banner7.png',
            'img/banners/banner8.png',
            'img/banners/banner9.png'
        ];

        const carouselWrapper = document.querySelector('.carousel-banner');
        if (carouselWrapper) {
            banners.forEach(banner => {
                const div = document.createElement('div');
                div.className = 'carousel-item';
                div.innerHTML = `<img src="${banner}" alt="Banner" loading="lazy">`;
                carouselWrapper.appendChild(div);
            });

            // Initialize Owl Carousel
            if (window.$) {
                window.$('.carousel-banner').owlCarousel({
                    items: 1.5,
                    margin: 100,
                    center: true,
                    loop: true,
                    smartSpeed: 450,
                    autoplay: true,
                    autoplayTimeout: 3500,
                    responsive: {
                        0: { items: 1 },
                        768: { items: 1.5 }
                    }
                });
            }
        }
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterClick(e));
        });

        // Clear all filters
        document.querySelector('[data-clear-all]')?.addEventListener('click', () => {
            this.clearAllFilters();
        });
    }

    handleFilterClick(event) {
        const filterType = event.currentTarget.dataset.filter;
        const filterMenu = this.createFilterMenu(filterType);
        
        // Toggle filter menu
        const existing = document.querySelector('.filter-menu');
        if (existing) existing.remove();
        
        if (filterMenu) {
            event.currentTarget.parentElement.appendChild(filterMenu);
        }
    }

    createFilterMenu(type) {
        const menu = document.createElement('div');
        menu.className = 'filter-menu dropdown-content';

        const options = this.getFilterOptions(type);
        
        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'filter-option';
            label.innerHTML = `
                <input type="checkbox" data-filter-value="${option.value}" onchange="homepage?.applyFilter('${type}', this)">
                <span>${option.label}</span>
            `;
            menu.appendChild(label);
        });

        return menu;
    }

    getFilterOptions(type) {
        const companies = [...new Set(this.allProducts.map(p => p.company))];
        const prices = [
            { value: '0-2000000', label: 'Dưới 2 triệu' },
            { value: '2000000-4000000', label: '2-4 triệu' },
            { value: '4000000-7000000', label: '4-7 triệu' },
            { value: '7000000-13000000', label: '7-13 triệu' },
            { value: '13000000-0', label: 'Trên 13 triệu' }
        ];
        const promos = [
            { value: 'giamgia', label: 'Giảm giá' },
            { value: 'tragop', label: 'Trả góp' },
            { value: 'moiramat', label: 'Mới ra mắt' },
            { value: 'giareonline', label: 'Giá rẻ online' }
        ];
        const ratings = [
            { value: '5', label: '5 sao' },
            { value: '4', label: '4 sao trở lên' },
            { value: '3', label: '3 sao trở lên' }
        ];
        const sorts = [
            { value: 'priceAsc', label: 'Giá tăng dần' },
            { value: 'priceDesc', label: 'Giá giảm dần' },
            { value: 'nameAsc', label: 'Tên A-Z' },
            { value: 'nameDesc', label: 'Tên Z-A' },
            { value: 'ratingDesc', label: 'Đánh giá cao nhất' },
            { value: 'newest', label: 'Mới nhất' }
        ];

        const optionsMap = {
            company: companies.map(c => ({ value: c, label: c })),
            price: prices,
            promo: promos,
            rating: ratings,
            sort: sorts
        };

        return optionsMap[type] || [];
    }

    applyFilter(type, element) {
        const criteria = {};
        
        // Gather all active filters
        document.querySelectorAll('[data-filter-value]:checked').forEach(checkbox => {
            const filterType = checkbox.dataset.filterType || type;
            const value = checkbox.dataset.filterValue;
            criteria[filterType] = value;
        });

        this.filterProducts(criteria);
        this.updateActiveFilters(criteria);
        this.currentPage = 1;
        this.render();
    }

    filterProducts(criteria) {
        let filtered = [...this.allProducts];

        // Apply each filter type
        Object.keys(criteria).forEach(key => {
            const value = criteria[key];
            
            switch(key) {
                case 'company':
                    filtered = filtered.filter(p => p.company === value);
                    break;
                case 'price':
                    const [min, max] = value.split('-').map(Number);
                    filtered = filtered.filter(p => {
                        const price = app.stringToNumber(p.price);
                        return price >= min && (max === 0 || price <= max);
                    });
                    break;
                case 'promo':
                    filtered = filtered.filter(p => p.promo?.name === value);
                    break;
                case 'rating':
                    const rating = Number(value);
                    filtered = filtered.filter(p => p.star >= rating);
                    break;
                case 'sort':
                    filtered = app.sortProducts(filtered, value);
                    break;
            }
        });

        this.filteredProducts = filtered;
    }

    clearAllFilters() {
        this.filteredProducts = [...this.allProducts];
        this.currentPage = 1;
        document.querySelectorAll('[data-filter-value]:checked').forEach(cb => cb.checked = false);
        document.querySelector('[data-active-filters]').innerHTML = '';
        this.render();
    }

    updateActiveFilters(criteria) {
        const container = document.querySelector('[data-active-filters]');
        if (!container) return;

        container.innerHTML = Object.entries(criteria).map(([key, value]) => `
            <button class="filter-tag" onclick="homepage?.removeFilter('${key}')">
                ${key}: ${value}
                <i class="fas fa-times"></i>
            </button>
        `).join('');
    }

    removeFilter(filterKey) {
        const checkbox = document.querySelector(`[data-filter-value="${filterKey}"]:checked`);
        if (checkbox) {
            checkbox.checked = false;
            this.applyFilter(filterKey, checkbox);
        }
    }

    setupSearch() {
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                const keyword = e.target.value.trim();
                if (keyword) {
                    this.filteredProducts = app.searchProducts(keyword);
                } else {
                    this.filteredProducts = [...this.allProducts];
                }
                this.currentPage = 1;
                this.render();
            });
        }
    }

    loadProductsFromURL() {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        
        if (search) {
            this.filteredProducts = app.searchProducts(search);
            this.render();
        } else {
            this.filteredProducts = [...this.allProducts];
            this.render();
        }
    }

    render() {
        this.renderProducts();
        this.renderPagination();
        this.toggleEmptyState();
    }

    renderProducts() {
        const container = document.querySelector('[data-products-list]');
        if (!container) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(start, end);

        container.innerHTML = pageProducts.map(product => `
            <article class="product-card" data-product-id="${product.masp}">
                <div class="product-image">
                    <img src="${product.img}" alt="${product.name}" loading="lazy">
                    ${this.getPromoBadge(product.promo)}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-company">${product.company}</p>
                    <div class="product-rating">
                        <span class="stars">${'★'.repeat(product.star || 0)}</span>
                        <span class="rating-count">(${product.rateCount || 0})</span>
                    </div>
                    <p class="product-price">${app.numberToString(app.stringToNumber(product.price))}₫</p>
                    <div class="product-actions">
                        <button class="btn-buy" onclick="app.addToCart('${product.masp}', '${product.name.replace(/'/g, "\\'")}')">
                            <i class="fas fa-shopping-cart"></i> Mua ngay
                        </button>
                        <a href="chitietsanpham.html?id=${product.masp}" class="btn-detail">
                            <i class="fas fa-info-circle"></i>
                        </a>
                    </div>
                </div>
            </article>
        `).join('');
    }

    getPromoBadge(promo) {
        if (!promo || !promo.name) return '';
        
        const badgeMap = {
            'giamgia': `<span class="badge badge-discount">Giảm ${promo.value}</span>`,
            'tragop': `<span class="badge badge-installment">Góp ${promo.value}%</span>`,
            'moiramat': `<span class="badge badge-new">Mới</span>`,
            'giareonline': `<span class="badge badge-online">Online ${promo.value}</span>`
        };
        
        return badgeMap[promo.name] || '';
    }

    renderPagination() {
        const container = document.querySelector('[data-pagination]');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<ul class="pagination-list">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<li><button onclick="homepage.goToPage(${this.currentPage - 1})"><i class="fas fa-chevron-left"></i></button></li>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<li class="active"><span>${i}</span></li>`;
            } else {
                html += `<li><button onclick="homepage.goToPage(${i})">${i}</button></li>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            html += `<li><button onclick="homepage.goToPage(${this.currentPage + 1})"><i class="fas fa-chevron-right"></i></button></li>`;
        }

        html += '</ul>';
        container.innerHTML = html;
    }

    goToPage(pageNumber) {
        this.currentPage = pageNumber;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleEmptyState() {
        const emptyState = document.querySelector('[data-empty-state]');
        if (!emptyState) return;

        if (this.filteredProducts.length === 0) {
            emptyState.style.display = 'flex';
            document.querySelector('[data-products-list]').innerHTML = '';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// ==================== INITIALIZATION ====================
let homepage;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for app module
    const waitForApp = setInterval(() => {
        if (window.app) {
            clearInterval(waitForApp);
            homepage = new HomePageController();
            window.homepage = homepage;
        }
    }, 100);
});
