// ==========================================
// NAVIGATION & SECTION MANAGEMENT
// ==========================================

function showMainSection(id) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden-section'));
    document.getElementById(`${id}-section`).classList.remove('hidden-section');
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    // Re-render chart if navigating back to product and Kas is active
    if(id === 'product' && currentSwipeIndex === 0) {
        setTimeout(renderChart, 100);
    }
}


// ==========================================
// SWIPE CARD LOGIC
// ==========================================

let currentSwipeIndex = 0;

function swipeTo(index) {
    currentSwipeIndex = index;
    
    // UI Button Updates
    document.querySelectorAll('.futuristic-tab').forEach((b, i) => {
        b.classList.toggle('active', i === index);
    });

    // Move Track
    const track = document.getElementById('product-track');
    track.style.transform = `translateX(-${index * 33.333}%)`;

    // If index is 0 (Kas), ensure chart is sized correctly after transition
    if(index === 0) {
        setTimeout(renderChart, 500); 
    }
}


// ==========================================
// KAS (CASH FLOW) LOGIC
// ==========================================

let currentBalance = 0;
let totalIncome = 0;
let totalExpense = 0;
let transactions = [];
let transType = 'income'; 
let chart;

function setTransType(type) {
    transType = type;
    document.getElementById('type-inc').classList.toggle('active', type === 'income');
    document.getElementById('type-exp').classList.toggle('active', type === 'expense');
    
    const btn = document.getElementById('btn-submit-trans');
    if(type === 'income') {
        btn.innerText = 'Catat Pemasukan';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.style.boxShadow = '0 5px 15px rgba(16,185,129,0.4)';
    } else {
        btn.innerText = 'Catat Pengeluaran';
        btn.style.background = 'linear-gradient(135deg, #f87171, #ef4444)';
        btn.style.boxShadow = '0 5px 15px rgba(239,68,68,0.4)';
    }
}

