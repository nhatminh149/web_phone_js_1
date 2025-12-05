// ==================== PRODUCT DETAIL MODULE ====================
// Modern ES6+ Product Detail Page Controller

class ProductDetailModule {
    constructor() {
        this.product = null;
        this.quantity = 1;
        this.relatedProducts = [];
        this.initialize();
    }

    initialize() {
        this.loadProductFromURL();
        if (this.product) {
            this.render();
            this.loadRelatedProducts();
            this.setupEventListeners();
        }
    }

    loadProductFromURL() {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        
        if (!productId || !app) {
            this.showNotFound();
            return;
        }

        this.product = app.products?.find(p => p.masp === productId);
        if (!this.product) {
            this.showNotFound();
        }
    }

    showNotFound() {
        const container = document.querySelector('[data-product-detail]');
        if (container) {
            container.innerHTML = `
                <div class="product-not-found">
                    <i class="fas fa-search"></i>
                    <h1>Không tìm thấy sản phẩm</h1>
                    <p>Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                    <a href="index.html" class="btn-primary">Quay lại trang chủ</a>
                </div>
            `;
        }
    }

    loadRelatedProducts() {
        if (!app?.products || !this.product) return;

        // Find 4 related products with same company or price range
        this.relatedProducts = app.products
            .filter(p => 
                p.masp !== this.product.masp && 
                (p.company === this.product.company || 
                 this.isPriceRange(p.price))
            )
            .slice(0, 4);

        this.renderRelatedProducts();
    }

    isPriceRange(price) {
        if (!this.product) return false;
        const productPrice = app.stringToNumber(this.product.price);
        const comparisonPrice = app.stringToNumber(price);
        const range = productPrice * 0.2;
        return Math.abs(productPrice - comparisonPrice) <= range;
    }

