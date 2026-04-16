// ==================== البيانات الأساسية ====================
let products = [
    { id: 1, name: 'لابتوب', productionDate: '2024-01-01', expiryDate: '2025-12-31', quantity: 50, purchasePrice: 2000, sellingPrice: 2500, minQuantity: 10, maxQuantity: 100, sales: 25, barcode: '123456789', sector: 'الكترونيات' },
    { id: 2, name: 'قميص', productionDate: '2024-02-01', expiryDate: '2025-01-31', quantity: 100, purchasePrice: 50, sellingPrice: 80, minQuantity: 20, maxQuantity: 200, sales: 45, barcode: '987654321', sector: 'ملابس' },
    { id: 3, name: 'هاتف', productionDate: '2024-01-15', expiryDate: '2025-06-30', quantity: 8, purchasePrice: 800, sellingPrice: 1200, minQuantity: 5, maxQuantity: 50, sales: 12, barcode: '555555555', sector: 'الكترونيات' },
    { id: 4, name: 'كرسي مكتب', productionDate: '2024-03-01', expiryDate: '2026-03-01', quantity: 15, purchasePrice: 300, sellingPrice: 450, minQuantity: 8, maxQuantity: 60, sales: 5, barcode: '444444444', sector: 'أثاث' }
];

let transactions = [];
let debts = [];

// ==================== دوال مساعدة ====================
function showNotification(message, type = 'info') {
    const area = document.getElementById('notificationArea');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    area.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function saveToLocalStorage() {
    localStorage.setItem('sims_products', JSON.stringify(products));
    localStorage.setItem('sims_transactions', JSON.stringify(transactions));
    localStorage.setItem('sims_debts', JSON.stringify(debts));
}

function loadFromLocalStorage() {
    const savedProducts = localStorage.getItem('sims_products');
    const savedTransactions = localStorage.getItem('sims_transactions');
    const savedDebts = localStorage.getItem('sims_debts');
    if (savedProducts) products = JSON.parse(savedProducts);
    if (savedTransactions) transactions = JSON.parse(savedTransactions);
    if (savedDebts) debts = JSON.parse(savedDebts);
}

function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    const lowStock = products.filter(p => p.quantity <= p.minQuantity).length;
    document.getElementById('lowStockProducts').textContent = lowStock;
    const today = new Date().toDateString();
    const todaySales = transactions.filter(t => t.type === 'sale' && new Date(t.date).toDateString() === today).reduce((s, t) => s + t.total, 0);
    document.getElementById('todaySales').textContent = todaySales;
    const totalDebts = debts.reduce((s, d) => s + d.remaining, 0);
    document.getElementById('totalDebts').textContent = totalDebts;
}

function getStockStatus(qty, min) {
    if (qty <= min * 0.3) return { class: 'critical', text: 'حرج' };
    if (qty <= min) return { class: 'medium', text: 'متوسط' };
    return { class: 'good', text: 'جيد' };
}

function calculateEOQ(product) {
    const annualDemand = (product.sales || 10) * 12;
    return Math.round(Math.sqrt((2 * annualDemand * 50) / 10));
}

function calculateROP(product) {
    const dailyDemand = (product.sales || 10) / 30;
    return Math.round(dailyDemand * 5 + product.minQuantity * 0.2);
}

function calculateDaysRemaining(product) {
    if (!product.expiryDate) return 'غير محدد';
    const diff = new Date(product.expiryDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} يوم` : 'منتهي';
}

// ==================== دوال الصفحات ====================
function showLogin() {
    document.getElementById('loginPage').classList.add('active-page');
    document.getElementById('registerPage').classList.remove('active-page');
    document.getElementById('appPage').classList.remove('active-page');
}

function showRegister() {
    document.getElementById('loginPage').classList.remove('active-page');
    document.getElementById('registerPage').classList.add('active-page');
    document.getElementById('appPage').classList.remove('active-page');
}

function showForgotPassword() {
    showNotification('تم إرسال رابط إعادة تعيين كلمة المرور', 'info');
}

function logout() {
    document.getElementById('appPage').classList.remove('active-page');
    document.getElementById('loginPage').classList.add('active-page');
    showNotification('تم تسجيل الخروج', 'info');
}

function showPage(pageId, element) {
    document.querySelectorAll('.content-page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
    
    if (pageId === 'dashboard') { loadProductsTable(); updateStats(); }
    if (pageId === 'sellProduct') loadProductSelect();
    if (pageId === 'forecast') loadForecast();
    if (pageId === 'economicOrder') loadEconomicOrder();
    if (pageId === 'transactions') loadTransactions();
    if (pageId === 'debts') loadDebts();
    if (pageId === 'invoices') loadInvoices('daily');
}

// ==================== عرض المنتجات ====================
function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    products.sort((a, b) => a.name.localeCompare(b.name, 'ar')).forEach(p => {
        const status = getStockStatus(p.quantity, p.minQuantity);
        tbody.innerHTML += `<tr>
            <td>${p.name}</td><td>${p.productionDate}</td><td>${p.expiryDate}</td>
            <td><span class="status-${status.class}">${status.text}</span></td>
            <td>${calculateEOQ(p)}</td><td>${p.minQuantity}</td><td>${calculateROP(p)}</td>
            <td>${p.purchasePrice}</td><td>${p.sellingPrice}</td><td>${p.quantity}</td><td>${p.sales || 0}</td>
        </tr>`;
    });
}

function loadProductSelect() {
    const select = document.getElementById('productSelect');
    if (!select) return;
    select.innerHTML = '<option value="">اختر منتج...</option>';
    products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name} (متوفر: ${p.quantity})</option>`;
    });
}