function processTransaction() {
    const amount = parseFloat(document.getElementById('trans-amount').value);
    const label = document.getElementById('trans-label').value || (transType === 'income' ? 'Pemasukan' : 'Pengeluaran');
    const cat = document.getElementById('trans-category').value;

    if (isNaN(amount) || amount <= 0) return;

    if (transType === 'income') {
        totalIncome += amount;
        currentBalance += amount;
    } else {
        totalExpense += amount;
        currentBalance -= amount;
    }

    transactions.unshift({
        id: Date.now(),
        type: transType,
        amount: amount,
        label: label,
        category: cat,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    updateKasUI();
    renderChart();
    
    document.getElementById('trans-amount').value = '';
    document.getElementById('trans-label').value = '';
}

function updateKasUI() {
    document.getElementById('total-income').innerText = `Rp ${totalIncome.toLocaleString()}`;
    document.getElementById('total-expense').innerText = `Rp ${totalExpense.toLocaleString()}`;
    document.getElementById('current-balance').innerText = `Rp ${currentBalance.toLocaleString()}`;
    
    const list = document.getElementById('transaction-list');
    if(transactions.length === 0) return;

    list.innerHTML = transactions.map(t => `
        <div class="flex justify-between items-center bg-black/10 hover:bg-black/20 transition p-3 rounded-xl border-l-4 ${t.type === 'income' ? 'border-emerald-500' : 'border-red-500'}">
            <div class="overflow-hidden">
                <p class="font-bold text-sm truncate">${t.label}</p>
                <p class="text-xs opacity-60">${t.date} • ${t.category}</p>
            </div>
            <p class="font-black text-sm whitespace-nowrap ml-2 ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}">
                ${t.type === 'income' ? '+' : '-'}Rp ${t.amount.toLocaleString()}
            </p>
        </div>
    `).join('');
}

function renderChart() {
    const canvas = document.getElementById('financeChart');
    const noData = document.getElementById('no-chart-data');

    // Prevent rendering if not on Kas tab to avoid zero-width canvas issues
    if (currentSwipeIndex !== 0) return;

    if (transactions.length === 0) {
        canvas.classList.add('hidden');
        noData.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    noData.classList.add('hidden');

    const ctx = canvas.getContext('2d');
    const labels = [...transactions].reverse().map(t => t.date);
    const dataPoints = [];
    let tempBal = 0;
    [...transactions].reverse().forEach(t => {
        tempBal += (t.type === 'income' ? t.amount : -t.amount);
        dataPoints.push(tempBal);
    });

    if (chart) chart.destroy();

    // Gradient fill for chart
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Saldo',
                data: dataPoints,
                borderColor: '#ef4444',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#ef4444',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { display: false }, 
                y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(255,255,255,0.1)' }
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
}


// ==========================================
// TARGET TABUNGAN LOGIC
// ==========================================

let goalAmount = 0;
let currentSaved = 0;

function setSavingsTarget() {
    const name = document.getElementById('target-name').value;
    const total = parseFloat(document.getElementById('target-total').value);

    if (!name || isNaN(total)) return;

    goalAmount = total;
    currentSaved = 0;
    
    document.getElementById('display-target-name').innerText = name;
    document.getElementById('savings-goal').innerText = `Rp ${total.toLocaleString()}`;
    document.getElementById('savings-current').innerText = `Rp 0`;
    document.getElementById('savings-progress-bar').style.width = '0%';
    
    const card = document.getElementById('active-target-card');
    card.classList.remove('opacity-50', 'pointer-events-none');
}

function addSavings() {
    const amt = parseFloat(document.getElementById('add-savings').value);
    if (isNaN(amt) || amt <= 0 || goalAmount === 0) return;

    currentSaved += amt;
    if (currentSaved > goalAmount) currentSaved = goalAmount;

    const progress = (currentSaved / goalAmount) * 100;
    document.getElementById('savings-progress-bar').style.width = `${progress}%`;
    document.getElementById('savings-current').innerText = `Rp ${currentSaved.toLocaleString()}`;

    if(currentSaved >= goalAmount) {
        setTimeout(() => alert("🎉 Target tabunganmu telah tercapai! Saatnya mewujudkan impianmu!"), 300);
    }
    document.getElementById('add-savings').value = '';
}


// ==========================================
// SPLIT BILL LOGIC
// ==========================================

function calculateSplitBill() {
    const bill = parseFloat(document.getElementById('sb-bill').value);
    const people = parseInt(document.getElementById('sb-people').value);
    const tax = parseFloat(document.getElementById('sb-tax').value) || 0;
    const service = parseFloat(document.getElementById('sb-service').value) || 0;
    const discount = parseFloat(document.getElementById('sb-discount').value) || 0;

    if (isNaN(bill) || isNaN(people) || people <= 0) return;

    const afterDiscount = bill - discount;
    const finalTotal = afterDiscount + (afterDiscount * (tax / 100)) + (afterDiscount * (service / 100));
    const perPerson = Math.ceil(finalTotal / people);

    const resultCard = document.getElementById('sb-result');
    resultCard.classList.remove('scale-95', 'opacity-50');
    resultCard.classList.add('scale-100', 'opacity-100');

    document.getElementById('sb-total-person').innerText = `Rp ${perPerson.toLocaleString()}`;
    document.getElementById('sb-summary-total').innerText = `Total Bill: Rp ${finalTotal.toLocaleString()}`;
}

function resetSplitBill() {
    document.querySelectorAll('#sb-bill, #sb-discount, #sb-tax, #sb-service').forEach(i => i.value = '');
    document.getElementById('sb-people').value = 1;
    
    const resultCard = document.getElementById('sb-result');
    resultCard.classList.add('scale-95', 'opacity-50');
    resultCard.classList.remove('scale-100', 'opacity-100');
    
    document.getElementById('sb-total-person').innerText = `Rp 0`;
    document.getElementById('sb-summary-total').innerText = `Total: Rp 0`;
}


// ==========================================
// THEME MANAGEMENT
// ==========================================

function toggleTheme() {
    const body = document.getElementById('app-body');
    const isDark = body.classList.contains('theme-dark');
    body.classList.toggle('theme-light', isDark);
    body.classList.toggle('theme-dark', !isDark);
    
    document.getElementById('theme-icon').innerHTML = isDark ? 
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />' : 
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
        
    // Update chart colors if chart exists
    if(chart && currentSwipeIndex === 0) {
        renderChart();
    }
}