    setupEventListeners() {
        const quantityInput = document.querySelector('[data-quantity]');
        const decrementBtn = document.querySelector('[data-quantity-decrement]');
        const incrementBtn = document.querySelector('[data-quantity-increment]');
        const addToCartBtn = document.querySelector('[data-add-to-cart]');

        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                this.quantity = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                quantityInput.value = this.quantity;
            });
        }

        decrementBtn?.addEventListener('click', () => {
            this.quantity = Math.max(1, this.quantity - 1);
            if (quantityInput) quantityInput.value = this.quantity;
        });

        incrementBtn?.addEventListener('click', () => {
            this.quantity = Math.min(999, this.quantity + 1);
            if (quantityInput) quantityInput.value = this.quantity;
        });

        addToCartBtn?.addEventListener('click', () => {
            this.addToCart();
        });

        // Related products click
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-product-link]')) {
                const productId = e.target.dataset.productLink;
                window.location.href = `chitietsanpham.html?id=${productId}`;
            }
        });
    }

    addToCart() {
        if (!app || !this.product) {
            app?.showAlert('Lỗi tải sản phẩm', 'danger');
            return;
        }

        app.addToCart(this.product.masp, this.quantity);
        
        // Animate button
        const btn = document.querySelector('[data-add-to-cart]');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Đã thêm!';
            btn.style.background = 'var(--success-color)';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }

        app.showAlert(`Đã thêm ${this.product.name} vào giỏ hàng`, 'success', 2000);
    }

    render() {
        const container = document.querySelector('[data-product-detail]');
        if (!container || !this.product) return;

        const price = this.getPrice();
        const originalPrice = app.stringToNumber(this.product.price);
        const discount = this.getDiscount();
        const promoInfo = this.getPromoInfo();

        container.innerHTML = `
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="index.html">Trang chủ</a>
                <span>/</span>
                <a href="index.html?company=${this.product.company}">${this.product.company}</a>
                <span>/</span>
                <span aria-current="page">${this.product.name}</span>
            </nav>

            <div style="width:1000px;margin-left:600px" class="product-detail-container">
                <!-- Product Images -->
                <div class="product-images">

                    <div class="thumbnail-images">
                        <img src="${this.product.img}" alt="Hình 1" onclick="document.getElementById('mainImage').src=this.src" class="thumbnail">
                        ${this.product.img2 ? `<img src="${this.product.img2}" alt="Hình 2" onclick="document.getElementById('mainImage').src=this.src" class="thumbnail">` : ''}
                        ${this.product.img3 ? `<img src="${this.product.img3}" alt="Hình 3" onclick="document.getElementById('mainImage').src=this.src" class="thumbnail">` : ''}
                    </div>
                </div>

                <!-- Product Info -->
                <div class="product-info">
                    <h1>${this.product.name}</h1>
                    
                    <div class="product-rating">
                        <div class="stars">
                            ${this.getStarRating()}
                        </div>
                        <span class="rating-count">${this.product.rating || 0} đánh giá</span>
                    </div>

                    <div class="product-price">
                        ${discount > 0 ? `<span class="original-price">${app.numberToString(originalPrice)}₫</span>` : ''}
                        <span class="current-price">${app.numberToString(price)}₫</span>
                        ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                    </div>

                    ${promoInfo ? `<div class="promo-info">${promoInfo}</div>` : ''}

                    <div class="product-stats">
                        <div class="stat">
                            <span class="label">Thương hiệu:</span>
                            <span class="value">${this.product.company}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Tình trạng:</span>
                            <span class="value">Còn hàng</span>
                        </div>
                        <div class="stat">
                            <span class="label">Bảo hành:</span>
                            <span class="value">12 tháng</span>
                        </div>
                    </div>

                    <div class="product-actions">
                        <div class="quantity-control">
                            <label for="quantity">Số lượng:</label>
                            <div class="quantity-input-group">
                                <button data-quantity-decrement class="quantity-btn" title="Giảm">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input 
                                    type="number" 
                                    id="quantity" 
                                    data-quantity 
                                    value="1" 
                                    min="1" 
                                    max="999"
                                >
                                <button data-quantity-increment class="quantity-btn" title="Tăng">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        <button data-add-to-cart class="btn-add-to-cart">
                            <i class="fas fa-shopping-cart"></i>
                            Thêm vào giỏ hàng
                        </button>

                        <button class="btn-buy-now">
                            <i class="fas fa-bolt"></i>
                            Mua ngay
                        </button>
                    </div>

                    <div class="product-benefits">
                        <div class="benefit">
                            <i class="fas fa-truck"></i>
                            <span>Miễn phí vận chuyển (đơn hàng >500k)</span>
                        </div>
                        <div class="benefit">
                            <i class="fas fa-shield-alt"></i>
                            <span>Bảo mật giao dịch 100%</span>
                        </div>
                        <div class="benefit">
                            <i class="fas fa-undo"></i>
                            <span>Có thể trả hàng trong 30 ngày</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Description -->
            <section class="product-description">
                <h2>Mô tả sản phẩm</h2>
                <div class="description-content">
                    <p>${this.product.description || 'Chưa có mô tả chi tiết.'}</p>
                </div>
            </section>

            <!-- Related Products -->
            ${this.relatedProducts.length > 0 ? `
                <section class="related-products">
                    <h2>Sản phẩm liên quan</h2>
                    <div class="products-grid" data-related-products>
                        <!-- Related products will be rendered here -->
                    </div>
                </section>
            ` : ''}
        `;
    }

    renderRelatedProducts() {
        const container = document.querySelector('[data-related-products]');
        if (!container) return;

        container.innerHTML = this.relatedProducts.map(product => {
            const price = this.getProductPrice(product);
            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${product.img}" alt="${product.name}">
                        ${product.promo?.name ? `<span class="promo-badge">${product.promo.name}</span>` : ''}
                    </div>
                    <div class="product-card-info">
                        <h3>${product.name}</h3>
                        <p class="company">${product.company}</p>
                        <div class="price">${app.numberToString(price)}₫</div>
                        <button 
                            data-product-link="${product.masp}"
                            class="btn-view-detail"
                        >
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getPrice() {
        if (!this.product) return 0;
        return this.product.promo?.name === 'giareonline'
            ? app.stringToNumber(this.product.promo.value)
            : app.stringToNumber(this.product.price);
    }

    getProductPrice(product) {
        return product.promo?.name === 'giareonline'
            ? app.stringToNumber(product.promo.value)
            : app.stringToNumber(product.price);
    }

    getDiscount() {
        if (!this.product || this.product.promo?.name !== 'giareonline') return 0;
        const original = app.stringToNumber(this.product.price);
        const current = app.stringToNumber(this.product.promo.value);
        return Math.round(((original - current) / original) * 100);
    }

    getPromoInfo() {
        if (!this.product || !this.product.promo) return '';
        
        const promos = {
            'giareonline': 'Giá rẻ online',
            'thetienhan': 'Thế tiền hàn',
            'new': 'Hàng mới',
            'installment': 'Có thể trả góp 0%'
        };

        return promos[this.product.promo.name] || '';
    }

    getStarRating() {
        const rating = this.product?.rating || 0;
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += `<i class="fas fa-star ${i < Math.floor(rating) ? 'filled' : ''}"></i>`;
        }
        return stars;
    }
}

// ==================== INITIALIZATION ====================
let productDetail;

document.addEventListener('DOMContentLoaded', () => {
    const waitForApp = setInterval(() => {
        if (window.app) {
            clearInterval(waitForApp);
            productDetail = new ProductDetailModule();
            window.productDetail = productDetail;
        }
    }, 100);
});
