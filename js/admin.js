// ==================== ADMIN DASHBOARD MODULE ====================
class AdminDashboard {
    constructor() {
        this.totalRevenue = 0;
        this.products = [];
        this.adminInfo = [];
        this.currentTab = 'Trang Chủ';
        this.sortOrder = { decreasing: true };
        this.init();
    }

    init() {
        this.products = getListProducts() || [];
        this.adminInfo = getListAdmin() || [];

        if (!window.localStorage.getItem('admin')) {
            this.showAccessDenied();
            return;
        }

        this.setupEventListeners();
        this.renderDashboard();
        this.openTab('Trang Chủ');
    }

    showAccessDenied() {
        document.body.innerHTML = `
            <div class="access-denied">
                <h1>Truy cập bị từ chối</h1>
                <p>Bạn không có quyền truy cập trang này</p>
            </div>
        `;
    }

    setupEventListeners() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const navLinks = sidebar.querySelectorAll('a:not([onclick])');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.textContent.trim();
                this.openTab(tabName);
                this.setActiveNav(link);
            });
        });
    }

    setActiveNav(activeLink) {
        const sidebar = document.querySelector('.sidebar');
        sidebar.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    renderDashboard() {
        this.addTableProducts();
        this.addTableDonHang();
        this.addTableKhachHang();
        this.addThongKe();
    }

    openTab(tabName) {
        this.currentTab = tabName;
        const mainContent = document.querySelector('.main');
        if (!mainContent) return;

        const allTabs = mainContent.querySelectorAll('[class$="home"], [class$="sanpham"], [class$="donhang"], [class$="khachhang"]');
        allTabs.forEach(tab => tab.style.display = 'none');

        const tabMap = {
            'Trang Chủ': 'home',
            'Sản Phẩm': 'sanpham',
            'Đơn Hàng': 'donhang',
            'Khách Hàng': 'khachhang'
        };

        const targetTab = mainContent.querySelector(`.${tabMap[tabName]}`);
        if (targetTab) targetTab.style.display = 'block';
    }

    // ======================== PRODUCTS MANAGEMENT ========================
    addTableProducts() {
        const tableContent = document.querySelector('.sanpham .table-content');
        if (!tableContent) return;

        let html = '<table class="table-outline hideImg">';
        this.products.forEach((product, index) => {
            html += this.createProductRow(product, index + 1);
        });
        html += '</table>';

        tableContent.innerHTML = html;
        this.attachProductEvents();
    }

    createProductRow(product, index) {
        return `
            <tr>
                <td class="col-5">${index}</td>
                <td class="col-10">${product.masp}</td>
                <td class="col-40">
                    <a title="Xem chi tiết" target="_blank" rel="noopener" 
                       href="chitietsanpham.html?${product.name.split(' ').join('-')}">
                        ${product.name}
                    </a>
                    <img src="${product.img}" alt="${product.name}">
                </td>
                <td class="col-15">${product.price}</td>
                <td class="col-15">${this.formatPromo(product.promo)}</td>
                <td class="col-15">
                    <button class="btn-edit" data-masp="${product.masp}" title="Sửa sản phẩm">
                        <i class="fa fa-wrench"></i>
                    </button>
                    <button class="btn-delete" data-masp="${product.masp}" data-name="${product.name}" title="Xóa sản phẩm">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    attachProductEvents() {
        const tableContent = document.querySelector('.sanpham .table-content');
        
        tableContent.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');

            if (editBtn) {
                const masp = editBtn.dataset.masp;
                this.openEditProductForm(masp);
            }

            if (deleteBtn) {
                const masp = deleteBtn.dataset.masp;
                const name = deleteBtn.dataset.name;
                this.deleteProduct(masp, name);
            }
        });
    }

    searchProducts(keyword, searchType) {
        const tableContent = document.querySelector('.sanpham .table-content');
        const rows = tableContent.querySelectorAll('tr');
        const columnIndex = searchType === 'ma' ? 1 : 2;

        rows.forEach(row => {
            const cellText = row.querySelector(`td:nth-child(${columnIndex + 1})`).textContent.toLowerCase();
            const isMatch = cellText.includes(keyword.toLowerCase());
            row.style.display = isMatch ? '' : 'none';
        });
    }

    formatPromo(promo) {
        const promoMap = {
            'tragop': () => `Góp ${promo.value}%`,
            'giamgia': () => `Giảm ${promo.value}`,
            'giareonline': () => `Online (${promo.value})`,
            'moiramat': () => `Mới`
        };
        return promoMap[promo.name] ? promoMap[promo.name]() : '';
    }

    openEditProductForm(masp) {
        const product = this.products.find(p => p.masp === masp);
        if (!product) return;

        const modal = document.getElementById('khungSuaSanPham');
        if (!modal) return;

        const companies = ["Apple", "Samsung", "Oppo", "Nokia", "Huawei", "Xiaomi", "Realme", "Vivo", "Philips", "Mobell", "Mobiistar", "Itel", "Coolpad", "HTC", "Motorola"];
        const promoOptions = [
            { value: '', label: 'Không' },
            { value: 'tragop', label: 'Trả góp' },
            { value: 'giamgia', label: 'Giảm giá' },
            { value: 'giareonline', label: 'Giá rẻ online' },
            { value: 'moiramat', label: 'Mới ra mắt' }
        ];

        let html = `<span class="close" onclick="dashboard.closeModal('khungSuaSanPham')">&times;</span>`;
        html += `<table class="overlayTable table-outline table-content table-header">`;
        html += `<tr><th colspan="2">${product.name}</th></tr>`;
        
        // Form fields
        html += `<tr><td>Mã sản phẩm:</td><td><input type="text" id="editMasp" value="${product.masp}"></td></tr>`;
        html += `<tr><td>Tên sản phẩm:</td><td><input type="text" id="editName" value="${product.name}"></td></tr>`;
        html += `<tr><td>Hãng:</td><td><select id="editCompany">`;
        
        companies.forEach(c => {
            const selected = c === product.company ? 'selected' : '';
            html += `<option value="${c}" ${selected}>${c}</option>`;
        });
        
        html += `</select></td></tr>`;
        html += `<tr><td>Hình:</td><td><img class="hinhDaiDien" id="anhDaiDienSanPhamSua" src="${product.img}" alt="${product.name}"><input type="file" accept="image/*" onchange="dashboard.updateProductImage(this.files)"></td></tr>`;
        html += `<tr><td>Giá tiền:</td><td><input type="text" id="editPrice" value="${stringToNum(product.price)}"></td></tr>`;
        html += `<tr><td>Số sao:</td><td><input type="text" id="editStar" value="${product.star}"></td></tr>`;
        html += `<tr><td>Đánh giá:</td><td><input type="text" id="editRateCount" value="${product.rateCount}"></td></tr>`;
        html += `<tr><td>Khuyến mãi:</td><td><select id="editPromoName">`;
        
        promoOptions.forEach(opt => {
            const selected = opt.value === product.promo.name ? 'selected' : '';
            html += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
        });
        
        html += `</select></td></tr>`;
        html += `<tr><td>Giá trị khuyến mãi:</td><td><input type="text" id="editPromoValue" value="${product.promo.value}"></td></tr>`;
        
        // Technical specifications
        html += `<tr><th colspan="2">Thông số kĩ thuật</th></tr>`;
        html += `<tr><td>Màn hình:</td><td><input type="text" id="editScreen" value="${product.detail?.screen || ''}"></td></tr>`;
        html += `<tr><td>Hệ điều hành:</td><td><input type="text" id="editOS" value="${product.detail?.os || ''}"></td></tr>`;
        html += `<tr><td>Camera sau:</td><td><input type="text" id="editCamera" value="${product.detail?.camara || ''}"></td></tr>`;
        html += `<tr><td>Camera trước:</td><td><input type="text" id="editCameraFront" value="${product.detail?.camaraFront || ''}"></td></tr>`;
        html += `<tr><td>CPU:</td><td><input type="text" id="editCPU" value="${product.detail?.cpu || ''}"></td></tr>`;
        html += `<tr><td>RAM:</td><td><input type="text" id="editRAM" value="${product.detail?.ram || ''}"></td></tr>`;
        html += `<tr><td>Bộ nhớ trong:</td><td><input type="text" id="editROM" value="${product.detail?.rom || ''}"></td></tr>`;
        html += `<tr><td>Thẻ nhớ:</td><td><input type="text" id="editMicroUSB" value="${product.detail?.microUSB || ''}"></td></tr>`;
        html += `<tr><td>Dung lượng Pin:</td><td><input type="text" id="editBattery" value="${product.detail?.battery || ''}"></td></tr>`;
        html += `<tr><td colspan="2" class="table-footer"><button onclick="dashboard.updateProduct('${masp}')">SỬA</button></td></tr>`;
        html += `</table>`;

        modal.innerHTML = html;
        modal.style.transform = 'scale(1)';
    }

    updateProductImage(files) {
        if (!files[0]) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            document.getElementById('anhDaiDienSanPhamSua').src = reader.result;
            window.editProductImage = reader.result;
        });
        reader.readAsDataURL(files[0]);
    }

    updateProduct(masp) {
        const updatedProduct = {
            masp: document.getElementById('editMasp').value,
            name: document.getElementById('editName').value,
            company: document.getElementById('editCompany').value,
            img: window.editProductImage || document.getElementById('anhDaiDienSanPhamSua').src,
            price: numToString(Number.parseInt(document.getElementById('editPrice').value, 10)),
            star: Number.parseInt(document.getElementById('editStar').value, 10),
            rateCount: Number.parseInt(document.getElementById('editRateCount').value, 10),
            promo: {
                name: document.getElementById('editPromoName').value,
                value: document.getElementById('editPromoValue').value
            },
            detail: {
                screen: document.getElementById('editScreen').value,
                os: document.getElementById('editOS').value,
                camara: document.getElementById('editCamera').value,
                camaraFront: document.getElementById('editCameraFront').value,
                cpu: document.getElementById('editCPU').value,
                ram: document.getElementById('editRAM').value,
                rom: document.getElementById('editROM').value,
                microUSB: document.getElementById('editMicroUSB').value,
                battery: document.getElementById('editBattery').value
            }
        };

        const index = this.products.findIndex(p => p.masp === masp);
        if (index !== -1) {
            this.products[index] = updatedProduct;
            setListProducts(this.products);
            this.addTableProducts();
            this.closeModal('khungSuaSanPham');
            alert('Sửa sản phẩm thành công');
        }
    }

    deleteProduct(masp, name) {
        if (window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
            this.products = this.products.filter(p => p.masp !== masp);
            setListProducts(this.products);
            this.addTableProducts();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.transform = 'scale(0)';
        window.editProductImage = null;
    }

    // ======================== ORDERS MANAGEMENT ========================
    addTableDonHang() {
        const tableContent = document.querySelector('.donhang .table-content');
        if (!tableContent) return;

        const orders = this.getOrders();
        let html = '<table class="table-outline hideImg">';
        this.totalRevenue = 0;

        orders.forEach((order, index) => {
            html += this.createOrderRow(order, index + 1);
            this.totalRevenue += stringToNum(order.tongtien);
        });

        html += '</table>';
        tableContent.innerHTML = html;
        this.attachOrderEvents();
    }

    createOrderRow(order, index) {
        return `
            <tr>
                <td class="col-5">${index}</td>
                <td class="col-13">${order.ma}</td>
                <td class="col-7">${order.khach}</td>
                <td class="col-20">${order.sp}</td>
                <td class="col-15">${order.tongtien}</td>
                <td class="col-10">${order.ngaygio}</td>
                <td class="col-10">${order.tinhTrang}</td>
                <td class="col-15">
                    <button class="btn-approve" data-order-id="${order.ma}" title="Duyệt đơn">
                        <i class="fa fa-check"></i>
                    </button>
                    <button class="btn-reject" data-order-id="${order.ma}" title="Hủy đơn">
                        <i class="fa fa-remove"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    attachOrderEvents() {
        const tableContent = document.querySelector('.donhang .table-content');
        
        tableContent.addEventListener('click', (e) => {
            const approveBtn = e.target.closest('.btn-approve');
            const rejectBtn = e.target.closest('.btn-reject');

            if (approveBtn) {
                this.approveOrder(approveBtn.dataset.orderId, true);
            }

            if (rejectBtn) {
                this.approveOrder(rejectBtn.dataset.orderId, false);
            }
        });
    }

    getOrders(returnProductList = false) {
        const users = getListUser();
        const orders = [];

        users.forEach(user => {
            user.donhang?.forEach(order => {
                const total = this.calculateOrderTotal(order);
                const orderDate = new Date(order.ngaymua).toLocaleString();
                const products = returnProductList 
                    ? this.getOrderProductsList(order)
                    : this.getOrderProductsHTML(order);

                orders.push({
                    ma: order.ngaymua.toString(),
                    khach: user.username,
                    sp: products,
                    tongtien: numToString(total),
                    ngaygio: orderDate,
                    tinhTrang: order.tinhTrang
                });
            });
        });

        return orders;
    }

    calculateOrderTotal(order) {
        return order.sp?.reduce((sum, item) => {
            const product = this.products.find(p => p.masp === item.ma);
            if (!product) return sum;
            const price = product.promo?.name === 'giareonline' 
                ? stringToNum(product.promo.value) 
                : stringToNum(product.price);
            return sum + (price * item.soluong);
        }, 0) || 0;
    }

    getOrderProductsHTML(order) {
        return order.sp?.map(item => {
            const product = this.products.find(p => p.masp === item.ma);
            return `<p style="text-align: right">${product?.name} [${item.soluong}]</p>`;
        }).join('') || '';
    }

    getOrderProductsList(order) {
        return order.sp?.map(item => ({
            sanPham: this.products.find(p => p.masp === item.ma),
            soLuong: item.soluong
        })) || [];
    }

    approveOrder(orderId, isApprove) {
        const users = getListUser();
        let found = false;

        users.forEach(user => {
            user.donhang?.forEach(order => {
                if (order.ngaymua.toString() === orderId) {
                    found = true;
                    if (isApprove) {
                        if (order.tinhTrang === 'Đang chờ xử lý') {
                            order.tinhTrang = 'Đã giao hàng';
                        } else if (order.tinhTrang === 'Đã hủy') {
                            alert('Không thể duyệt đơn đã hủy!');
                            return;
                        }
                    } else {
                        if (order.tinhTrang === 'Đang chờ xử lý') {
                            if (window.confirm('Xác nhận hủy đơn hàng này?\nHành động này không thể khôi phục!')) {
                                order.tinhTrang = 'Đã hủy';
                            }
                        } else if (order.tinhTrang === 'Đã giao hàng') {
                            alert('Không thể hủy đơn hàng đã giao!');
                            return;
                        }
                    }
                }
            });
        });

        if (found) {
            setListUser(users);
            this.addTableDonHang();
        }
    }

    filterOrdersByDate(fromDate, toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const tableContent = document.querySelector('.donhang .table-content');
        const rows = tableContent.querySelectorAll('tr');

        rows.forEach(row => {
            const dateCell = row.querySelector('td:nth-child(6)');
            if (!dateCell) return;

            const rowDate = new Date(dateCell.textContent);
            const isInRange = rowDate >= from && rowDate <= to;
            row.style.display = isInRange ? '' : 'none';
        });
    }

    searchOrders(keyword, searchType) {
        const tableContent = document.querySelector('.donhang .table-content');
        const rows = tableContent.querySelectorAll('tr');
        const columnMap = { 'ma': 1, 'khachhang': 2, 'trangThai': 6 };
        const columnIndex = columnMap[searchType] || 1;

        rows.forEach(row => {
            const cellText = row.querySelector(`td:nth-child(${columnIndex + 1})`).textContent.toLowerCase();
            const isMatch = cellText.includes(keyword.toLowerCase());
            row.style.display = isMatch ? '' : 'none';
        });
    }

    // ======================== CUSTOMERS MANAGEMENT ========================
    addTableKhachHang() {
        const tableContent = document.querySelector('.khachhang .table-content');
        if (!tableContent) return;

        const users = getListUser();
        let html = '<table class="table-outline hideImg">';

        users.forEach((user, index) => {
            html += this.createCustomerRow(user, index + 1);
        });

        html += '</table>';
        tableContent.innerHTML = html;
        this.attachCustomerEvents();
    }

    createCustomerRow(user, index) {
        const isLocked = user.off;
        return `
            <tr>
                <td class="col-5">${index}</td>
                <td class="col-20">${user.ho} ${user.ten}</td>
                <td class="col-20">${user.email}</td>
                <td class="col-20">${user.username}</td>
                <td class="col-10">${user.pass}</td>
                <td class="col-40">
                    <label class="switch">
                        <input type="checkbox" class="user-toggle" data-username="${user.username}" ${!isLocked ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <button class="btn-delete-user" data-username="${user.username}" title="Xóa tài khoản">
                        <i class="fa fa-remove"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    attachCustomerEvents() {
        const tableContent = document.querySelector('.khachhang .table-content');
        
        tableContent.addEventListener('change', (e) => {
            if (e.target.classList.contains('user-toggle')) {
                const username = e.target.dataset.username;
                this.toggleUserLock(username, e.target.checked);
            }
        });

        tableContent.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-user');
            if (deleteBtn) {
                this.deleteUser(deleteBtn.dataset.username);
            }
        });
    }

    toggleUserLock(username, isEnabled) {
        const users = getListUser();
        const user = users.find(u => u.username === username);

        if (user) {
            user.off = !isEnabled;
            setListUser(users);
            const status = !isEnabled ? 'Khóa' : 'Mở';
            setTimeout(() => alert(`${status} tài khoản ${username} thành công`), 500);
        }
    }

    deleteUser(username) {
        if (!window.confirm(`Xác nhận xóa ${username}?\nMọi dữ liệu sẽ mất!`)) {
            return;
        }

        const users = getListUser();
        const index = users.findIndex(u => u.username === username);

        if (index !== -1) {
            users.splice(index, 1);
            setListUser(users);
            localStorage.removeItem('CurrentUser');
            this.addTableKhachHang();
            this.addTableDonHang();
        }
    }

    searchCustomers(keyword, searchType) {
        const tableContent = document.querySelector('.khachhang .table-content');
        const rows = tableContent.querySelectorAll('tr');
        const columnMap = { 'ten': 1, 'email': 2, 'taikhoan': 3 };
        const columnIndex = columnMap[searchType] || 1;

        rows.forEach(row => {
            const cellText = row.querySelector(`td:nth-child(${columnIndex + 1})`).textContent.toLowerCase();
            const isMatch = cellText.includes(keyword.toLowerCase());
            row.style.display = isMatch ? '' : 'none';
        });
    }

    // ======================== STATISTICS & CHARTS ========================
    addThongKe() {
        const orders = this.getOrders(true);
        const statistics = this.calculateStatistics(orders);

        this.renderChart(
            'myChart1',
            'Số lượng bán ra',
            'bar',
            Object.keys(statistics),
            Object.values(statistics).map(s => s.quantity),
            this.generateColors(Object.keys(statistics).length)
        );

        this.renderChart(
            'myChart2',
            'Doanh thu',
            'doughnut',
            Object.keys(statistics),
            Object.values(statistics).map(s => s.revenue),
            this.generateColors(Object.keys(statistics).length)
        );
    }

    calculateStatistics(orders) {
        const stats = {};

        orders.forEach(order => {
            if (order.sp.find(item => item.sanPham?.tinhTrang === 'Đã hủy')) return;

            order.sp.forEach(item => {
                const company = item.sanPham?.company;
                if (!company) return;

                if (!stats[company]) {
                    stats[company] = { quantity: 0, revenue: 0 };
                }

                const price = stringToNum(item.sanPham.price);
                stats[company].quantity += item.soLuong;
                stats[company].revenue += price * item.soLuong;
            });
        });

        return stats;
    }

    generateColors(count) {
        return Array.from({ length: count }, () => this.getRandomColor());
    }

    getRandomColor() {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    renderChart(canvasId, title, chartType, labels, data, colors) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Initialize dashboard on page load
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
});

function logOutAdmin() {
    window.localStorage.removeItem('admin');
}

function getListRandomColor(length) {
    let result = [];
    for(let i = length; i--;) {
        result.push(getRandomColor());
    }
    return result;
}

function addChart(id, chartOption) {
    var ctx = document.getElementById(id).getContext('2d');
    var chart = new Chart(ctx, chartOption);
}

function createChartConfig(
    title = 'Title',
    charType = 'bar', 
    labels = ['nothing'], 
    data = [2], 
    colors = ['red'], 
) {
    return {
        type: charType,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                // borderWidth: 2
            }]
        },
        options: {
            title: {
                fontColor: '#fff',
                fontSize: 25,
                display: true,
                text: title
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    };
}

function addThongKe() {
    var danhSachDonHang = getListDonHang(true);

    var thongKeHang = {}; // Thống kê hãng

    danhSachDonHang.forEach(donHang => {
        // Nếu đơn hàng bị huỷ thì không tính vào số lượng bán ra
        if(donHang.tinhTrang === 'Đã hủy') return;

        // Lặp qua từng sản phẩm trong đơn hàng
        donHang.sp.forEach(sanPhamTrongDonHang => {
            let tenHang = sanPhamTrongDonHang.sanPham.company;
            let soLuong = sanPhamTrongDonHang.soLuong;
            let donGia = stringToNum(sanPhamTrongDonHang.sanPham.price);
            let thanhTien = soLuong * donGia;

            if(!thongKeHang[tenHang]) {
                thongKeHang[tenHang] = {
                    soLuongBanRa: 0,
                    doanhThu: 0,
                }
            }

            thongKeHang[tenHang].soLuongBanRa += soLuong;
            thongKeHang[tenHang].doanhThu += thanhTien;
        })
    })


    // Lấy mảng màu ngẫu nhiên để vẽ đồ thị
    let colors = getListRandomColor(Object.keys(thongKeHang).length);

    // Thêm thống kê
    addChart('myChart1', createChartConfig(
        'Số lượng bán ra',
        'bar', 
        Object.keys(thongKeHang), 
        Object.values(thongKeHang).map(_ =>  _.soLuongBanRa),
        colors,
    ));

    addChart('myChart2', createChartConfig(
        'Doanh thu',
        'doughnut', 
        Object.keys(thongKeHang), 
        Object.values(thongKeHang).map(_ =>  _.doanhThu),
        colors,
    ));

    // var doughnutChart = copyObject(dataChart);
    //     doughnutChart.type = 'doughnut';
    // addChart('myChart2', doughnutChart);

    // var pieChart = copyObject(dataChart);
    //     pieChart.type = 'pie';
    // addChart('myChart3', pieChart);

    // var lineChart = copyObject(dataChart);
    //     lineChart.type = 'line';
    // addChart('myChart4', lineChart);
}

// ======================= Các Tab =========================
function addEventChangeTab() {
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var list_a = sidebar.getElementsByTagName('a');
    for(var a of list_a) {
        if(!a.onclick) {
            a.addEventListener('click', function() {
                turnOff_Active();
                this.classList.add('active');
                var tab = this.childNodes[1].data.trim()
                openTab(tab);
            })
        }
    }
}

function turnOff_Active() {
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var list_a = sidebar.getElementsByTagName('a');
    for(var a of list_a) {
        a.classList.remove('active');
    }
}

function openTab(nameTab) {
    // ẩn hết
    var main = document.getElementsByClassName('main')[0].children;
    for(var e of main) {
        e.style.display = 'none';
    }

    // mở tab
    switch(nameTab) {
        case 'Trang Chủ': document.getElementsByClassName('home')[0].style.display = 'block'; break;
        case 'Sản Phẩm': document.getElementsByClassName('sanpham')[0].style.display = 'block'; break;
        case 'Đơn Hàng': document.getElementsByClassName('donhang')[0].style.display = 'block'; break;
        case 'Khách Hàng': document.getElementsByClassName('khachhang')[0].style.display = 'block'; break;
    }
}

// ========================== Sản Phẩm ========================
// Vẽ bảng danh sách sản phẩm
function addTableProducts() {
    var tc = document.getElementsByClassName('sanpham')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline hideImg">`;

    for (var i = 0; i < list_products.length; i++) {
        var p = list_products[i];
        s += `<tr>
            <td style="width: 5%">` + (i+1) + `</td>
            <td style="width: 10%">` + p.masp + `</td>
            <td style="width: 40%">
                <a title="Xem chi tiết" target="_blank" href="chitietsanpham.html?` + p.name.split(' ').join('-') + `">` + p.name + `</a>
                <img src="` + p.img + `"></img>
            </td>
            <td style="width: 15%">` + p.price + `</td>
            <td style="width: 15%">` + promoToStringValue(p.promo) + `</td>
            <td style="width: 15%">
                <div class="tooltip">
                    <i style = "background:pink;" class="fa fa-wrench"  onclick="addKhungSuaSanPham('` + p.masp + `')"></i>
                    <span class="tooltiptext">Sửa</span>
                </div>
                <div class="tooltip">
                    <i style = "background:blue;" class="fa fa-trash" onclick="xoaSanPham('` + p.masp + `', '`+p.name+`')"></i>
                    <span class="tooltiptext">Xóa</span>
                </div>
            </td>
        </tr>`;
    }

    s += `</table>`;

    tc.innerHTML = s;
}

// Tìm kiếm
function timKiemSanPham(inp) {
    var kieuTim = document.getElementsByName('kieuTimSanPham')[0].value;
    var text = inp.value;

    // Lọc
    var vitriKieuTim = {'ma':1, 'ten':2}; // mảng lưu vị trí cột

    var listTr_table = document.getElementsByClassName('sanpham')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[vitriKieuTim[kieuTim]].innerHTML.toLowerCase();

        if (td.indexOf(text.toLowerCase()) < 0) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
        }
    }
}

