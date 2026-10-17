// 自動填表程式的測試：用模擬的官方表單檢查每一欄都填對、驗證碼不會被填。
// 執行：npm install && npm test
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'autofill.js'), 'utf8');
const labels = JSON.parse(fs.readFileSync(path.join(root, 'data/autofill.json'), 'utf8')).fields;
const values = {
  'profile.name': '王小明', 'profile.idNumber': 'A123456789', 'profile.phone': '0912345678', 'profile.email': 'a@b.tw', 'profile.address': '臺北市大安區某路1號',
  'case.date': '2026/10/17', 'case.time': '14:32', 'case.districtLabel': '大安區', 'case.road': '忠孝東路四段', 'case.locationDetail': '100號前',
  'case.fullLocation': '臺北市大安區忠孝東路四段100號前', 'case.vehicleTypeLabel': '一般(汽、機車)', 'case.plate': 'ABC-1234',
  'case.violationLabel': '汽車於人行道、行人穿越道停車(但機車及騎樓不在此限)', 'case.description': '白色自用小客車 ABC-1234 停放於行人穿越道上'
};
function payload(keys) {
  return { app: 'prh', v: 1, fields: labels.filter(l => keys.includes(l.source)).map(l => ({ ...l, value: values[l.source],
    ...(l.kind === 'date' ? { iso: '2026-10-17', m: 10, d: 17 } : {}), ...(l.kind === 'time' ? { h: 14, min: 32 } : {}), ...(l.kind === 'plate' ? { parts: ['ABC', '1234'] } : {}) })) };
}
function fill(html, keys) {
  const dom = new JSDOM(`<body>${html}</body>`, { runScripts: 'outside-only' });
  dom.window.__PRH_TEST__ = true;
  dom.window.eval(src);
  const report = dom.window.__PRH_FILL__(payload(keys));
  const got = {};
  for (const e of dom.window.document.querySelectorAll('[data-k]')) got[e.dataset.k] = e.tagName === 'SELECT' ? e.options[e.selectedIndex].text : e.value;
  return { report, got };
}
const item = (lbl, inner) => `<div class="el-form-item"><div class="el-form-item__label">${lbl}</div><div class="el-form-item__content">${inner}</div></div>`;
const range = (n) => [...Array(n).keys()].map(h => `<option>${String(h).padStart(2, '0')}</option>`).join('');
let failed = 0;
function test(name, fn) { try { fn(); console.log('✓', name); } catch (e) { failed++; console.log('✗', name, '\n ', e.message); } }

test('label for= 版型（類似桃園第一步），驗證碼不填', () => {
  const { got } = fill(`
    <label for="Name">姓名</label><input id="Name" data-k=name>
    <label for="Idno">身分證字號</label><input id="Idno" data-k=id>
    <label for="Email">電子信箱</label><input id="Email" type="email" data-k=email>
    <label for="Tel">聯絡電話(手機)</label><input id="Tel" data-k=tel>
    <label for="Addr">聯絡地址</label><input id="Addr" data-k=addr>
    <label for="Cap">圖形驗證碼</label><input id="Cap" data-k=captcha>`,
    ['profile.name', 'profile.idNumber', 'profile.email', 'profile.phone', 'profile.address']);
  assert.deepStrictEqual(got, { name: '王小明', id: 'A123456789', email: 'a@b.tw', tel: '0912345678', addr: '臺北市大安區某路1號', captcha: '' });
});

test('標籤在旁邊的版型（類似臺北），日期下拉、時分下拉、車號兩格', () => {
  const { got } = fill([
    item('身分證或居留證號', '<input data-k=id>'), item('姓名', '<input data-k=name>'),
    item('違規日期', '<select data-k=date><option>請選擇</option><option>115/10/16</option><option>115/10/17</option></select>'),
    item('違規時間', `<select data-k=hh>${range(24)}</select>時<select data-k=mm>${range(60)}</select>分`),
    item('行政區', '<select data-k=dist><option>請選擇</option><option>中正一區</option><option>大安區</option></select>'),
    item('路段', '<input data-k=road>'), item('巷弄號或公里數', '<input data-k=detail>'),
    item('車種', '<select data-k=vt><option>一般(汽、機車)</option><option>機械</option></select>'),
    item('車號', '<input data-k=p1> - <input data-k=p2>'),
    item('違規事實', '<select data-k=law><option>請選擇</option><option>汽車於人行道、行人穿越道臨時停車(但機車及騎樓不在此限)</option><option>汽車於人行道、行人穿越道停車(但機車及騎樓不在此限)</option></select>'),
    item('違規事實說明', '<textarea data-k=desc></textarea>'), item('驗證碼', '<input data-k=captcha>')].join(''),
    ['profile.idNumber', 'profile.name', 'case.date', 'case.time', 'case.districtLabel', 'case.road', 'case.locationDetail', 'case.vehicleTypeLabel', 'case.plate', 'case.violationLabel', 'case.description']);
  assert.deepStrictEqual(got, { id: 'A123456789', name: '王小明', date: '115/10/17', hh: '14', mm: '32', dist: '大安區', road: '忠孝東路四段', detail: '100號前', vt: '一般(汽、機車)', p1: 'ABC', p2: '1234', law: '汽車於人行道、行人穿越道停車(但機車及騎樓不在此限)', desc: '白色自用小客車 ABC-1234 停放於行人穿越道上', captcha: '' });
});

test('表格版型，日期與時間是原生欄位', () => {
  const { got } = fill(`<table>
    <tr><th>違規日期</th><td><input type="date" data-k=date></td></tr><tr><th>違規時間</th><td><input type="time" data-k=time></td></tr>
    <tr><th>違規地點</th><td><input data-k=loc></td></tr><tr><th>車牌號碼</th><td><input data-k=plate></td></tr>
    <tr><th>違規事實</th><td><input data-k=fact></td></tr><tr><th>說明</th><td><textarea data-k=desc></textarea></td></tr></table>`,
    ['case.date', 'case.time', 'case.fullLocation', 'case.plate', 'case.violationLabel', 'case.description']);
  assert.deepStrictEqual(got, { date: '2026-10-17', time: '14:32', loc: '臺北市大安區忠孝東路四段100號前', plate: 'ABC-1234', fact: '汽車於人行道、行人穿越道停車(但機車及騎樓不在此限)', desc: '白色自用小客車 ABC-1234 停放於行人穿越道上' });
});

if (failed) { console.log(`\n${failed} 個測試失敗`); process.exit(1); } else console.log('\n全部通過');
