// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

(function(){
  const BUY_TIMEOUT = 7000; // ms

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('cashier-overlay');
    const categoryTabs = document.getElementById('category-tabs'); 
    const itemsEl = document.getElementById('items-list');
    const cartBody = document.querySelector('#cart-table tbody');
    const totalItems = document.getElementById('total-items');
    const totalPrice = document.getElementById('total-price');
    const sentBtn = document.getElementById('sent-button');
    const closeBtn = document.getElementById('close-button');
    const recipientInput = document.getElementById('recipient-input');

    const orderList = document.getElementById('order-list');

    if (!overlay || !itemsEl || !cartBody || !totalItems || !totalPrice || !sentBtn || !closeBtn || !orderList || !categoryTabs || !recipientInput) {
      console.error('[shop NUI] ❌ Missing HTML element(s). Required: cashier-overlay, category-tabs, items-list, cart-table tbody, total-items, total-price, sent-button, close-button, recipient-input, order-list');
      return;
    }

    orderList.style.maxHeight = '100vh';
    orderList.style.overflowY = 'auto';
    orderList.style.padding = '8px';
    orderList.style.display = 'flex';
    orderList.style.flexDirection = 'column';
    orderList.style.gap = '12px';

    let cart = [];
    let shopItems = [];  
    let categories = []; 
    let activeCategory = null;
    let currentMode = 'cashier';

    // ---------------------------
    // UI utils
    // ---------------------------
  function setOrderHighlight(wrapper, status) {
    wrapper.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.01), rgba(0,0,0,0.04))';
    wrapper.style.border = '1px solid rgba(255,255,255,0.03)';
    wrapper.style.boxShadow = '0 6px 18px rgba(0,0,0,0.45)';
    wrapper.style.transition = 'all 220ms ease';
    wrapper.style.borderLeft = '';

    const red = 'rgba(200,18,36,0.98)';
    const yellow = 'rgba(255,199,44,0.95)';
    const green = 'rgba(76,175,80,0.95)';
    const grey = 'rgba(170,170,170,0.9)';

    if (!status || status === 'waiting' || status === 'new' || status === 'local') {
      wrapper.style.borderLeft = '6px solid ' + red;
      wrapper.style.background = 'linear-gradient(90deg, rgba(200,18,36,0.06), rgba(255,255,255,0.01))';
    } else if (status === 'completed') {
      wrapper.style.borderLeft = '6px solid ' + yellow;
      wrapper.style.background = 'linear-gradient(90deg, rgba(255,199,44,0.06), rgba(255,255,255,0.01))';
    } else if (status === 'delivered' || status === 'received') {
      wrapper.style.borderLeft = '6px solid ' + green;
      wrapper.style.background = 'linear-gradient(90deg, rgba(76,175,80,0.05), rgba(255,255,255,0.01))';
    } else if (status === 'failed') {
      wrapper.style.borderLeft = '6px solid ' + grey;
      wrapper.style.background = 'linear-gradient(90deg, rgba(170,170,170,0.03), rgba(255,255,255,0.01))';
    }
    try { wrapper.setAttribute('data-status', status || 'waiting'); } catch(e){}
    }

  function safeHideUI(){
    overlay.classList.add('hidden');
    cart = [];
    renderCart();
    sentBtn.disabled = false;
    sentBtn.textContent = 'ส่งออเดอร์';
    document.getElementById('cashier').classList.remove('active');
    document.getElementById('board').classList.remove('active');

  }

  function buildCategoryTabs(list, iconsMap) {
  categories = Array.isArray(list) ? list.slice() : [];
  categoryTabs.innerHTML = '';
  if (!Array.isArray(categories) || categories.length === 0) return;

  categories.forEach((c, idx) => {
    const id = c.id || c;
    const label = c.label || c.id || id;
    const iconFromObj = (c && c.icon) ? c.icon : null;
    const btn = document.createElement('button');
    btn.className = 'cat';
    btn.dataset.cat = id;
    btn.title = label; 

    const img = document.createElement('img');

    if (iconFromObj && typeof iconFromObj === 'string' && iconFromObj.trim() !== '') {
      img.src = iconFromObj;
    } else if (iconsMap && iconsMap[id]) {
      img.src = iconsMap[id];
    } else {
      img.src = 'images/ic-' + id + '.png';
    }

    img.onerror = function(){
      try {
        if (!this._triedAlt) {
          this._triedAlt = true;
          this.src = 'images/ic_' + id + '.png';
        } else {
          this.src = 'images/ic-default.png';
        }
      } catch(e) { this.src = 'images/ic-default.png'; }
    };

    img.style.width = '36px';
    img.style.height = '36px';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.margin = '0 auto';

    btn.appendChild(img);

    try { btn.setAttribute('aria-label', label); } catch(e){}

    btn.addEventListener('click', () => {
      setActiveCategory(id);
    });

    categoryTabs.appendChild(btn);
    if (idx === 0) btn.classList.add('active');
  });
}

    function setActiveCategory(cat) {
      activeCategory = cat;
      Array.from(categoryTabs.querySelectorAll('.cat')).forEach(btn => {
        const bcat = btn.dataset.cat || '';
        if (bcat === cat) btn.classList.add('active'); else btn.classList.remove('active');
      });
      renderItemsForActiveCategory();
    }

    function renderItemsForActiveCategory() {
      itemsEl.innerHTML = '';
      if (!Array.isArray(shopItems) || shopItems.length === 0) {
        itemsEl.innerHTML = '<div style="opacity:.7;padding:14px;">ไม่มีสินค้าในร้าน</div>';
        return;
      }
      const filtered = shopItems.filter(it => {
        if (!activeCategory || activeCategory === 'all') return true;
        if (Array.isArray(it.categories)) return it.categories.includes(activeCategory);
        if (typeof it.category === 'string') return it.category === activeCategory;
        return true;
      });
      if (filtered.length === 0) {
        itemsEl.innerHTML = '<div style="opacity:.7;padding:14px;">ไม่มีสินค้าในหมวดนี้</div>';
        return;
      }

      const grid = document.createElement('div');
      grid.className = 'items-grid';
      filtered.forEach(it => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.key = it.key || it.id || it.name;
        card.dataset.cat = it.category || (Array.isArray(it.categories) ? it.categories[0] : '');

        const img = document.createElement('img');
        img.className = 'thumb';

        const id = it.key || it.id || it.name;
        let primary = null;
        if (it.images && typeof it.images === 'string' && it.images.trim() !== '') {
          primary = it.images;
        } else if (it.image && typeof it.image === 'string' && it.image.trim() !== '') {
          primary = it.image;
        } else {
          primary = `nui://qb-inventory/html/images/items/${id}.png`;
        }

        const localPath = `images/items/${id}.png`;

        img.src = primary;
        img.onerror = function tryFallback() {
          try { this.onerror = null; } catch(e){}
          if (typeof primary === 'string' && primary.startsWith('nui://')) {
            this.src = localPath;
            this.onerror = function(){ this.onerror = null; this.src = 'images/default.png'; };
          } else if (primary === localPath) {
            this.src = 'images/default.png';
          } else {
            this.src = localPath;
            this.onerror = function(){ this.onerror = null; this.src = 'images/default.png'; };
          }
        };

        card.appendChild(img);

        const lbl = document.createElement('div');
        lbl.className = 'item-label';
        lbl.textContent = it.label || it.name || it.id || it.key;
        card.appendChild(lbl);

        const controls = document.createElement('div');
        controls.className = 'item-controls';
        controls.style.marginTop = '6px';
        controls.style.display = 'flex';
        controls.style.gap = '6px';
        controls.style.justifyContent = 'center';
        const minus = document.createElement('button');
        minus.className = 'btn-remove';
        minus.textContent = '-';
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.className = 'item-qty';
        qtyInput.value = '1';
        qtyInput.min = '1';
        qtyInput.style.width = '44px';
        const plus = document.createElement('button');
        plus.className = 'btn-add';
        plus.textContent = '+';

        minus.addEventListener('click', () => {
          const qty = Math.max(1, Math.floor(Number(qtyInput.value) || 1));
          removeToCart(it, qty);
        });
        plus.addEventListener('click', () => {
          const qty = Math.max(1, Math.floor(Number(qtyInput.value) || 1));
          addToCart(it, qty);
        });

        controls.appendChild(minus);
        controls.appendChild(qtyInput);
        controls.appendChild(plus);
        card.appendChild(controls);

        grid.appendChild(card);
      });
      itemsEl.appendChild(grid);
    }

    // ---------------------------
    // Cart functions
    // ---------------------------
    function addToCart(item, qty){
      qty = Math.max(1, Math.floor(Number(qty) || 1));
      const key = item.key || item.id || item.name;
      const existing = cart.find(c => c.key === key);
      if (existing) existing.amount += qty;
      else cart.push({ key, label: item.label || item.name || key, price: Number(item.price || item.price === 0 ? item.price : (item.price || 0)), amount: qty });
      renderCart();
    }

    function removeToCart(item, qty){
      qty = Math.max(1, Math.floor(Number(qty) || 1));
      const key = item.key || item.id || item.name;
      const idx = cart.findIndex(c => c.key === key);
      if (idx === -1) return;
      const existing = cart[idx];
      if (existing.amount > qty) existing.amount -= qty;
      else cart.splice(idx, 1);
      renderCart();
    }

    function removeItem(key){
      cart = cart.filter(c => c.key !== key);
      renderCart();
    }

    function clearCart(){
      cart = [];
      renderCart();
    }

    function renderCart(){
      cartBody.innerHTML = '';
      let total = 0, count = 0;
      cart.forEach(it => {
        total += (Number(it.price || 0) * it.amount);
        count += it.amount;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${it.label}</td>
          <td>${it.amount}</td>
          <td>$${(Number(it.price || 0) * it.amount).toFixed(2)}</td>
          <td><button class="btn-remove">✖</button></td>
        `;
        tr.querySelector('.btn-remove').addEventListener('click', () => removeItem(it.key));
        cartBody.appendChild(tr);
      });

      totalItems.textContent = `${count} รายการ`;
      totalPrice.textContent = `รวม: $${total.toFixed(2)}`;
    }

    // -------------------------------
    // Board functions
    // -------------------------------
    function formatTimestamp(ts) {
      if (!ts) return '';
      const d = new Date(ts * 1000);
      return d.toLocaleString();
    }

    function createOrderId() {
      return 'order_' + Date.now() + '_' + Math.floor(Math.random()*9000 + 1000);
    }

    function computeOrderTotal(cartItems) {
      if (!Array.isArray(cartItems)) return 0;
      return cartItems.reduce((sum, it) => {
        const price = Number(it.price || 0);
        const qty = Number(it.amount || 0);
        return sum + (price * qty);
      }, 0);
    }

    function appendOrdersToBoard(cartItems, opts = {}) {
      if (!Array.isArray(cartItems) || cartItems.length === 0) return;

      const orderId = opts.orderId || createOrderId();
      const orderNumber = opts.number || null;
      const orderTime = opts.ts || null;

      const existing = document.querySelector(`.board-entry[data-order-id="${orderId}"]`);
      if (existing) {
        existing.dataset.cart = JSON.stringify(cartItems);
        const itemsEl = existing.querySelector('.board-items');
        if (itemsEl) {
          itemsEl.innerHTML = '';
          cartItems.forEach(it => {
            const row = document.createElement('div');
            row.className = 'board-item';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '14px';
            row.innerHTML = `<span>${it.label || it.key}</span><span style="opacity:.9">x${it.amount || 1}</span>`;
            itemsEl.appendChild(row);
          });
        }
        const tsEl = existing.querySelector('.order-ts');
        if (tsEl) tsEl.textContent = formatTimestamp(orderTime || Math.floor(Date.now()/1000));
        const totalVal = computeOrderTotal(cartItems);
        let totalEl = existing.querySelector('.order-total');
        if (!totalEl) {
          totalEl = document.createElement('div');
          totalEl.className = 'order-total';
          totalEl.style.fontSize = '14px';
          totalEl.style.fontWeight = '600';
          totalEl.style.marginTop = '6px';
          existing.appendChild(totalEl);
        }
        totalEl.textContent = `ราคารวม: $${Number(totalVal).toFixed(2)}`;
        if (opts.status) setOrderHighlight(existing, opts.status);
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'board-entry';
      wrapper.dataset.orderId = orderId;
      wrapper.dataset.cart = JSON.stringify(cartItems);
      wrapper.style.padding = '10px';
      wrapper.style.borderRadius = '10px';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = '8px';

      const head = document.createElement('div');
      head.style.display = 'flex';
      head.style.justifyContent = 'space-between';
      head.style.alignItems = 'center';

      const title = document.createElement('div');
      title.innerHTML = `<strong>ออเดอร์ ${orderNumber ? ('#' + orderNumber) : ''}</strong><div class="order-ts" style="font-size:12px;color:#ccc">${formatTimestamp(orderTime)}</div>`;
      head.appendChild(title);

      const sender = document.createElement('div');
      sender.style.fontSize = '12px';
      sender.style.color = '#ddd';
      if (opts.sender) sender.textContent = 'จาก: ' + opts.sender;
      head.appendChild(sender);

      wrapper.appendChild(head);

      const list = document.createElement('div');
      list.className = 'board-items';
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.gap = '6px';

      cartItems.forEach(it => {
        const row = document.createElement('div');
        row.className = 'board-item';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = '14px';
        row.innerHTML = `<span>${it.label || it.key}</span><span style="opacity:.9">x${it.amount || 1}</span>`;
        list.appendChild(row);
      });

      wrapper.appendChild(list);

      const totalValue = computeOrderTotal(cartItems);
      const totalEl = document.createElement('div');
      totalEl.className = 'order-total';
      totalEl.style.fontSize = '14px';
      totalEl.style.fontWeight = '600';
      totalEl.style.marginTop = '6px';
      totalEl.textContent = `ราคารวม: $${Number(totalValue).toFixed(2)}`;
      wrapper.appendChild(totalEl);

      const meta = document.createElement('div');
      meta.style.display = 'flex';
      meta.style.justifyContent = 'space-between';
      meta.style.alignItems = 'center';
      meta.style.gap = '8px';

      const status = document.createElement('div');
      status.className = 'board-status';
      status.textContent = 'สถานะ: ' + (opts.status ? opts.status : 'กำลังรอ');
      status.style.fontSize = '13px';
      status.style.opacity = '0.95';

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';

      const completeBtn = document.createElement('button');
      completeBtn.className = 'btn-complete';
      completeBtn.textContent = 'เสร็จสิ้น';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = 'ลบ';

      controls.appendChild(completeBtn);
      controls.appendChild(deleteBtn);

      meta.appendChild(status);
      meta.appendChild(controls);

      wrapper.appendChild(meta);

      const initialStatus = opts.status || 'waiting';
      setOrderHighlight(wrapper, initialStatus);

      orderList.prepend(wrapper);

      completeBtn.addEventListener('click', () => {
        if (completeBtn.disabled) return;
        let payloadCart = [];
        try { payloadCart = JSON.parse(wrapper.dataset.cart || '[]'); } catch(e) { payloadCart = cartItems || []; }
        if (!Array.isArray(payloadCart) || payloadCart.length === 0) {
          flashMessage('⚠️ ไม่มีรายการในออเดอร์นี้');
          return;
        }
        status.textContent = 'สถานะ: กำลังหักวัตถุดิบจากผู้กด...';
        completeBtn.disabled = true;
        completeBtn.textContent = 'กำลังประมวลผล...';
        try {
          const payload = { orderId: wrapper.dataset.orderId, cart: payloadCart };
          fetch(`https://${GetParentResourceName()}/orderComplete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(()=> {
            setOrderHighlight(wrapper, 'completed');
            status.textContent = 'สถานะ: พร้อมรับ';
            flashMessage('📦 ส่งออเดอร์เรียบร้อย');
          }).catch(err => {
            console.error('orderComplete error', err);
            status.textContent = 'สถานะ: เกิดข้อผิดพลาด';
            completeBtn.disabled = false;
            completeBtn.textContent = 'เสร็จสิ้น';
            flashMessage('❌ เรียกหักวัตถุดิบล้มเหลว');
          });
        } catch (e) {
          console.error('orderComplete exception', e);
          status.textContent = 'สถานะ: เกิดข้อผิดพลาด';
          completeBtn.disabled = false;
          completeBtn.textContent = 'เสร็จสิ้น';
          flashMessage('ส่งข้อมูลล้มเหลว');
        }
      });

      deleteBtn.addEventListener('click', () => {
        try {
          fetch(`https://${GetParentResourceName()}/orderDelete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: wrapper.dataset.orderId })
          }).catch(()=>{});
        } catch(e) { console.warn('orderDelete send failed', e); }
        wrapper.remove();
      });
    }

    // ---------------------------
    // sendOrder 
    // ---------------------------
    sentBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        flashMessage('❗ ไม่มีออเดอร์');
        return;
      }
      sentBtn.disabled = true;
      sentBtn.textContent = 'กำลังส่งออเดอร์...';

      const clientId = 'client_' + Date.now() + '_' + Math.floor(Math.random()*9000 + 1000);
      const senderName = (recipientInput && recipientInput.value && recipientInput.value.trim().length > 0) ? recipientInput.value.trim() : null;

      appendOrdersToBoard(cart, { orderId: clientId, local: true, status: 'waiting', sender: senderName, ts: Math.floor(Date.now()/1000) });

      const payload = { cart, clientId, sender: senderName };
      clearCart();
      flashMessage('✅ ส่งออเดอร์ไปยังบอร์ดแล้ว');

      try {
        fetch(`https://${GetParentResourceName()}/sendOrder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('[shop NUI] sendOrder fetch failed:', err));
      } catch (e) {
        console.error('[shop NUI] sendOrder exception:', e);
      } finally {
        sentBtn.disabled = false;
        sentBtn.textContent = 'ส่งออเดอร์';
      }
    });

    closeBtn.addEventListener('click', () => {
      safeHideUI();
      try { fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' }).catch(()=>{}); } catch(e){}
    });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeBtn.click(); });

    function flashMessage(text){
      let container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.style.position = 'fixed';
        container.style.right = '16px';
        container.style.bottom = '16px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }
      const t = document.createElement('div');
      t.className = 'toast-item';
      t.textContent = text;
      t.style.background = 'rgba(0,0,0,0.6)';
      t.style.color = '#fff';
      t.style.padding = '8px 10px';
      t.style.marginTop = '6px';
      t.style.borderRadius = '6px';
      container.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }

    window.addEventListener('message', (ev) => {
      const d = ev.data;
      if (!d) return;

      if (d.action === 'open') {
        const mode = d.mode || 'cashier';
        currentMode = mode;
        const showBoard = !!d.showBoard;
        const incomingItems = Array.isArray(d.items) ? d.items : (Array.isArray(d.orderItem) ? d.orderItem : []);
        shopItems = incomingItems.map(it => {
          const k = it.key || it.id || it.name;
          return {
            key: k,
            id: k,
            label: it.label || it.label || k,
            price: Number(it.price || it.amount || 0),
            category: it.category || it.cat || it.categoryId || (it.categories && it.categories[0]) || 'burger',
            images: it.images || it.image || (`images/items/${k}.png`),
            localImage: it.localImage || (`images/items/${k}.png`),
            raw: it
          };
        });

        const iconsMap = (d.categoryIcons && typeof d.categoryIcons === 'object') ? d.categoryIcons : null;
        if (Array.isArray(d.categories) && d.categories.length > 0) {
          buildCategoryTabs(d.categories, iconsMap);
        } else {
          const seen = {};
          const cats = [];
          shopItems.forEach(it => {
            const c = it.category || 'other';
            if (!seen[c]) { seen[c] = true; cats.push({ id: c, label: (c.charAt(0).toUpperCase()+c.slice(1)) }); }
          });
          if (!cats.find(x => x.id === 'all')) cats.unshift({ id: 'all', label: 'All' });
          buildCategoryTabs(cats, iconsMap);
        }
        const firstBtn = categoryTabs.querySelector('.cat');
        const defaultCat = firstBtn ? (firstBtn.dataset.cat || 'all') : 'all';
        setActiveCategory(defaultCat);
        if (mode === 'board') {
          document.getElementById('cashier').classList.remove('active');
          document.getElementById('board').classList.add('active');
          sentBtn.style.display = 'none';
          const left = document.querySelector('.left-col');
          const center = document.querySelector('.center-panel');
          if (left) left.style.display = 'none';
          if (center) center.style.display = 'none';
          overlay.classList.remove('hidden');
        } else {
          document.getElementById('cashier').classList.add('active');
          document.getElementById('board').classList.add('active');
          sentBtn.style.display = '';
          const left = document.querySelector('.left-col');
          const center = document.querySelector('.center-panel');
          if (left) left.style.display = '';
          if (center) center.style.display = '';
          overlay.classList.remove('hidden');
        }
        return;
      }
      if (d.action === 'showsection') {
        document.querySelectorAll('.left-column,.right-column').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(d.section);
        if (target) target.classList.add('active');
        return;
      }
      if (d.action === 'close') { safeHideUI(); return; }
      else if (d.action === 'newOrder' && d.order) {
  const orderObj = d.order;
  let localEl = null;
  if (orderObj.id) {
    localEl = document.querySelector(`.board-entry[data-order-id="${orderObj.id}"]`);
  }
  if (!localEl && orderObj.clientId) {
    localEl = document.querySelector(`.board-entry[data-order-id="${orderObj.clientId}"]`);
  }

  if (localEl) {
    localEl.dataset.cart = JSON.stringify(orderObj.cart || []);
    const titleEl = localEl.querySelector('strong');
    if (titleEl && orderObj.number) titleEl.textContent = `ออเดอร์ #${orderObj.number}`;
    const tsEl = localEl.querySelector('.order-ts');
    if (tsEl) tsEl.textContent = new Date((orderObj.time || Math.floor(Date.now()/1000)) * 1000).toLocaleString();
    const senderEl = localEl.querySelector('.order-sender');
    if (senderEl) senderEl.textContent = orderObj.sender ? ('จาก: ' + orderObj.sender) : '';
    const itemsEl = localEl.querySelector('.board-items');
    if (itemsEl) {
      itemsEl.innerHTML = '';
      (orderObj.cart || []).forEach(it => {
        const row = document.createElement('div');
        row.className = 'board-item';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = '14px';
        row.innerHTML = `<span>${it.label || it.key}</span><span style="opacity:.9">x${it.amount || 1}</span>`;
        itemsEl.appendChild(row);
      });
    }
    const totalVal = computeOrderTotal(orderObj.cart || []);
    let totEl = localEl.querySelector('.order-total');
    if (!totEl) {
      totEl = document.createElement('div');
      totEl.className = 'order-total';
      totEl.style.fontSize = '14px';
      totEl.style.fontWeight = '600';
      totEl.style.marginTop = '6px';
      localEl.appendChild(totEl);
    }
    totEl.textContent = `ราคารวม: $${Number(totalVal).toFixed(2)}`;
    if (orderObj.id) {
      localEl.setAttribute('data-order-id', orderObj.id);
    }
    setOrderHighlight(localEl, orderObj.status || 'waiting');

    return;
  }
  const ts = orderObj.time || Math.floor(Date.now()/1000);
  appendOrdersToBoard(orderObj.cart, { orderId: orderObj.id, status: orderObj.status, sender: orderObj.sender, ts, number: orderObj.number, clientId: orderObj.clientId });
  return;
}
      else if (d.action === 'orderStatusUpdate') {
        const entry = document.querySelector(`[data-order-id="${d.orderId}"]`);
        if (!entry) return;
        const st = entry.querySelector('.board-status');
        const compBtn = entry.querySelector('.btn-complete');
        const delBtn = entry.querySelector('.btn-delete');

        if (d.status === 'completed') {
          entry.classList.add('completed');
          if (st) st.textContent = 'สถานะ: พร้อมรับ';
          setOrderHighlight(entry, 'completed');

          if (compBtn) {
            const newBtn = compBtn.cloneNode(true);
            compBtn.parentNode.replaceChild(newBtn, compBtn);
            newBtn.textContent = 'รับของ';
            newBtn.disabled = false;
            newBtn.onclick = function() {
              newBtn.disabled = true;
              if (st) st.textContent = 'สถานะ: กำลังรับของ...';
              try {
                fetch(`https://${GetParentResourceName()}/orderDeliver`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: d.orderId })
                }).catch(()=>{});
              } catch(e) {
                console.warn('orderDeliver error', e);
                newBtn.disabled = false;
                if (st) st.textContent = 'สถานะ: เกิดข้อผิดพลาด';
              }
            };
          }
          if (delBtn) delBtn.disabled = false;
        } else if (d.status === 'delivered') {
          entry.classList.add('completed');
          if (st) st.textContent = 'สถานะ: ส่งแล้ว';
          if (compBtn) { compBtn.disabled = true; compBtn.textContent = 'รับแล้ว'; }
          setOrderHighlight(entry, 'delivered');
        } else if (d.status === 'deleted') {
          entry.remove();
        } else if (d.status === 'failed') {
          if (st) st.textContent = 'สถานะ: ล้มเหลว' + (d.reason ? ' - ' + d.reason : '');
          if (compBtn) compBtn.disabled = false;
          if (compBtn) compBtn.textContent = 'เสร็จสิ้น';
          setOrderHighlight(entry, 'failed');
        } else if (d.status === 'waiting' || d.status === 'new') {
          setOrderHighlight(entry, 'waiting');
          if (st) st.textContent = 'สถานะ: กำลังรอ';
        }
      }
    });

    window.addEventListener('unload', () => {
      try { fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' }).catch(()=>{}); } catch(e){}
    });
  });
})();
