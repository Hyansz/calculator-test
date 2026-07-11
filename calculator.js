class Calculator {
    constructor() {
        this.materialGrades = MaterialGrade.getDefaults();
        this.cltLayup = new CLTLayupType();
        this.currentMethod = 'shear-analogy';
        this.layerCount = 5;
        this.layerThickness = 35;
        this.beff = 1000;
        this.lengthM = 5;
        this.selectedGrade = this.materialGrades[0];
        this.layerOrientations = [];
        this._initOrientations();
    }

    _initOrientations() {
        this.layerOrientations = [];
        for (let i = 0; i < this.layerCount; i++) {
            this.layerOrientations.push(i % 2 === 0 ? 0 : 90);
        }
    }

    setMethod(method) {
        this.currentMethod = method;
        if (method === 'gamma' && this.layerCount !== 3 && this.layerCount !== 5) {
            this.layerCount = 5;
            this._initOrientations();
        }
        this._buildLayup();
    }

    setLayerCount(count) {
        this.layerCount = count;
        this._initOrientations();
        this._buildLayup();
    }

    setThickness(thickness) {
        this.layerThickness = thickness;
        this._buildLayup();
    }

    setGrade(gradeName) {
        this.selectedGrade = this.materialGrades.find(g => g.name === gradeName);
        this._buildLayup();
    }

    setOrientation(index, orientation) {
        this.layerOrientations[index] = orientation;
        this._buildLayup();
    }

    setBeff(val) {
        this.beff = val;
    }

    setLength(val) {
        this.lengthM = val;
    }

    _buildLayup() {
        this.cltLayup = new CLTLayupType();
        for (let i = 0; i < this.layerCount; i++) {
            const orientation = this.layerOrientations[i] !== undefined
                ? this.layerOrientations[i]
                : (i % 2 === 0 ? 0 : 90);
            const layer = new CLTLayerType(this.layerThickness, this.selectedGrade, orientation);
            this.cltLayup.addLayer(layer);
        }
    }

    calculate() {
        this._buildLayup();

        if (this.currentMethod === 'shear-analogy') {
            const method = new ShearAnalogyMethod();
            return method.calculate(this.cltLayup, this.beff);
        } else {
            const method = new GammaMethod();
            return method.calculate(this.cltLayup, this.beff, this.lengthM);
        }
    }
}

let calculator = new Calculator();

function initUI() {
    renderGradeOptions();
    renderLayerCountOptions();
    renderMethodOptions();
    renderInputTable();
    calculate();
}

function renderGradeOptions() {
    const select = document.getElementById('gradeSelect');
    select.innerHTML = '';
    calculator.materialGrades.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.name;
        opt.textContent = g.name;
        select.appendChild(opt);
    });
    select.value = calculator.selectedGrade.name;
}

function renderLayerCountOptions() {
    const select = document.getElementById('layerCountSelect');
    select.innerHTML = '';
    for (let i = 3; i <= 9; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        select.appendChild(opt);
    }
    select.value = calculator.layerCount;
}

function renderMethodOptions() {
    document.querySelectorAll('input[name="method"]').forEach(radio => {
        radio.checked = radio.value === calculator.currentMethod;
    });
    updateLayerCountConstraints();
}

function updateLayerCountConstraints() {
    const select = document.getElementById('layerCountSelect');
    if (calculator.currentMethod === 'gamma') {
        for (const opt of select.options) {
            opt.disabled = opt.value !== '3' && opt.value !== '5';
        }
        if (calculator.layerCount !== 3 && calculator.layerCount !== 5) {
            select.value = '5';
            calculator.setLayerCount(5);
        }
    } else {
        for (const opt of select.options) {
            opt.disabled = false;
        }
    }
}