// Thêm
let previewSrc; // biến toàn cục lưu file ảnh đang thêm
function layThongTinSanPhamTuTable(id) {
    var khung = document.getElementById(id);
    var tr = khung.getElementsByTagName('tr');

    var masp = tr[1].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var name = tr[2].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var company = tr[3].getElementsByTagName('td')[1].getElementsByTagName('select')[0].value;
    var img = tr[4].getElementsByTagName('td')[1].getElementsByTagName('img')[0].src;
    var price = tr[5].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var star = tr[6].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var rateCount = tr[7].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var promoName = tr[8].getElementsByTagName('td')[1].getElementsByTagName('select')[0].value;
    var promoValue = tr[9].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;

    var screen = tr[11].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var os = tr[12].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var camara = tr[13].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var camaraFront = tr[14].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var cpu = tr[15].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var ram = tr[16].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var rom = tr[17].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var microUSB = tr[18].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var battery = tr[19].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;

    if(isNaN(price)) {
        alert('Giá phải là số nguyên');
        return false;
    }

    if(isNaN(star)) {
        alert('Số sao phải là số nguyên');
        return false;
    }

    if(isNaN(rateCount)) {
        alert('Số đánh giá phải là số nguyên');
        return false;
    }

    try {
        return {
            "name": name,
            "company": company,
            "img": previewSrc,
            "price": numToString(Number.parseInt(price, 10)),
            "star": Number.parseInt(star, 10),
            "rateCount": Number.parseInt(rateCount, 10),
            "promo": {
                "name": promoName,
                "value": promoValue
            },
            "detail": {
                "screen": screen,
                "os": os,
                "camara": camara,
                "camaraFront": camaraFront,
                "cpu": cpu,
                "ram": ram,
                "rom": rom,
                "microUSB": microUSB,
                "battery": battery
            },
            "masp" : masp
        }
    } catch(e) {
        alert('Lỗi: ' + e.toString());
        return false;
    }
}
function themSanPham() {
    var newSp = layThongTinSanPhamTuTable('khungThemSanPham');
    if(!newSp) return;

    for(var p of list_products) {
        if(p.masp == newSp.masp) {
            alert('Mã sản phẩm bị trùng !!');
            return false;
        }

        if(p.name == newSp.name) {
            alert('Tên sản phẩm bị trùng !!');
            return false;
        }
    }
     // Them san pham vao list_products
     list_products.push(newSp);

     // Lưu vào localstorage
     setListProducts(list_products);
 
     // Vẽ lại table
     addTableProducts();

    alert('Thêm sản phẩm "' + newSp.name + '" thành công.');
    document.getElementById('khungThemSanPham').style.transform = 'scale(0)';
}
function autoMaSanPham(company) {
    // hàm tự tạo mã cho sản phẩm mới
    if(!company) company = document.getElementsByName('chonCompany')[0].value;
    var index = 0;
    for (var i = 0; i < list_products.length; i++) {
        if (list_products[i].company == company) {
            index++;
        }
    }
    document.getElementById('maspThem').value = company.substring(0, 3) + index;
}

