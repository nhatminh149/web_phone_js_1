// ==================== MODERN APP INITIALIZATION ====================
// ES6+ Application Module with modern patterns

class AppModule {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.users = [];
        this.initialize();
    }

    initialize() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
    }

    // ==================== DATA LOADING ====================
    loadData() {
        try {
            // Load products from localStorage or global list_products
            this.products = this.getFromStorage('ListProducts') || window.list_products || [];
            
            // Load or initialize users
            this.users = this.getFromStorage('ListUser') || this.getDefaultUsers();
            // Ensure admin account exists and has a password so admin login works
            try {
                const adminIdx = this.users.findIndex(u => u.username === 'admin');
                if (adminIdx === -1) {
                    this.users.push({ username: 'admin', pass: 'admin123', email: 'admin@email.com', fullName: 'Admin', products: [], off: false });
                    this.setInStorage('ListUser', this.users);
                } else if (!this.users[adminIdx].pass) {
                    this.users[adminIdx].pass = 'admin123';
                    this.setInStorage('ListUser', this.users);
                }
            } catch (err) {
                console.error('Error ensuring admin user:', err);
            }
            
            // Restore current user session
            const storedCurrentUser = this.getFromStorage('CurrentUser');
            if (storedCurrentUser) {
                this.currentUser = this.users.find(u => u.username === storedCurrentUser.username);
                if (this.currentUser) {
                    this.currentUser.products = storedCurrentUser.products || [];
                }
            }
            
            // Save default data to localStorage if not exists
            if (this.products.length > 0 && !this.getFromStorage('ListProducts')) {
                this.setInStorage('ListProducts', this.products);
            }
            if (!this.getFromStorage('ListUser')) {
                this.setInStorage('ListUser', this.users);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.users = this.getDefaultUsers();
        }
    }

    getDefaultUsers() {
        return [
            { username: 'user1', pass: '123456', email: 'user1@email.com', fullName: 'Người dùng 1', products: [], off: false },
            { username: 'user2', pass: '123456', email: 'user2@email.com', fullName: 'Người dùng 2', products: [], off: false },
            { username: 'admin', pass: 'admin123', email: 'admin@email.com', fullName: 'Admin', products: [], off: false }
        ];
    }

    // ==================== STORAGE UTILITIES ====================
    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Storage error reading ${key}:`, error);
            return null;
        }
    }

    setInStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Storage error writing ${key}:`, error);
            return false;
        }
    }

    // ==================== AUTHENTICATION ====================
login(username, password) {
    const user = this.users.find(u => u.username === username && u.pass === password);

    if (!user) {
        this.showAlert('Tên đăng nhập hoặc mật khẩu không chính xác', 'danger');
        return false;
    }

    if (user.off) {
        this.showAlert('Tài khoản của bạn đang bị khóa', 'warning');
        return false;
    }

    if (!user.products) user.products = [];

    this.currentUser = user;
    this.setInStorage('CurrentUser', this.currentUser);
    
    // XÓA PHẦN NÀY - không cần thiết
    // if (username === 'admin') {
    //     localStorage.setItem('admin', JSON.stringify(user));
    // }
    
    this.showAlert('Đăng nhập thành công', 'success');
    this.updateUI();
    return true;
}

