// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

(function(){
  const BUY_TIMEOUT = 7000; // ms

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const itemsEl = document.getElementById('items-list');
    const cartBody = document.querySelector('#cart-table tbody');
    const totalItems = document.getElementById('total-items');
    const totalPrice = document.getElementById('total-price');
    const payBtn = document.getElementById('pay-button');
    const closeBtn = document.getElementById('close-button');

    if (!overlay || !itemsEl || !cartBody || !totalItems || !totalPrice || !payBtn || !closeBtn) {
      console.error('[shop NUI] ❌ Missing HTML element(s). Please check index.html IDs.');
      return;
    }

    let cart = [];
    let shopItems = [];
    function safeHideUI(){
      overlay.classList.add('hidden');
      cart = [];
      renderCart();
      payBtn.disabled = false;
      payBtn.textContent = 'ชำระเงิน';
    }
    function openShop(data){
      shopItems = Array.isArray(data.items) ? data.items : [];
      itemsEl.innerHTML = '';
      cart = [];
      renderCart();

      if (shopItems.length === 0) {
        itemsEl.innerHTML = '<div style="opacity:.7;padding:14px;">ไม่มีสินค้าในร้าน</div>';
        overlay.classList.remove('hidden');
        return;
      }

      shopItems.forEach(it => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
        <img src="images/${it.key}.png" onerror="this.src='images/default.png'" alt="">
        <div class="item-info">
          <div class="item-name">${it.label}</div>
          <div class="item-price">$${it.price}</div>
          <div class="item-controls">
            <input type="number" class="item-qty" value="1" min="1" max="99">
            <button class="btn-add">เพิ่มลงตะกร้า</button>
          </div>
        </div>
        `;

        const qtyInput = card.querySelector('.item-qty');
        const addBtn = card.querySelector('.btn-add');
        addBtn.addEventListener('click', () => {
          const qty = Number(qtyInput.value) || 1;
          addToCart(it, qty);
        });

        itemsEl.appendChild(card);
      });

      overlay.classList.remove('hidden');
    }
    function closeShop(){
      safeHideUI();
      try {
        fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' }).catch(()=>{});
      } catch(e){
        console.warn('[shop NUI] close fetch failed:', e);
      }
    }
    function addToCart(item, qty){
      const existing = cart.find(c => c.key === item.key);
      if (existing) existing.amount += qty;
      else cart.push({ key: item.key, label: item.label, price: item.price, amount: qty });
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
        total += (it.price * it.amount);
        count += it.amount;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${it.label}</td>
          <td>${it.amount}</td>
          <td>$${it.price * it.amount}</td>
          <td><button class="btn-remove">✖</button></td>
        `;
        tr.querySelector('.btn-remove').addEventListener('click', () => removeItem(it.key));
        cartBody.appendChild(tr);
      });

      totalItems.textContent = `${count} รายการ`;
      totalPrice.textContent = `รวม: $${total}`;
    }
    payBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        flashMessage('❗ ตะกร้าว่าง');
        return;
      }
      payBtn.disabled = true;
      payBtn.textContent = 'กำลังชำระ...';

      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        payBtn.disabled = false;
        payBtn.textContent = 'ชำระเงิน';
        flashMessage('การเชื่อมต่อช้า โปรดลองอีกครั้ง');
      }, BUY_TIMEOUT);

      try {
        fetch(`https://${GetParentResourceName()}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart })
        })
        .then(res => {
          if (timedOut) return;
          clearTimeout(timeout);
          clearCart();
          payBtn.disabled = false;
          payBtn.textContent = 'ชำระเงิน';
          flashMessage('✅ ซื้อสำเร็จ');
        })
        .catch(err => {
          if (timedOut) return;
          clearTimeout(timeout);
          payBtn.disabled = false;
          payBtn.textContent = 'ชำระเงิน';
          console.error('[shop NUI] pay fetch failed:', err);
          flashMessage('⚠️ การเชื่อมต่อล้มเหลว');
        });
      } catch (e) {
        if (!timedOut) clearTimeout(timeout);
        payBtn.disabled = false;
        payBtn.textContent = 'ชำระเงิน';
        console.error('[shop NUI] pay exception:', e);
        flashMessage('เกิดข้อผิดพลาด');
      }
    });
    closeBtn.addEventListener('click', closeShop);
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeShop();
    });
    function flashMessage(text){
      const t = document.createElement('div');
      t.className = 'toast-item';
      t.textContent = text;
      const footer = document.querySelector('.shop-right') || document.body;
      footer.appendChild(t);
      setTimeout(() => t.remove(), 2500);
    }
    window.addEventListener('message', (ev) => {
      const d = ev.data;
      if (!d) return;
      if (d.action === 'open') openShop(d);
      else if (d.action === 'close') safeHideUI();
    });
    window.addEventListener('unload', () => {
      try { fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' }).catch(()=>{}); } catch(e){}
    });
  });
})();