// Xóa
function xoaSanPham(masp, tensp) {
    if (window.confirm('Bạn có chắc muốn xóa ' + tensp)) {
        // Xóa
        for(var i = 0; i < list_products.length; i++) {
            if(list_products[i].masp == masp) {
                list_products.splice(i, 1);
            }
        }

        // Lưu vào localstorage
        setListProducts(list_products);

        // Vẽ lại table 
        addTableProducts();
    }
}

// Sửa
function suaSanPham(masp) {
    var sp = layThongTinSanPhamTuTable('khungSuaSanPham');
    if(!sp) return;
    
    for(var p of list_products) {
        if(p.masp == masp && p.masp != sp.masp) {
            alert('Mã sản phẩm bị trùng !!');
            return false;
        }

        if(p.name == sp.name && p.masp != sp.masp) {
            alert('Tên sản phẩm bị trùng !!');
            return false;
        }
    }
    // Sửa
    for(var i = 0; i < list_products.length; i++) {
        if(list_products[i].masp == masp) {
            list_products[i] = sp;
        }
    }

    // Lưu vào localstorage
    setListProducts(list_products);

    // Vẽ lại table
    addTableProducts();

    alert('Sửa ' + sp.name + ' thành công');

    document.getElementById('khungSuaSanPham').style.transform = 'scale(0)';
}

