let inventario = JSON.parse(localStorage.getItem('stock_data')) || [];
let cajaTotal = parseFloat(localStorage.getItem('stock_caja')) || 0;
let gananciaReal = parseFloat(localStorage.getItem('stock_ganancia_real')) || 0;
let monedaActual = localStorage.getItem('currency') || '€';

window.onload = () => {
    actualizarInterfaz();
    initPWA();
};

// --- NAVEGACIÓN ---
function switchView(viewId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(viewId).classList.add('active');
    if (event) event.currentTarget.classList.add('active');
}

// --- MONEDA ---
function toggleCurrency() {
    monedaActual = (monedaActual === '€') ? '$' : '€';
    localStorage.setItem('currency', monedaActual);
    actualizarInterfaz();
}

// --- LÓGICA DE STOCK ---
function procesarEntrada() {
    const nombre = document.getElementById('nombreProd').value;
    const formatoCompra = document.getElementById('formatoCompra').value;
    const formatoVenta = document.getElementById('formatoVenta').value;
    const pCompra = parseFloat(document.getElementById('precioCompraTotal').value);
    const pVenta = parseFloat(document.getElementById('precioVentaFinal').value);
    const udsCaja = parseInt(document.getElementById('udsPorCaja').value) || 1;
    const numCajas = parseInt(document.getElementById('cantidadCajas').value) || 1;

    let stockFinal = 0, costeUnitario = 0, lote = 1;

    if (formatoCompra === 'caja') {
        if (formatoVenta === 'unidad') {
            stockFinal = numCajas * udsCaja;
            costeUnitario = pCompra / udsCaja;
            lote = udsCaja;
        } else {
            stockFinal = numCajas;
            costeUnitario = pCompra;
            lote = 1;
        }
    } else {
        stockFinal = 1;
        costeUnitario = pCompra;
        lote = 1;
    }

    if (nombre && !isNaN(stockFinal) && !isNaN(pVenta)) {
        inventario.push({
            id: Date.now(),
            nombre,
            stock: stockFinal,
            precioCompra: costeUnitario,
            precioVenta: pVenta,
            loteRecompra: lote
        });
        guardarYActualizar();
        resetearFormulario();
        switchView('view-inventory');
    }
}

function modificarStock(index, cambio) {
    const p = inventario[index];
    if (cambio === -1 && p.stock > 0) {
        cajaTotal += p.precioVenta;
        gananciaReal += (p.precioVenta - p.precioCompra);
        p.stock--;
    } else if (cambio === 1) {
        p.stock += p.loteRecompra;
    }
    guardarYActualizar();
}

function guardarYActualizar() {
    localStorage.setItem('stock_data', JSON.stringify(inventario));
    localStorage.setItem('stock_caja', cajaTotal.toFixed(2));
    localStorage.setItem('stock_ganancia_real', gananciaReal.toFixed(2));
    actualizarInterfaz();
}

function actualizarInterfaz() {
    const lista = document.getElementById('listaProductos');
    if (!lista) return;
    lista.innerHTML = '';
    let inversionStock = 0;

    // Actualizar símbolos de moneda
    document.querySelectorAll('.simbolo').forEach(el => el.textContent = monedaActual);
    document.getElementById('btnMoneda').textContent = `Cambiar Moneda (Actual: ${monedaActual})`;

    inventario.forEach((prod, i) => {
        inversionStock += (prod.stock * prod.precioCompra);
        lista.innerHTML += `
            <div class="gasto-item">
                <div class="info">
                    <strong>${prod.nombre}</strong><br>
                    <small>Stock: ${prod.stock} | ${prod.precioVenta.toFixed(2)}${monedaActual}</small>
                </div>
                <div class="counter">
                    <button onclick="modificarStock(${i}, -1)">-</button>
                    <span>${prod.stock}</span>
                    <button onclick="modificarStock(${i}, 1)">+</button>
                </div>
            </div>`;
    });

    document.getElementById('valorTotal').textContent = inversionStock.toFixed(2);
    document.getElementById('cajaActual').textContent = cajaTotal.toFixed(2);
    document.getElementById('gananciaReal').textContent = gananciaReal.toFixed(2);
    document.getElementById('totalArticulos').textContent = inventario.length;
}

function toggleLogicaCompra() {
    const esCaja = document.getElementById('formatoCompra').value === 'caja';
    document.getElementById('seccionCaja').style.display = esCaja ? 'block' : 'none';
}

function filtrarProductos() {
    const filtro = document.getElementById('buscador').value.toLowerCase();
    document.querySelectorAll('.gasto-item').forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(filtro) ? 'flex' : 'none';
    });
}

function resetearFormulario() {
    document.querySelectorAll('#view-add input').forEach(i => i.value = '');
}

function limpiarInventario() {
    if (confirm("¿Borrar todo el historial y productos?")) {
        localStorage.clear();
        location.reload();
    }
}

// --- PWA ANDROID ---
let deferredPrompt;
function initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('install-banner').style.display = 'flex';
    });
}

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        document.getElementById('install-banner').style.display = 'none';
    }
}