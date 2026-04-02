// REGISTRO DEL SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error al registrar SW', err));
    });
}

let inventario = JSON.parse(localStorage.getItem('stock_data')) || [];
let cajaTotal = parseFloat(localStorage.getItem('stock_caja')) || 0;
let gananciaReal = parseFloat(localStorage.getItem('stock_ganancia_real')) || 0;

window.onload = () => actualizarInterfaz();

function guardarYActualizar() {
    localStorage.setItem('stock_data', JSON.stringify(inventario));
    localStorage.setItem('stock_caja', cajaTotal);
    localStorage.setItem('stock_ganancia_real', gananciaReal);
    actualizarInterfaz();
}

function procesarEntrada() {
    const nombre = document.getElementById('nombreProd').value;
    const pCompra = parseFloat(document.getElementById('precioCompraTotal').value);
    const pVenta = parseFloat(document.getElementById('precioVentaFinal').value);
    const udsCaja = parseInt(document.getElementById('udsPorCaja').value) || 1;
    const numCajas = parseInt(document.getElementById('cantidadCajas').value) || 1;
    const formatoCompra = document.getElementById('formatoCompra').value;

    if (!nombre || isNaN(pCompra) || isNaN(pVenta)) {
        alert("Por favor, rellena los campos básicos.");
        return;
    }

    let stockNuevo = (formatoCompra === 'caja') ? numCajas * udsCaja : 1;
    
    inventario.push({
        nombre: nombre,
        precioCompra: pCompra / (formatoCompra === 'caja' ? udsCaja : 1),
        precioVenta: pVenta,
        stock: stockNuevo
    });

    guardarYActualizar();
    resetearFormulario();
}

function actualizarInterfaz() {
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = "";
    let inversionTotal = 0;

    inventario.forEach((prod, i) => {
        inversionTotal += (prod.precioCompra * prod.stock);
        lista.innerHTML += `
            <div class="gasto-item">
                <div>
                    <strong>${prod.nombre}</strong><br>
                    <small>Stock: ${prod.stock} | PVP: ${prod.precioVenta.toFixed(2)}€</small>
                </div>
                <div class="counter">
                    <button onclick="modificarStock(${i}, -1)">-</button>
                    <span>${prod.stock}</span>
                    <button onclick="modificarStock(${i}, 1)">+</button>
                </div>
            </div>`;
    });

    document.getElementById('valorTotal').textContent = inversionTotal.toFixed(2);
    document.getElementById('cajaActual').textContent = cajaTotal.toFixed(2);
    document.getElementById('gananciaReal').textContent = gananciaReal.toFixed(2);
    document.getElementById('totalArticulos').textContent = inventario.length;
}

function modificarStock(index, cambio) {
    if (cambio > 0) {
        inventario[index].stock += cambio;
    } else if (cambio < 0 && inventario[index].stock > 0) {
        inventario[index].stock += cambio;
        // Si reduce stock, simulamos una venta
        cajaTotal += inventario[index].precioVenta;
        gananciaReal += (inventario[index].precioVenta - inventario[index].precioCompra);
    }
    guardarYActualizar();
}

function filtrarProductos() {
    const filtro = document.getElementById('buscador').value.toLowerCase();
    document.querySelectorAll('.gasto-item').forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(filtro) ? 'flex' : 'none';
    });
}

function resetearFormulario() {
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function toggleLogicaCompra() {
    const esCaja = document.getElementById('formatoCompra').value === 'caja';
    document.getElementById('seccionCaja').style.display = esCaja ? 'block' : 'none';
}

function limpiarInventario() {
    if (confirm("¿Vaciar todo el sistema?")) {
        localStorage.clear();
        location.reload();
    }
}