function addKhungSuaSanPham(masp) {
    var sp;
    for(var p of list_products) {
        if(p.masp == masp) {
            sp = p;
        }
    }

    var s = `<span class="close" onclick="this.parentElement.style.transform = 'scale(0)';">&times;</span>
    <table class="overlayTable table-outline table-content table-header">
        <tr>
            <th colspan="2">`+sp.name+`</th>
        </tr>
        <tr>
            <td>Mã sản phẩm:</td>
            <td><input type="text" value="`+sp.masp+`"></td>
        </tr>
        <tr>
            <td>Tên sẩn phẩm:</td>
            <td><input type="text" value="`+sp.name+`"></td>
        </tr>
        <tr>
            <td>Hãng:</td>
            <td>
                <select>`
                    
    var company = ["Apple", "Samsung", "Oppo", "Nokia", "Huawei", "Xiaomi","Realme", "Vivo", "Philips", "Mobell", "Mobiistar", "Itel","Coolpad", "HTC", "Motorola"];
    for(var c of company) {
        if(sp.company == c)
            s += (`<option value="`+c+`" selected>`+c+`</option>`);
        else s += (`<option value="`+c+`">`+c+`</option>`);
    }

    s += `
                </select>
            </td>
        </tr>
        <tr>
            <td>Hình:</td>
            <td>
                <img class="hinhDaiDien" id="anhDaiDienSanPhamSua" src="`+sp.img+`">
                <input type="file" accept="image/*" onchange="capNhatAnhSanPham(this.files, 'anhDaiDienSanPhamSua')">
            </td>
        </tr>
        <tr>
            <td>Giá tiền (số nguyên):</td>
            <td><input type="text" value="`+stringToNum(sp.price)+`"></td>
        </tr>
        <tr>
            <td>Số sao (số nguyên 0->5):</td>
            <td><input type="text" value="`+sp.star+`"></td>
        </tr>
        <tr>
            <td>Đánh giá (số nguyên):</td>
            <td><input type="text" value="`+sp.rateCount+`"></td>
        </tr>
        <tr>
            <td>Khuyến mãi:</td>
            <td>
                <select>
                    <option value="">Không</option>
                    <option value="tragop" `+(sp.promo.name == 'tragop'?'selected':'')+`>Trả góp</option>
                    <option value="giamgia" `+(sp.promo.name == 'giamgia'?'selected':'')+`>Giảm giá</option>
                    <option value="giareonline" `+(sp.promo.name == 'giareonline'?'selected':'')+`>Giá rẻ online</option>
                    <option value="moiramat" `+(sp.promo.name == 'moiramat'?'selected':'')+`>Mới ra mắt</option>
                </select>
            </td>
        </tr>
        <tr>
            <td>Giá trị khuyến mãi:</td>
            <td><input type="text" value="`+sp.promo.value+`"></td>
        </tr>
        <tr>
            <th colspan="2">Thông số kĩ thuật</th>
        </tr>
        <tr>
            <td>Màn hình:</td>
            <td><input type="text" value="`+sp.detail.screen+`"></td>
        </tr>
        <tr>
            <td>Hệ điều hành:</td>
            <td><input type="text" value="`+sp.detail.os+`"></td>
        </tr>
        <tr>
            <td>Camara sau:</td>
            <td><input type="text" value="`+sp.detail.camara+`"></td>
        </tr>
        <tr>
            <td>Camara trước:</td>
            <td><input type="text" value="`+sp.detail.camaraFront+`"></td>
        </tr>
        <tr>
            <td>CPU:</td>
            <td><input type="text" value="`+sp.detail.cpu+`"></td>
        </tr>
        <tr>
            <td>RAM:</td>
            <td><input type="text" value="`+sp.detail.ram+`"></td>
        </tr>
        <tr>
            <td>Bộ nhớ trong:</td>
            <td><input type="text" value="`+sp.detail.rom+`"></td>
        </tr>
        <tr>
            <td>Thẻ nhớ:</td>
            <td><input type="text" value="`+sp.detail.microUSB+`"></td>
        </tr>
        <tr>
            <td>Dung lượng Pin:</td>
            <td><input type="text" value="`+sp.detail.battery+`"></td>
        </tr>
        <tr>
            <td colspan="2"  class="table-footer"> <button onclick="suaSanPham('`+sp.masp+`')">SỬA</button> </td>
        </tr>
    </table>`
    var khung = document.getElementById('khungSuaSanPham');
    khung.innerHTML = s;
    khung.style.transform = 'scale(1)';
}