function loadProductDetails() {
    const id = document.getElementById('productSelect').value;
    const product = products.find(p => p.id == id);
    if (product) {
        document.getElementById('sellPrice').value = product.sellingPrice;
        document.getElementById('remainingQuantity').value = product.quantity;
    }
}

function calculateRemaining() {
    const id = document.getElementById('productSelect').value;
    const qty = parseInt(document.getElementById('sellQuantity').value) || 0;
    const product = products.find(p => p.id == id);
    if (product) {
        document.getElementById('remainingQuantity').value = Math.max(0, product.quantity - qty);
    }
}

function generateBarcode() {
    document.getElementById('barcode').value = Math.random().toString().substr(2, 12);
}

// ==================== إضافة منتج ====================
document.getElementById('addProductForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('productName').value,
        quantity: parseInt(document.getElementById('productQuantity').value),
        productionDate: document.getElementById('productionDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
        minQuantity: parseInt(document.getElementById('minQuantity').value),
        maxQuantity: parseInt(document.getElementById('maxQuantity').value),
        barcode: document.getElementById('barcode').value || Math.random().toString().substr(2, 12),
        sales: 0,
        sector: 'عام'
    };
    products.push(newProduct);
    saveToLocalStorage();
    loadProductsTable();
    loadProductSelect();
    updateStats();
    showNotification('تم إضافة المنتج بنجاح', 'success');
    this.reset();
});

// ==================== بيع منتج ====================
document.getElementById('sellForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('productSelect').value;
    const qty = parseInt(document.getElementById('sellQuantity').value);
    if (!id) { showNotification('اختر منتجاً', 'error'); return; }
    const product = products.find(p => p.id == id);
    if (qty > product.quantity) { showNotification('الكمية غير متوفرة', 'error'); return; }
    
    product.quantity -= qty;
    product.sales = (product.sales || 0) + qty;
    
    const transaction = {
        id: Date.now(), productId: product.id, productName: product.name,
        quantity: qty, price: product.sellingPrice, total: qty * product.sellingPrice,
        type: 'sale', date: new Date().toISOString()
    };
    transactions.push(transaction);
    
    saveToLocalStorage();
    loadProductsTable();
    loadProductSelect();
    updateStats();
    showNotification(`تم بيع ${qty} من ${product.name}`, 'success');
    this.reset();
});

// ==================== التنبؤ ====================
function loadForecast() {
    const tbody = document.getElementById('forecastTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    products.filter(p => p.quantity <= p.minQuantity).forEach(p => {
        tbody.innerHTML += `<tr>
            <td>${p.name}</td><td><span class="status-critical">منخفض</span></td>
            <td>${p.quantity}</td><td>${calculateDaysRemaining(p)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="alert('تجهيز طلب شراء لـ ${p.name}')">شراء</button></td>
        </tr>`;
    });
}

// ==================== الكمية الاقتصادية ====================
function loadEconomicOrder() {
    if (products.length === 0) return;
    const totalMin = products.reduce((s, p) => s + p.minQuantity, 0);
    const totalMax = products.reduce((s, p) => s + p.maxQuantity, 0);
    const avgROP = products.reduce((s, p) => s + calculateROP(p), 0) / products.length;
    document.getElementById('minLimitDisplay').textContent = totalMin;
    document.getElementById('maxLimitDisplay').textContent = totalMax;
    document.getElementById('ropDisplay').textContent = Math.round(avgROP);
    
    const tbody = document.getElementById('remainingDaysBody');
    if (tbody) {
        tbody.innerHTML = '';
        products.forEach(p => {
            tbody.innerHTML += `<tr><td>${p.name}</td><td>${calculateDaysRemaining(p)}</td></tr>`;
        });
    }
}

