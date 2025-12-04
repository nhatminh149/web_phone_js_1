// ==================== SHOPPING CART MODULE ====================
// Modern ES6+ Shopping Cart Controller

class ShoppingCartModule {
    constructor() {
        this.cartItems = [];
        this.initialize();
    }

    initialize() {
        this.loadCart();
        this.render();
        this.setupEventListeners();
    }

    loadCart() {
        if (app && app.currentUser) {
            this.cartItems = app.currentUser.products || [];
        }
    }

    setupEventListeners() {
        const container = document.querySelector('[data-cart-items]');
        if (!container) {
            console.warn('[ShoppingCart] Container [data-cart-items] not found');
            return;
        }

        container.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-item]');
            if (removeBtn) {
                console.log('[ShoppingCart] Remove button clicked:', removeBtn.dataset.removeItem);
                const productId = removeBtn.dataset.removeItem;
                this.removeItem(productId);
            }
        });

        container.addEventListener('change', (e) => {
            const quantityInput = e.target.closest('[data-quantity-input]');
            if (quantityInput) {
                console.log('[ShoppingCart] Quantity changed:', quantityInput.dataset.quantityInput);
                const productId = quantityInput.dataset.quantityInput;
                const quantity = parseInt(quantityInput.value);
                this.updateQuantity(productId, quantity);
            }
        });
    }

    removeItem(productId) {
        if (app) {
            app.removeFromCart(productId);
            this.loadCart();
            this.render();
            this.setupEventListeners(); // Re-attach listeners after render
            app.showAlert('Đã xóa khỏi giỏ hàng', 'info', 2000);
        }
    }

    updateQuantity(productId, quantity) {
        if (app) {
            app.updateCartQuantity(productId, quantity);
            this.loadCart();
            this.render();
            this.setupEventListeners(); // Re-attach listeners after render
        }
    }

    getProduct(productId) {
        return app?.products.find(p => p.masp === productId);
    }

    getItemPrice(product) {
        if (!product) return 0;
        return product.promo?.name === 'giareonline'
            ? app.stringToNumber(product.promo.value)
            : app.stringToNumber(product.price);
    }

    getTotal() {
        return this.cartItems.reduce((total, item) => {
            const product = this.getProduct(item.ma);
            const price = this.getItemPrice(product);
            return total + (price * item.soluong);
        }, 0);
    }

    getItemCount() {
        return this.cartItems.reduce((count, item) => count + item.soluong, 0);
    }

    render() {
        const container = document.querySelector('[data-cart-items]');
        if (!container) return;

        if (this.cartItems.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Giỏ hàng của bạn trống</p>
                    <a href="index.html" class="btn-primary">Tiếp tục mua sắm</a>
                </div>
            `;
            this.updateSummary();
            return;
        }

        container.innerHTML = this.cartItems.map(item => {
            const product = this.getProduct(item.ma);
            if (!product) return '';

            const price = this.getItemPrice(product);
            const itemTotal = price * item.soluong;

            return `
                <div class="cart-item">
                    <img src="${product.img}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${product.name}</h3>
                        <p class="cart-item-price">${app.numberToString(price)}₫</p>
                    </div>
                    <div class="cart-item-quantity">
                        <input 
                            type="number" 
                            min="1" 
                            max="999" 
                            value="${item.soluong}"
                            data-quantity-input="${item.ma}"
                        >
                    </div>
                    <div class="cart-item-total">
                        ${app.numberToString(itemTotal)}₫
                    </div>
                    <button 
                        class="btn-remove" 
                        data-remove-item="${item.ma}"
                        title="Xóa sản phẩm"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        this.updateSummary();
    }

    updateSummary() {
        const summaryContainer = document.querySelector('[data-cart-summary]');
        if (!summaryContainer) return;

        const subtotal = this.getTotal();
        const shipping = subtotal > 0 ? 30000 : 0;
        const tax = Math.floor(subtotal * 0.08);
        const total = subtotal + shipping + tax;

        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Tạm tính:</span>
                <span>${app.numberToString(subtotal)}₫</span>
            </div>
            <div class="summary-row">
                <span>Phí vận chuyển:</span>
                <span>${app.numberToString(shipping)}₫</span>
            </div>
            <div class="summary-row">
                <span>Thuế (8%):</span>
                <span>${app.numberToString(tax)}₫</span>
            </div>
            <div class="summary-row total">
                <span>Tổng cộng:</span>
                <span>${app.numberToString(total)}₫</span>
            </div>
        `;
    }

    checkout() {
        if (this.cartItems.length === 0) {
            app.showAlert('Giỏ hàng trống', 'warning');
            return;
        }

        // Redirect to checkout page or show checkout modal
        window.location.href = 'giohang.html';
    }
}

// ==================== INITIALIZATION ====================
let cart;

document.addEventListener('DOMContentLoaded', () => {
    const waitForApp = setInterval(() => {
        if (window.app) {
            clearInterval(waitForApp);
            cart = new ShoppingCartModule();
            window.cart = cart;
        }
    }, 100);
});
