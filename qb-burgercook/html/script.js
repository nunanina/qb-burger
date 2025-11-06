// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// (c) 2025 NUNANINA | License: CC BY-NC-SA 4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay'), recipesEl = document.getElementById('recipes'), closeBtn = document.getElementById('closeBtn');
    const selImg = document.getElementById('sel-img'), selName = document.getElementById('sel-name'), selDesc = document.getElementById('sel-desc');
    const selIngredientsList = document.getElementById('sel-ingredients-list'), cookBtn = document.getElementById('cookBtn');
    const rightProgress = document.getElementById('right-progress'), rightBar = document.getElementById('right-progress-bar');
    const categoryButtons = Array.from(document.querySelectorAll('.cat'));
    if (!overlay || !recipesEl || !closeBtn) return console.error('[NUI] missing DOM elements');

    let allRecipes = [], activeCategory = null, selectedRecipe = null, isCrafting = false;
    const hasRight = !!(selImg && selName && selDesc && selIngredientsList && cookBtn && rightProgress && rightBar);

    const recipeMatchesCategory = (r, cat) => !r ? false : (!cat || cat === 'all') ? true : (Array.isArray(r.categories) ? r.categories.includes(cat) : (typeof r.category === 'string' ? r.category === cat : true));
    const makeThumb = r => {
      const img = document.createElement('img'); img.className='thumb';
      const src = (r && (r.images || r.image)) ? (r.images || r.image) : `images/${r.id}.png`;
      img.src = src; img.alt = r.id || 'item'; img.onerror = () => img.src = 'images/default.png';
      return img;
    };

    function buildCard(r){
      const card = document.createElement('div'); card.className='item-card'; card.dataset.id = r.id || '';
      card.appendChild(makeThumb(r));
      const lbl = document.createElement('div'); lbl.className='item-label'; lbl.textContent = r.label || r.id || 'unknown'; card.appendChild(lbl);
      const progressWrap = document.createElement('div'); progressWrap.className='progress-wrap'; progressWrap.setAttribute('aria-hidden','true');
      const progressBar = document.createElement('div'); progressBar.className='progress-bar'; progressWrap.appendChild(progressBar); card.appendChild(progressWrap);
      card.addEventListener('click', () => selectRecipe(r, card));
      return card;
    }

    function showEmpty(text){ recipesEl.innerHTML = ''; const p = document.createElement('div'); p.className='empty-placeholder'; p.style.padding='18px'; p.textContent = text || 'ไม่มีเมนูในหมวดนี้'; recipesEl.appendChild(p); }

    function render(cat){
      recipesEl.innerHTML = '';
      const list = (allRecipes||[]).filter(r => recipeMatchesCategory(r, cat));
      if (!list.length) { showEmpty('ไม่มีเมนูในหมวดนี้'); selectedRecipe = null; resetRight(); return; }
      list.forEach((r, i) => { const card = buildCard(r); recipesEl.appendChild(card); if (i===0) setTimeout(()=>selectRecipe(r, card),0); });
    }

    function setActiveCategory(cat){
      activeCategory = cat;
      categoryButtons.forEach(b => b.classList.toggle('active', (b.dataset.cat||'')===cat));
      render(cat);
    }
    categoryButtons.forEach(btn => btn.addEventListener('click', ()=> setActiveCategory(btn.dataset.cat || 'all')));

    function openUI(recipes){
      allRecipes = Array.isArray(recipes) ? recipes.slice() : [];
      overlay.classList.remove('hidden'); window.focus();
      if (!allRecipes.length) return showEmpty('ไม่มีเมนูให้แสดง — โปรดตรวจสอบ Config.Recipes หรือ RecipeOrder');
      const defaultCat = (categoryButtons[0] && categoryButtons[0].dataset.cat) ? categoryButtons[0].dataset.cat : 'all';
      setActiveCategory(defaultCat);
    }

    function closeUI(){ if (isCrafting) return; overlay.classList.add('hidden'); try{ if (typeof GetParentResourceName === 'function') fetch(`https://${GetParentResourceName()}/close`, {method:'POST'}).catch(()=>{}); }catch(e){} resetRight(); isCrafting=false; }

    closeBtn.addEventListener('click', closeUI);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeUI(); });

    function resetRight(){
      if (!hasRight) return;
      cookBtn.disabled = true; rightProgress.style.display = 'none'; rightBar.style.transition = ''; rightBar.style.width='0%';
      selImg.src='images/default.png'; selName.textContent='เลือกเมนู'; selDesc.textContent='คลิกที่เมนูทางซ้ายเพื่อดูส่วนผสม'; selIngredientsList.innerHTML='';
    }

    function selectRecipe(recipe, cardEl){
      if (!recipe) return;
      selectedRecipe = recipe;
      document.querySelectorAll('.item-card').forEach(c => c.classList.remove('highlight'));
      if (cardEl) cardEl.classList.add('highlight');
      if (!hasRight) return;
      const imgCandidate = (recipe.images || recipe.image) ? (recipe.images || recipe.image) : `images/${recipe.id}.png`;
      selImg.src = imgCandidate; selImg.onerror = () => selImg.src = 'images/default.png';
      selName.textContent = recipe.label || recipe.id || 'unknown';
      selDesc.textContent = recipe.description || (`เวลา: ${Math.round((recipe.time||0)/1000)}s`);
      selIngredientsList.innerHTML = '';
      if (recipe.ingredients && typeof recipe.ingredients === 'object') {
        for (const k in recipe.ingredients) if (Object.prototype.hasOwnProperty.call(recipe.ingredients,k)) {
          const li = document.createElement('li'); li.textContent = `${recipe.ingredients[k]}x ${k}`; selIngredientsList.appendChild(li);
        }
      } else {
        const li = document.createElement('li'); li.textContent = 'ไม่มีข้อมูลส่วนผสม'; selIngredientsList.appendChild(li);
      }
      cookBtn.disabled = false; cookBtn.textContent = 'ทำอาหาร';
    }

    if (hasRight) cookBtn.addEventListener('click', ()=> { if (isCrafting || !selectedRecipe) return; startCook(selectedRecipe); });

    function startCook(recipe){
      isCrafting = true; cookBtn.disabled = true; cookBtn.textContent = 'กำลังทำ...';
      const time = Math.max(100, Number(recipe.time || 8000));
      rightProgress.style.display = 'block'; rightProgress.setAttribute('aria-hidden','false');
      rightBar.style.transition = `width ${time}ms linear`; rightBar.style.width='0%'; void rightBar.offsetWidth; rightBar.style.width='100%';

      try {
        if (typeof GetParentResourceName === 'function') {
          fetch(`https://${GetParentResourceName()}/cook`, {
            method:'POST', headers:{ 'Content-Type':'application/json; charset=UTF-8' },
            body: JSON.stringify({ recipeId: recipe.id })
          }).catch(()=> resetCraftUI());
        } else {
          setTimeout(()=> { resetCraftUI(); flash('✅ (simulated) ทำอาหารสำเร็จ!') }, time);
        }
      } catch(e){ console.error(e); resetCraftUI(); }
    }

    function resetCraftUI(){
      isCrafting = false; if (!hasRight) return;
      cookBtn.disabled = false; cookBtn.textContent = 'ทำอาหาร'; rightBar.style.transition=''; rightBar.style.width='0%'; rightProgress.style.display='none';
    }

    window.addEventListener('message', (ev) => {
      const d = ev.data; if (!d) return;
      if (d.action === 'open') return openUI(d.recipes || []);
      if (d.action === 'close') return closeUI();
      if (d.action === 'craftStart') {
        const time = Math.max(100, Number(d.time||8000));
        rightProgress.style.display='block'; rightBar.style.transition=`width ${time}ms linear`; rightBar.style.width='0%'; void rightBar.offsetWidth; rightBar.style.width='100%';
        return;
      }
      if (d.action === 'craftDone') { resetCraftUI(); flash('✅ ทำอาหารสำเร็จ!'); return; }
      if (d.action === 'craftCancel') { resetCraftUI(); flash('ยกเลิกการทำอาหาร'); return; }
    });

    function flash(text){ const t = document.createElement('div'); t.className='toast-item'; t.textContent = text; const footer = document.querySelector('.modal-foot') || document.body; footer.appendChild(t); setTimeout(()=>t.remove(),2500); }

    window.addEventListener('unload', ()=> { try{ if (typeof GetParentResourceName === 'function') fetch(`https://${GetParentResourceName()}/close`, { method: 'POST' }).catch(()=>{}); }catch(e){} });
  });
})();