// Cập nhật ảnh sản phẩm
function capNhatAnhSanPham(files, id) {
    // var url = '';
    // if(files.length) url = window.URL.createObjectURL(files[0]);
    
    // document.getElementById(id).src = url;

    const reader = new FileReader();
    reader.addEventListener("load", function () {
        // convert image file to base64 string
        previewSrc = reader.result;
        document.getElementById(id).src = previewSrc;
    }, false);

    if (files[0]) {
        reader.readAsDataURL(files[0]);
    }
} 

// Sắp Xếp sản phẩm
function sortProductsTable(loai) {
    var list = document.getElementsByClassName('sanpham')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_SanPham); // type cho phép lựa chọn sort theo mã hoặc tên hoặc giá ... 
    decrease = !decrease;
}

// Lấy giá trị của loại(cột) dữ liệu nào đó trong bảng
function getValueOfTypeInTable_SanPham(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt' : return Number(td[0].innerHTML);
        case 'masp' : return td[1].innerHTML.toLowerCase();
        case 'ten' : return td[2].innerHTML.toLowerCase();
        case 'gia' : return stringToNum(td[3].innerHTML);
        case 'khuyenmai' : return td[4].innerHTML.toLowerCase();
    }
    return false;
}

// ========================= Đơn Hàng ===========================
// Vẽ bảng
function addTableDonHang() {
    var tc = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline hideImg">`;

    var listDH = getListDonHang();

    TONGTIEN = 0;
    for (var i = 0; i < listDH.length; i++) {
        var d = listDH[i];
        s += `<tr>
            <td style="width: 5%">` + (i+1) + `</td>
            <td style="width: 13%">` + d.ma + `</td>
            <td style="width: 7%">` + d.khach + `</td>
            <td style="width: 20%">` + d.sp + `</td>
            <td style="width: 15%">` + d.tongtien + `</td>
            <td style="width: 10%">` + d.ngaygio + `</td>
            <td style="width: 10%">` + d.tinhTrang + `</td>
            <td style="width: 10%">
                <div class="tooltip">
                    <i style="background:pink" class="fa fa-check" onclick="duyet('`+d.ma+`', true)"></i>
                    <span class="tooltiptext">Duyệt</span>
                </div>
                <div class="tooltip">
                    <i style="background:blue" class="fa fa-remove" onclick="duyet('`+d.ma+`', false)"></i>
                    <span class="tooltiptext">Hủy</span>
                </div>
                
            </td>
        </tr>`;
        TONGTIEN += stringToNum(d.tongtien);
    }

    s += `</table>`;
    tc.innerHTML = s;
}