// ==================== الجرد ====================
function showInventory(type) {
    const display = document.getElementById('inventoryDisplay');
    if (type === 'all') {
        let html = '<table class="table"><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>';
        products.forEach(p => {
            html += `<tr><td>${p.name}</td><td>${p.quantity}</td><td>${p.sellingPrice}</td><td>${p.quantity * p.sellingPrice}</td></tr>`;
        });
        html += '</tbody></table>';
        display.innerHTML = html;
    } else if (type === 'single') {
        const names = products.map(p => p.name).join(', ');
        const product = prompt(`اختر منتجاً من: ${names}`);
        const p = products.find(p => p.name === product);
        if (p) display.innerHTML = `<div class="alert alert-info">${p.name}: الكمية ${p.quantity}، السعر ${p.sellingPrice}، الإجمالي ${p.quantity * p.sellingPrice}</div>`;
        else display.innerHTML = '<div class="alert alert-warning">منتج غير موجود</div>';
    } else if (type === 'sector') {
        const sectors = [...new Set(products.map(p => p.sector))];
        const sector = prompt(`اختر قطاعاً من: ${sectors.join(', ')}`);
        const filtered = products.filter(p => p.sector === sector);
        if (filtered.length) {
            let html = '<table class="table"><thead><tr><th>المنتج</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>';
            filtered.forEach(p => {
                html += `<tr><td>${p.name}</td><td>${p.quantity}</td><td>${p.quantity * p.sellingPrice}</td></tr>`;
            });
            html += '</tbody></table>';
            display.innerHTML = html;
        } else display.innerHTML = '<div class="alert alert-warning">لا توجد منتجات في هذا القطاع</div>';
    }
}

// ==================== المعاملات ====================
function loadTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    [...transactions].reverse().forEach(t => {
        tbody.innerHTML += `<tr>
            <td>${new Date(t.date).toLocaleString('ar-EG')}</td>
            <td>${t.type === 'sale' ? 'بيع' : 'شراء'}</td>
            <td>${t.productName}</td><td>${t.quantity}</td><td>${t.notes || '-'}</td>
        </tr>`;
    });
}

document.getElementById('transactionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const productId = parseInt(document.getElementById('transactionProduct').value);
    const product = products.find(p => p.id === productId);
    if (!product) { showNotification('اختر منتجاً', 'error'); return; }
    
    const transaction = {
        id: Date.now(),
        type: document.getElementById('transactionType').value,
        productId: productId,
        productName: product.name,
        quantity: parseInt(document.getElementById('transactionQuantity').value),
        notes: document.getElementById('transactionNotes').value,
        date: new Date().toISOString()
    };
    transactions.push(transaction);
    
    if (document.getElementById('createNotification').checked) {
        showNotification(`معاملة: ${transaction.notes || transaction.type}`, 'info');
    }
    
    saveToLocalStorage();
    loadTransactions();
    showNotification('تم تسجيل المعاملة', 'success');
    this.reset();
    document.getElementById('transactionProduct').innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
});

// ==================== الديون ====================
function loadDebts() {
    const tbody = document.getElementById('debtsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    debts.forEach(d => {
        tbody.innerHTML += `<tr>
            <td>${new Date(d.date).toLocaleString('ar-EG')}</td>
            <td>${d.productName}</td><td>${d.paid}</td><td>${d.remaining}</td>
            <td><span class="status-${d.remaining > 0 ? 'medium' : 'good'}">${d.remaining > 0 ? 'غير مدفوع' : 'مدفوع'}</span></td>
        </tr>`;
    });
}

// ==================== الفواتير ====================
function loadInvoices(period) {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    const now = new Date();
    let filtered = transactions;
    if (period === 'daily') filtered = transactions.filter(t => new Date(t.date).toDateString() === now.toDateString());
    if (period === 'weekly') filtered = transactions.filter(t => new Date(t.date) >= new Date(now.setDate(now.getDate() - 7)));
    if (period === 'monthly') filtered = transactions.filter(t => new Date(t.date) >= new Date(now.setMonth(now.getMonth() - 1)));
    
    tbody.innerHTML = '';
    filtered.forEach(t => {
        tbody.innerHTML += `<tr>
            <td>INV-${t.id}</td><td>${new Date(t.date).toLocaleDateString('ar-EG')}</td>
            <td>${t.type === 'sale' ? 'مبيعات' : 'مشتريات'}</td><td>${t.productName}</td>
            <td>${t.quantity}</td><td>${t.price}</td><td>${t.total}</td>
        </tr>`;
    });
}

// ==================== التسجيل ====================
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    showNotification('تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول', 'success');
    showLogin();
});

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    loadFromLocalStorage();
    document.getElementById('loginPage').classList.remove('active-page');
    document.getElementById('appPage').classList.add('active-page');
    loadProductsTable();
    loadProductSelect();
    updateStats();
    showNotification('مرحباً بك في SIMS', 'success');
});

// ==================== بدء التشغيل ====================
loadFromLocalStorage();