logout() {
    // XÓA PHẦN NÀY
    // if (this.currentUser && this.currentUser.username === 'admin') {
    //     localStorage.removeItem('admin');
    // }
    
    this.currentUser = null;
    localStorage.removeItem('CurrentUser');
    this.showAlert('Đã đăng xuất', 'info');
    this.updateUI();
}
    register(userData) {
        const { username, password, email, fullName } = userData;

        if (!username || !password || !email) {
            this.showAlert('Vui lòng điền đầy đủ thông tin', 'danger');
            return false;
        }

        if (this.users.some(u => u.username === username)) {
            this.showAlert('Tên đăng nhập đã tồn tại', 'danger');
            return false;
        }

        const newUser = {
            username,
            pass: password,
            email,
            fullName,
            products: [],
            orders: [],
            off: false,
            createdAt: Date.now()
        };

        this.users.push(newUser);
        this.setInStorage('ListUser', this.users);
        this.showAlert('Đăng ký thành công. Vui lòng đăng nhập', 'success');
        return true;
    }

    // ==================== SHOPPING CART ====================
    addToCart(productId, productName) {
        if (!this.currentUser) {
            this.showAlert('Vui lòng đăng nhập để mua hàng', 'warning');
            this.toggleAuthModal(true);
            return false;
        }

        if (this.currentUser.off) {
            this.showAlert('Tài khoản đang bị khóa không thể mua hàng', 'danger');
            return false;
        }

        const existingItem = this.currentUser.products.find(p => p.ma === productId);

        if (existingItem) {
            existingItem.soluong++;
        } else {
            this.currentUser.products.push({
                ma: productId,
                soluong: 1,
                addedAt: Date.now()
            });
        }

        this.updateCurrentUser();
        this.animateCartIcon();
        this.showAlert(`Đã thêm ${productName} vào giỏ hàng`, 'success', 2000);
        return true;
    }

    removeFromCart(productId) {
        if (!this.currentUser) return false;

        this.currentUser.products = this.currentUser.products.filter(p => p.ma !== productId);
        this.updateCurrentUser();
        this.updateUI();
        return true;
    }

    updateCartQuantity(productId, quantity) {
        if (!this.currentUser) return false;

        const item = this.currentUser.products.find(p => p.ma === productId);
        if (item) {
            item.soluong = Math.max(1, Math.min(999, quantity));
            this.updateCurrentUser();
            this.updateUI();
            return true;
        }
        return false;
    }

    getCartTotal() {
        if (!this.currentUser) return 0;

        return this.currentUser.products.reduce((total, item) => {
            const product = this.products.find(p => p.masp === item.ma);
            if (!product) return total;

            const price = product.promo?.name === 'giareonline'
                ? this.stringToNumber(product.promo.value)
                : this.stringToNumber(product.price);

            return total + (price * item.soluong);
        }, 0);
    }

    // ==================== PRODUCT OPERATIONS ====================
    searchProducts(keyword) {
        if (!keyword) return this.products;
        
        const lowerKeyword = keyword.toLowerCase();
        return this.products.filter(product =>
            product.name?.toLowerCase().includes(lowerKeyword) ||
            product.company?.toLowerCase().includes(lowerKeyword)
        );
    }

    filterProducts(criteria) {
        let filtered = [...this.products];

        if (criteria.company && criteria.company !== 'all') {
            filtered = filtered.filter(p => p.company === criteria.company);
        }

        if (criteria.minPrice !== undefined && criteria.maxPrice !== undefined) {
            filtered = filtered.filter(p => {
                const price = this.stringToNumber(p.price);
                return price >= criteria.minPrice && price <= criteria.maxPrice;
            });
        }

        if (criteria.promo && criteria.promo !== 'all') {
            filtered = filtered.filter(p => p.promo?.name === criteria.promo);
        }

        if (criteria.minRating) {
            filtered = filtered.filter(p => p.star >= criteria.minRating);
        }

        return filtered;
    }

    sortProducts(products, sortBy) {
        const sorted = [...products];

        const comparators = {
            'priceAsc': (a, b) => this.stringToNumber(a.price) - this.stringToNumber(b.price),
            'priceDesc': (a, b) => this.stringToNumber(b.price) - this.stringToNumber(a.price),
            'nameAsc': (a, b) => a.name.localeCompare(b.name),
            'nameDesc': (a, b) => b.name.localeCompare(a.name),
            'ratingDesc': (a, b) => (b.star || 0) - (a.star || 0),
            'newest': (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        };

        if (comparators[sortBy]) {
            sorted.sort(comparators[sortBy]);
        }

        return sorted;
    }

    // ==================== ORDERS ====================
    createOrder(shippingInfo) {
        if (!this.currentUser || this.currentUser.products.length === 0) {
            this.showAlert('Giỏ hàng trống', 'warning');
            return false;
        }

        const order = {
            id: `ORD-${Date.now()}`,
            createdAt: Date.now(),
            items: this.deepClone(this.currentUser.products),
            total: this.getCartTotal(),
            status: 'pending',
            shippingInfo
        };

        if (!this.currentUser.orders) {
            this.currentUser.orders = [];
        }

        this.currentUser.orders.push(order);
        this.currentUser.products = [];
        this.updateCurrentUser();
        this.showAlert('Đặt hàng thành công', 'success');
        return true;
    }

    getOrderHistory() {
        return this.currentUser?.orders || [];
    }

    // ==================== UI UPDATES ====================
    updateUI() {
        this.updateCartNumber();
        this.updateUserInfo();
    }

    updateCartNumber() {
        const cartBadge = document.querySelector('[data-cart-count]');
        if (cartBadge) {
            const count = this.currentUser?.products.length || 0;
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    updateUserInfo() {
        const userDisplay = document.querySelector('[data-user-display]');
        if (!userDisplay) return;

        if (this.currentUser) {
            userDisplay.innerHTML = `
                <div class="user-info">
                    <span class="username">${this.escapeHtml(this.currentUser.username)}</span>
                    <button class="btn-logout" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Đăng xuất
                    </button>
                </div>
            `;
        } else {
            userDisplay.innerHTML = `
                <button class="btn-login" onclick="toggleAuthModal(true)">
                    <i class="fas fa-sign-in-alt"></i>
                    Đăng nhập
                </button>
            `;
        }
    }

    updateCurrentUser() {
        if (this.currentUser) {
            this.setInStorage('CurrentUser', this.currentUser);
            const userIndex = this.users.findIndex(u => u.username === this.currentUser.username);
            if (userIndex !== -1) {
                this.users[userIndex] = this.currentUser;
                this.setInStorage('ListUser', this.users);
            }
        }
        this.updateUI();
    }

    // ==================== ANIMATIONS & ALERTS ====================
    animateCartIcon() {
        const cartBadge = document.querySelector('[data-cart-count]');
        if (!cartBadge) return;

        cartBadge.style.animation = 'none';
        setTimeout(() => {
            cartBadge.style.animation = 'cartPulse 0.5s ease';
        }, 10);
    }

    showAlert(message, type = 'info', duration = 3000) {
        const container = document.querySelector('[data-alert-box]');
        if (!container) {
            this.createAlertBox();
            return this.showAlert(message, type, duration);
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            padding: 15px 20px;
            border-radius: 4px;
            margin-bottom: 10px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        
        container.appendChild(alert);

        if (duration > 0) {
            setTimeout(() => {
                alert.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }, duration);
        }
    }

    createAlertBox() {
        const container = document.createElement('div');
        container.setAttribute('data-alert-box', '');
        container.className = 'alert-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    toggleAuthModal(show) {
        const modal = document.getElementById('authModal');
        if (modal) {
            if (show) {
                modal.classList.add('show');
            } else {
                modal.classList.remove('show');
            }
        }
    }

    // ==================== UTILITY FUNCTIONS ====================
    stringToNumber(str) {
        if (!str) return 0;
        return parseInt(str.toString().replace(/\D/g, ''), 10) || 0;
    }

    numberToString(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('Clone error:', error);
            return obj;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Alert close buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-alert-close]')) {
                const alert = e.target.closest('[data-alert]');
                if (alert) alert.remove();
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-modal-close]')) {
                const modal = e.target.closest('[data-modal]');
                if (modal) modal.classList.remove('show');
            }
        });
    }
}

// ==================== GLOBAL APP INSTANCE ====================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AppModule();
    window.app = app;
});