function getListDonHang(traVeDanhSachSanPham = false) {
    var u = getListUser();
    var result = [];
    for(var i = 0; i < u.length; i++) {
        for(var j = 0; j < u[i].donhang.length; j++) {
            // Tổng tiền
            var tongtien = 0;
            for(var s of u[i].donhang[j].sp) {
                var timsp = timKiemTheoMa(list_products, s.ma);
                if(timsp.promo.name == 'giareonline') tongtien += stringToNum(timsp.promo.value);
                else tongtien += stringToNum(timsp.price);
            }

            // Ngày giờ
            var x = new Date(u[i].donhang[j].ngaymua).toLocaleString();

            // Các sản phẩm - dạng html
            var sps = '';
            for(var s of u[i].donhang[j].sp) {
                sps += `<p style="text-align: right">`+(timKiemTheoMa(list_products, s.ma).name + ' [' + s.soluong + ']') + `</p>`;
            }

            // Các sản phẩm - dạng mảng
            var danhSachSanPham = [];
            for(var s of u[i].donhang[j].sp) {
                danhSachSanPham.push({
                    sanPham: timKiemTheoMa(list_products, s.ma),
                    soLuong: s.soluong,
                });
            }

            // Lưu vào result
            result.push({
                "ma": u[i].donhang[j].ngaymua.toString(),
                "khach": u[i].username,
                "sp": traVeDanhSachSanPham ? danhSachSanPham : sps,
                "tongtien": numToString(tongtien),
                "ngaygio": x,
                "tinhTrang": u[i].donhang[j].tinhTrang
            });
        }
    }
    return result;
}