function renderInputTable() {
    const tbody = document.getElementById('layerTableBody');
    const countLabel = document.getElementById('layerCountLabel');
    tbody.innerHTML = '';
    if (countLabel) countLabel.textContent = calculator.layerCount + ' layers';

    const tdCls = 'px-3 py-2.5 text-[13px] font-medium text-gray-600 border-b border-gray-50 last:border-b-0';

    for (let i = 0; i < calculator.layerCount; i++) {
        const orientation = calculator.layerOrientations[i] !== undefined
            ? calculator.layerOrientations[i]
            : (i % 2 === 0 ? 0 : 90);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-wood-50/50 transition-colors';
        tr.innerHTML = `
            <td class="${tdCls}"><span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-wood-50 text-wood-700 text-xs font-bold">${'T' + (i + 1)}</span></td>
            <td class="${tdCls}"><input type="number" value="${calculator.layerThickness}" min="1" onchange="onThicknessChange(this.value)" class="w-full px-2.5 py-2 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 bg-gray-50 outline-none transition-all hover:border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:bg-white" /></td>
            <td class="${tdCls}"><select onchange="onGradeChange(this.value)" class="w-full px-2.5 py-2 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 bg-gray-50 outline-none transition-all hover:border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:bg-white">
                ${calculator.materialGrades.map(g => `<option value="${g.name}" ${g.name === calculator.selectedGrade.name ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select></td>
            <td class="${tdCls}">
                <div class="inline-flex rounded-lg overflow-hidden">
                    <input type="radio" class="sr-only" name="orient_${i}" id="orient_${i}_0" value="0" ${orientation === 0 ? 'checked' : ''} onchange="onOrientationChange(${i}, 0)" />
                    <label for="orient_${i}_0" class="px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer border border-gray-200 text-gray-400 bg-gray-50 select-none first:rounded-l-lg last:rounded-r-lg last:border-l-0 transition-all">0&deg;</label>
                    <input type="radio" class="sr-only" name="orient_${i}" id="orient_${i}_90" value="90" ${orientation === 90 ? 'checked' : ''} onchange="onOrientationChange(${i}, 90)" />
                    <label for="orient_${i}_90" class="px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer border border-gray-200 text-gray-400 bg-gray-50 select-none first:rounded-l-lg last:rounded-r-lg last:border-l-0 transition-all">90&deg;</label>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

function onMethodChange(method) {
    calculator.setMethod(method);
    updateLayerCountConstraints();
    renderInputTable();
    calculate();
}

function onLayerCountChange(count) {
    calculator.setLayerCount(parseInt(count));
    renderInputTable();
    calculate();
}

function onThicknessChange(val) {
    calculator.setThickness(parseFloat(val));
    calculate();
}

function onGradeChange(val) {
    calculator.setGrade(val);
    calculate();
}

function onOrientationChange(index, orientation) {
    calculator.setOrientation(index, orientation);
    calculate();
}

function onBeffChange(val) {
    calculator.setBeff(parseFloat(val));
    calculate();
}

function onLengthChange(val) {
    calculator.setLength(parseFloat(val));
    calculate();
}

function calculate() {
    const errorDiv = document.getElementById('errorMsg');
    const resultDiv = document.getElementById('resultSection');
    const shearSection = document.getElementById('shearAnalogySection');
    const gammaSection = document.getElementById('gammaSection');

    errorDiv.innerHTML = '';
    resultDiv.style.display = 'none';
    shearSection.style.display = 'none';
    gammaSection.style.display = 'none';

    try {
        const result = calculator.calculate();

        document.getElementById('totalThickness').textContent = result.totalThickness + ' mm';
        document.getElementById('eiEffValue').textContent = safeFixed(result.eiEff, 2) + ' N·mm²/m';

        renderSectionProperties(result);
        renderVisualization(result);

        if (calculator.currentMethod === 'shear-analogy') {
            shearSection.style.display = 'block';
            renderShearAnalogyTable(result);
        } else {
            gammaSection.style.display = 'block';
            renderGammaTable(result);
        }

        resultDiv.style.display = 'block';
    } catch (e) {
        errorDiv.innerHTML = `<div class="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-5">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm font-medium">${e.message}</span>
        </div>`;
    }
}

function safeFixed(val, digits) {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Number(val).toFixed(digits);
}

function renderSectionProperties(result) {
    const tbody = document.getElementById('sectionPropsBody');
    tbody.innerHTML = '';

    const totalH = result.totalThickness;
    const halfH = totalH / 2;
    const tdCls = 'px-3.5 py-2.5 text-[13px] font-medium text-gray-600 border-b border-gray-50 last:border-b-0';

    result.layers.forEach((layer, i) => {
        if (layer.ti === 0) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${tdCls}">${'T' + (i + 1)}</td>
            <td class="${tdCls}">${layer.ti}</td>
            <td class="${tdCls}">${safeFixed(layer.yi, 1)}</td>
            <td class="${tdCls}">${layer.orientation}&deg;</td>
            <td class="${tdCls}">${safeFixed(layer.eiXX, 0)}</td>
            <td class="${tdCls}">${safeFixed(layer.hi, 1)}</td>
            <td class="${tdCls}">${safeFixed(layer.gi, 1)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderShearAnalogyTable(result) {
    const tbody = document.getElementById('shearTableBody');
    tbody.innerHTML = '';
    const tdCls = 'px-3.5 py-2.5 text-[13px] font-medium text-gray-600 border-b border-gray-50 last:border-b-0';

    result.layers.forEach((layer, i) => {
        if (layer.ti === 0) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${tdCls}">${'T' + (i + 1)}</td>
            <td class="${tdCls}">${safeFixed(layer.beffTi3Over12, 2)}</td>
            <td class="${tdCls}">${safeFixed(layer.tiBeffHi2, 2)}</td>
            <td class="${tdCls}">${safeFixed(layer.eiXX, 0)}</td>
            <td class="${tdCls}">${safeFixed(layer.eiIi, 2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderGammaTable(result) {
    const tbody = document.getElementById('gammaTableBody');
    tbody.innerHTML = '';
    const tdCls = 'px-3.5 py-2.5 text-[13px] font-medium text-gray-600 border-b border-gray-50 last:border-b-0';

    result.layers.forEach((layer, i) => {
        if (layer.ti === 0) return;
        const gamma = layer.gamma !== undefined ? layer.gamma : 0;
        const a = layer.a !== undefined ? layer.a : 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${tdCls}">${'T' + (i + 1)}</td>
            <td class="${tdCls}">${safeFixed(layer.eiXX, 0)}</td>
            <td class="${tdCls}">${safeFixed(a, 4)}</td>
            <td class="${tdCls}">${safeFixed(layer.beffTi3Over12, 2)}</td>
            <td class="${tdCls}">${safeFixed(layer.ti * result.beff * Math.pow(a, 2), 2)}</td>
            <td class="${tdCls}">${safeFixed(gamma, 6)}</td>
            <td class="${tdCls}">${safeFixed(layer.eiIi, 2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderVisualization(result) {
    const svg = document.getElementById('panelSvg');
    const info = document.getElementById('panelInfo');
    const layers = result.layers.filter(l => l.ti > 0);
    const totalH = result.totalThickness;

    const svgW = 440, svgH = 340;
    const padL = 70, padR = 90, padT = 35, padB = 30;
    const panelW = svgW - padL - padR;
    const panelH = svgH - padT - padB;
    const scale = panelH / Math.max(totalH, 1);

    let html = '';

    html += `<defs>
        <pattern id="wood0" width="120" height="100" patternUnits="userSpaceOnUse">
            <rect width="120" height="100" fill="#e0b87a"/>
            <rect width="120" height="100" fill="#d4a96a" opacity="0.4"/>
            <line x1="0" y1="8" x2="120" y2="9" stroke="#9a7030" stroke-width="1.6" opacity="0.7"/>
            <line x1="0" y1="18" x2="120" y2="17" stroke="#8b6428" stroke-width="1.2" opacity="0.55"/>
            <line x1="0" y1="26" x2="120" y2="27" stroke="#a07a38" stroke-width="1.4" opacity="0.6"/>
            <line x1="0" y1="35" x2="120" y2="34" stroke="#906e2c" stroke-width="1" opacity="0.5"/>
            <line x1="0" y1="44" x2="120" y2="45" stroke="#a88040" stroke-width="1.5" opacity="0.65"/>
            <line x1="0" y1="54" x2="120" y2="53" stroke="#8a6828" stroke-width="1.3" opacity="0.5"/>
            <line x1="0" y1="63" x2="120" y2="64" stroke="#9c7634" stroke-width="1.1" opacity="0.55"/>
            <line x1="0" y1="72" x2="120" y2="71" stroke="#a07838" stroke-width="1.6" opacity="0.65"/>
            <line x1="0" y1="82" x2="120" y2="83" stroke="#8c6a2a" stroke-width="1.2" opacity="0.5"/>
            <line x1="0" y1="91" x2="120" y2="90" stroke="#a67e3c" stroke-width="1.4" opacity="0.6"/>
        </pattern>
        <pattern id="wood90" width="120" height="130" patternUnits="userSpaceOnUse">
            <rect width="120" height="130" fill="#c89050"/>
            <rect width="120" height="130" fill="#b88040" opacity="0.3"/>
            <path d="M0,10 Q20,2 40,10 Q60,18 80,10 Q100,2 120,10" fill="none" stroke="#8a6020" stroke-width="1.8" opacity="0.7"/>
            <path d="M0,22 Q20,14 40,22 Q60,30 80,22 Q100,14 120,22" fill="none" stroke="#987030" stroke-width="1.3" opacity="0.55"/>
            <path d="M0,34 Q20,26 40,34 Q60,42 80,34 Q100,26 120,34" fill="none" stroke="#8c6424" stroke-width="1.5" opacity="0.6"/>
            <path d="M0,46 Q20,38 40,46 Q60,54 80,46 Q100,38 120,46" fill="none" stroke="#a07838" stroke-width="1.2" opacity="0.5"/>
            <path d="M0,58 Q20,50 40,58 Q60,66 80,58 Q100,50 120,58" fill="none" stroke="#906c28" stroke-width="1.7" opacity="0.65"/>
            <path d="M0,70 Q20,62 40,70 Q60,78 80,70 Q100,62 120,70" fill="none" stroke="#9a7432" stroke-width="1.3" opacity="0.55"/>
            <path d="M0,82 Q20,74 40,82 Q60,90 80,82 Q100,74 120,82" fill="none" stroke="#8e6826" stroke-width="1.5" opacity="0.6"/>
            <path d="M0,94 Q20,86 40,94 Q60,102 80,94 Q100,86 120,94" fill="none" stroke="#a47c3a" stroke-width="1.4" opacity="0.55"/>
            <path d="M0,106 Q20,98 40,106 Q60,114 80,106 Q100,98 120,106" fill="none" stroke="#8a6222" stroke-width="1.6" opacity="0.65"/>
            <path d="M0,118 Q20,110 40,118 Q60,126 80,118 Q100,110 120,118" fill="none" stroke="#9c7634" stroke-width="1.2" opacity="0.5"/>
        </pattern>
        <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L4,7 L7,1" fill="none" stroke="#9ca3af" stroke-width="1"/>
        </marker>
        <marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,7 L4,1 L7,7" fill="none" stroke="#9ca3af" stroke-width="1"/>
        </marker>
    </defs>`;

    let yTop = padT;
    let cumY = 0;

    layers.forEach((layer, i) => {
        const h = layer.ti * scale;
        const is90 = layer.orientation === 90;
        const fill = is90 ? 'url(#wood90)' : 'url(#wood0)';
        const stroke = is90 ? '#7a5518' : '#8a6520';

        html += `<rect x="${padL}" y="${yTop}" width="${panelW}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" rx="3"/>`;

        const midY = yTop + h / 2;
        html += `<text x="${padL + panelW / 2}" y="${midY}" text-anchor="middle" font-size="11" fill="#fff" font-weight="700" dominant-baseline="middle" stroke="rgba(90,62,10,0.3)" stroke-width="0.5" font-family="Inter,system-ui,sans-serif">${layer.orientation}&deg;</text>`;

        html += `<text x="${padL - 10}" y="${midY + 1}" text-anchor="end" font-size="11" fill="#9ca3af" font-weight="600" font-family="Inter,system-ui,sans-serif">T${i + 1}</text>`;

        const yStart = cumY;
        const yEnd = cumY + layer.ti;
        const yCenter = cumY + layer.ti / 2;

        html += `<line x1="${padL + panelW + 6}" y1="${yTop}" x2="${padL + panelW + 6}" y2="${yTop + h}" stroke="#d1d5db" stroke-width="0.75"/>`;
        html += `<line x1="${padL + panelW + 4}" y1="${yTop}" x2="${padL + panelW + 8}" y2="${yTop}" stroke="#d1d5db" stroke-width="0.75"/>`;
        html += `<line x1="${padL + panelW + 4}" y1="${yTop + h}" x2="${padL + panelW + 8}" y2="${yTop + h}" stroke="#d1d5db" stroke-width="0.75"/>`;

        const tLabel = `${layer.ti} mm`;
        html += `<text x="${padL + panelW + 14}" y="${midY}" font-size="9" fill="#9ca3af" dominant-baseline="middle" font-family="Inter,system-ui,sans-serif">${tLabel}</text>`;

        if (i === 0 || i === layers.length - 1) {
            const yPos = i === 0 ? yStart : yEnd;
            html += `<text x="${padL + panelW + 14}" y="${yTop + (i === 0 ? 0 : h)}" font-size="7.5" fill="#d1d5db" dominant-baseline="${i === 0 ? 'auto' : 'hanging'}" font-family="Inter,system-ui,sans-serif">y=${yPos}</text>`;
        }

        yTop += h;
        cumY += layer.ti;
    });

    const yTopLine = padT;
    const yBotLine = padT + panelH;
    html += `<line x1="${padL - 22}" y1="${yTopLine}" x2="${padL - 22}" y2="${yBotLine}" stroke="#d1d5db" stroke-width="1" marker-start="url(#arrowUp)" marker-end="url(#arrowDown)"/>`;
    html += `<text x="${padL - 32}" y="${(yTopLine + yBotLine) / 2}" font-size="9.5" fill="#9ca3af" text-anchor="middle" font-weight="600" transform="rotate(-90, ${padL - 32}, ${(yTopLine + yBotLine) / 2})" font-family="Inter,system-ui,sans-serif">h=${totalH} mm</text>`;

    const neutralY = padT + panelH / 2;
    html += `<line x1="${padL - 5}" y1="${neutralY}" x2="${padL + panelW + 40}" y2="${neutralY}" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="6,3"/>`;
    html += `<text x="${padL + panelW + 43}" y="${neutralY + 4}" font-size="8" fill="#ef4444" font-weight="600" font-family="Inter,system-ui,sans-serif">NA</text>`;

    const naFromTop = totalH / 2;
    html += `<line x1="${padL + panelW + 34}" y1="${padT}" x2="${padL + panelW + 34}" y2="${neutralY}" stroke="#fca5a5" stroke-width="0.75" stroke-dasharray="2,2"/>`;
    html += `<text x="${padL + panelW + 43}" y="${(padT + neutralY) / 2}" font-size="7.5" fill="#fca5a5" font-family="Inter,system-ui,sans-serif">${naFromTop.toFixed(1)}</text>`;

    html += `<text x="${padL + panelW / 2}" y="${padT - 12}" text-anchor="middle" font-size="9" fill="#d1d5db" font-weight="600" font-family="Inter,system-ui,sans-serif">y = 0 (top)</text>`;
    html += `<line x1="${padL}" y1="${padT}" x2="${padL + panelW}" y2="${padT}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    html += `<line x1="${padL}" y1="${padT + panelH}" x2="${padL + panelW}" y2="${padT + panelH}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="3,3"/>`;
    html += `<text x="${padL + panelW / 2}" y="${padT + panelH + 20}" text-anchor="middle" font-size="9" fill="#d1d5db" font-family="Inter,system-ui,sans-serif">y = ${totalH} mm (bottom)</text>`;

    svg.innerHTML = html;

    const method = calculator.currentMethod === 'shear-analogy' ? 'Shear Analogy' : 'Gamma';
    let layerInfoHtml = layers.map((l, i) => {
        const yStart = layers.slice(0, i).reduce((s, ly) => s + ly.ti, 0);
        const yCenter = yStart + l.ti / 2;
        return `<div class="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-wood-50/60 border border-wood-100/50">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-md ${l.orientation === 0 ? 'bg-wood-200 text-wood-700' : 'bg-wood-300 text-wood-800'} text-[10px] font-bold">${'T' + (i + 1)}</span>
            <span class="text-xs font-semibold ${l.orientation === 0 ? 'text-wood-600' : 'text-wood-700'}">${l.orientation}&deg;</span>
            <span class="text-[10px] text-gray-400 font-medium">y: ${yStart}&ndash;${yStart + l.ti} mm</span>
            <span class="text-[10px] text-gray-300 font-medium">&middot; center: ${yCenter} mm</span>
        </div>`;
    }).join('');

    info.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div class="bg-gray-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Method</div>
                <div class="text-sm font-bold text-gray-700">${method}</div>
            </div>
            <div class="bg-gray-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Grade</div>
                <div class="text-sm font-bold text-gray-700">${calculator.selectedGrade.name}</div>
            </div>
            <div class="bg-gray-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Layers</div>
                <div class="text-sm font-bold text-gray-700">${layers.length} &middot; ${totalH} mm</div>
            </div>
            <div class="bg-gray-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">beff</div>
                <div class="text-sm font-bold text-gray-700">${result.beff} mm</div>
            </div>
        </div>
        <div class="flex flex-wrap gap-2">${layerInfoHtml}</div>
    `;
}

document.addEventListener('DOMContentLoaded', initUI);
