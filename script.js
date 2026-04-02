let inventario = JSON.parse(localStorage.getItem('stock_data')) || [];
let cajaTotal = parseFloat(localStorage.getItem('stock_caja')) || 0;
let gananciaReal = parseFloat(localStorage.getItem('stock_ganancia_real')) || 0;

window.onload = () => actualizarInterfaz();

function procesarEntrada() {
    const nombre = document.getElementById('nombreProd').value;
    const formatoCompra = document.getElementById('formatoCompra').value;
    const formatoVenta = document.getElementById('formatoVenta').value;
    const pCompra = parseFloat(document.getElementById('precioCompraTotal').value);
    const pVenta = parseFloat(document.getElementById('precioVentaFinal').value);
    const udsCaja = parseInt(document.getElementById('udsPorCaja').value) || 1;
    const numCajas = parseInt(document.getElementById('cantidadCajas').value) || 1;

    let stockFinal = 0;
    let costeUnitario = 0;
    let lote = 1;

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
            loteRecompra: lote,
            esCaja: formatoVenta === 'completa'
        });
        guardarYActualizar();
        resetearFormulario();
    }
}

function modificarStock(index, cambio) {
    const p = inventario[index];
    if (cambio === -1 && p.stock > 0) {
        cajaTotal += p.precioVenta;
        gananciaReal += (p.precioVenta - p.precioCompra);
        p.stock--;
    } else if (cambio === 1) {
        p.stock += (p.loteRecompra || 1);
    }
    guardarYActualizar();
}

function guardarYActualizar() {
    localStorage.setItem('stock_data', JSON.stringify(inventario));
    localStorage.setItem('stock_caja', cajaTotal);
    localStorage.setItem('stock_ganancia_real', gananciaReal);
    actualizarInterfaz();
}

function actualizarInterfaz() {
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = '';
    let inversionStock = 0;

    inventario.forEach((prod, i) => {
        inversionStock += (prod.stock * prod.precioCompra);
        lista.innerHTML += `
            <div class="gasto-item">
                <div class="info">
                    <strong>${prod.esCaja ? '📦' : '🛍️'} ${prod.nombre}</strong><br>
                    <small>${prod.precioVenta.toFixed(2)}€ | Lote: +${prod.loteRecompra}</small>
                </div>
                <div class="controls">
                    <div class="counter">
                        <button onclick="modificarStock(${i}, -1)">-</button>
                        <span class="${prod.stock === 0 ? 'empty' : ''}">${prod.stock}</span>
                        <button onclick="modificarStock(${i}, 1)">+</button>
                    </div>
                    <button class="delete-btn" onclick="borrarProducto(${i})">🗑️</button>
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

function borrarProducto(i) {
    if (confirm("¿Eliminar producto?")) {
        inventario.splice(i, 1);
        guardarYActualizar();
    }
}

function limpiarInventario() {
    if (confirm("¿Reiniciar todo?")) {
        localStorage.clear();
        location.reload();
    }
}

function filtrarProductos() {
    const filtro = document.getElementById('buscador').value.toLowerCase();
    document.querySelectorAll('.gasto-item').forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(filtro) ? 'flex' : 'none';
    });
}

function resetearFormulario() {
    document.getElementById('nombreProd').value = '';
    document.getElementById('precioCompraTotal').value = '';
    document.getElementById('precioVentaFinal').value = '';
    document.getElementById('udsPorCaja').value = '';
    document.getElementById('cantidadCajas').value = '';
}