// Duyệt
function duyet(maDonHang, duyetDon) {
    var u = getListUser();
    for(var i = 0; i < u.length; i++) {
        for(var j = 0; j < u[i].donhang.length; j++) {
            if(u[i].donhang[j].ngaymua == maDonHang) {
                if(duyetDon) {
                    if(u[i].donhang[j].tinhTrang == 'Đang chờ xử lý') {
                        u[i].donhang[j].tinhTrang = 'Đã giao hàng';
                    
                    } else if(u[i].donhang[j].tinhTrang == 'Đã hủy') {
                        alert('Không thể duyệt đơn đã hủy !');
                        return;
                    }
                } else {
                    if(u[i].donhang[j].tinhTrang == 'Đang chờ xử lý') {
                        if(window.confirm('Bạn có chắc muốn hủy đơn hàng này. Hành động này sẽ không thể khôi phục lại !'))
                            u[i].donhang[j].tinhTrang = 'Đã hủy';
                    
                    } else if(u[i].donhang[j].tinhTrang == 'Đã giao hàng') {
                        alert('Không thể hủy đơn hàng đã giao !');
                        return;
                    }
                }
                break;
            }
        }
    }

    // lưu lại
    setListUser(u);

    // vẽ lại
    addTableDonHang();
}

function locDonHangTheoKhoangNgay() {
    var from = document.getElementById('fromDate').valueAsDate;
    var to = document.getElementById('toDate').valueAsDate;

    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[5].innerHTML;
        var d = new Date(td);

        if (d >= from && d <= to) {
            tr.style.display = '';
        } else {
            tr.style.display = 'none';
        }
    }
}

function timKiemDonHang(inp) {
    var kieuTim = document.getElementsByName('kieuTimDonHang')[0].value;
    var text = inp.value;

    // Lọc
    var vitriKieuTim = {'ma':1, 'khachhang':2, 'trangThai':6};

    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[vitriKieuTim[kieuTim]].innerHTML.toLowerCase();

        if (td.indexOf(text.toLowerCase()) < 0) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
        }
    }
}

// Sắp xếp
function sortDonHangTable(loai) {
    var list = document.getElementsByClassName('donhang')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_DonHang); 
    decrease = !decrease;
}

// Lấy giá trị của loại(cột) dữ liệu nào đó trong bảng
function getValueOfTypeInTable_DonHang(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt': return Number(td[0].innerHTML);
        case 'ma' : return new Date(td[1].innerHTML); // chuyển về dạng ngày để so sánh ngày
        case 'khach' : return td[2].innerHTML.toLowerCase(); // lấy tên khách
        case 'sanpham' : return td[3].children.length;    // lấy số lượng hàng trong đơn này, length ở đây là số lượng <p>
        case 'tongtien' : return stringToNum(td[4].innerHTML); // trả về dạng giá tiền
        case 'ngaygio' : return new Date(td[5].innerHTML); // chuyển về ngày
        case 'trangthai': return td[6].innerHTML.toLowerCase(); //
    }
    return false;
}

// ====================== Khách Hàng =============================
// Vẽ bảng
function addTableKhachHang() {
    var tc = document.getElementsByClassName('khachhang')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline hideImg">`;

    var listUser = getListUser();

    for (var i = 0; i < listUser.length; i++) {
        var u = listUser[i];
        s += `<tr>
            <td style="width: 5%">` + (i+1) + `</td>
            <td style="width: 15%">` + u.ho + ' ' + u.ten + `</td>
            <td style="width: 20%">` + u.email + `</td>
            <td style="width: 20%">` + u.username + `</td>
            <td style="width: 10%">` + u.pass + `</td>
            <td style="width: 40%">
                <div class="tooltip">
                    <label class="switch">
                        <input type="checkbox" `+(u.off?'':'checked')+` onclick="voHieuHoaNguoiDung(this, '`+u.username+`')">
                        <span class="slider round"></span>
                    </label>
                    <span class="tooltiptext">`+(u.off?'Mở':'Khóa')+`</span>
                </div>
                <div class="tooltip">
                    <i class="fa fa-remove" onclick="xoaNguoiDung('`+u.username+`')"></i>
                    <span class="tooltiptext">Xóa</span>
                </div>
            </td>
        </tr>`;
    }

    s += `</table>`;
    tc.innerHTML = s;
}

// Tìm kiếm
function timKiemNguoiDung(inp) {
    var kieuTim = document.getElementsByName('kieuTimKhachHang')[0].value;
    var text = inp.value;

    // Lọc
    var vitriKieuTim = {'ten':1, 'email':2, 'taikhoan':3};

    var listTr_table = document.getElementsByClassName('khachhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[vitriKieuTim[kieuTim]].innerHTML.toLowerCase();

        if (td.indexOf(text.toLowerCase()) < 0) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
        }
    }
}

function openThemNguoiDung() {
    window.alert('Not Available!');
}

// vô hiệu hóa người dùng (tạm dừng, không cho đăng nhập vào)
function voHieuHoaNguoiDung(inp, taikhoan) {
    var listUser = getListUser();
    for(var u of listUser) {
        if(u.username == taikhoan) {
            let value = !inp.checked
            u.off = value;
            setListUser(listUser);
            
            setTimeout(() => alert(`${value ? 'Khoá' : 'Mở khoá'} tải khoản ${u.username} thành công.`), 500);
            break;
        }
    }
    var span = inp.parentElement.nextElementSibling;
        span.innerHTML = (inp.checked?'Khóa':'Mở');
}

// Xóa người dùng
function xoaNguoiDung(taikhoan) {
    if(window.confirm('Xác nhận xóa '+taikhoan+'? \nMọi dữ liệu về '+taikhoan+' sẽ mất! Bao gồm cả những đơn hàng của '+taikhoan)) {
        var listuser = getListUser();
        for(var i = 0; i < listuser.length; i++) {
            if(listuser[i].username == taikhoan) {
                listuser.splice(i, 1); // xóa
                setListUser(listuser); // lưu thay đổi
                localStorage.removeItem('CurrentUser'); // đăng xuất khỏi tài khoản hiện tại (current user)
                addTableKhachHang(); // vẽ lại bảng khách hàng
                addTableDonHang(); // vẽ lại bảng đơn hàng
                return;
            }
        }
    }
}

// Sắp xếp
function sortKhachHangTable(loai) {
    var list = document.getElementsByClassName('khachhang')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_KhachHang); 
    decrease = !decrease;
}

function getValueOfTypeInTable_KhachHang(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt': return Number(td[0].innerHTML);
        case 'hoten' : return td[1].innerHTML.toLowerCase();
        case 'email' : return td[2].innerHTML.toLowerCase();
        case 'taikhoan' : return td[3].innerHTML.toLowerCase();    
        case 'matkhau' : return td[4].innerHTML.toLowerCase(); 
    }
    return false;
}

