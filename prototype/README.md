# 測試版（Claude 私人 Artifact）

- 網址：https://claude.ai/artifact/1etj4kg6yARfBafwF58MDA （只有擁有者看得到）
- 用手機登入 Claude 後打開網址即可使用。
- 目前版本：v0.3.3（三種外觀可切換、App 內拍照、照片存在 App 並可一鍵存到雲端、自動上鎖時間可調、照片定位檢查、相簿定位提醒、一鍵定位捷徑）

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 整個 App（首頁、檢舉 4 步驟：能不能檢舉 → 拍照 → 確認檢舉單 → 送出；紀錄、我的）。三種外觀「路標」「夜巡」「小綠人」共用同一套畫面，只用 CSS 變數切換 |
| `autofill.js` | 在官方檢舉網頁上執行的自動填表程式（做成 Safari 書籤使用） |
| `data/jurisdictions.json` | 各縣市官方檢舉網站的欄位規格與網址 |
| `data/violations.json` | 可檢舉判斷規則、罰鍰、證據要求 |
| `data/autofill.json` | 自動填表用的欄位標籤對照 |
| `data/taiwan_towns.geojson` | 鄉鎮市區界線（內政部國土測繪中心 1140318 版，簡化版；取自 iroowu/traffic-violation-reporter，MIT），用來從 GPS 離線判斷縣市與行政區 |
| `tests/autofill.test.js` | 自動填表程式的測試（`npm install && npm test`） |

## Artifact 權限

- `sample`（含圖片）：用使用者自己的 Claude 帳號讀車牌、法規小幫手、寫陳情信。
- `downloads`：匯出 CSV 紀錄、存備份檔、把照片存到「檔案」或雲端（單張 JPEG，或整件案件一個 ZIP）。每次都由使用者確認。

## 外部套件

- [ExifReader](https://github.com/mattiasw/ExifReader) 4.46.0（MPL-2.0），從 jsDelivr 載入，用來讀照片的拍攝時間與 GPS。

## 資料存放

- 個人資料：存在手機瀏覽器的 localStorage，不上傳、不送 Claude。設定「隱私密碼」後以 AES-GCM 加密存放（PBKDF2-SHA256 60 萬次產生金鑰，密碼與金鑰不儲存）；離開 App 5 分鐘／30 分鐘（預設）／只在關掉 App 時自動上鎖；可選擇不儲存身分證字號。
- 案件、常用地點、設定：存在手機瀏覽器的 localStorage，不上傳。
- 照片：原檔存在這個 App 自己的 IndexedDB（資料庫名稱 `prh-photos`），不會進手機的「照片」App，也不上傳。用 App 相機拍（`<input capture>`）或從相簿選都一樣。依「照片存放」設定自動刪除（記下處理結果後／60 天後／一直保留）。案件紀錄只保留小縮圖。
- 照片匯出：使用者按「存到檔案」時才經 `downloads` 交給手機，存到哪裡由使用者在分享選單決定（例如 iCloud 雲碟、Google 雲端硬碟）。JPEG／PNG 保留原檔，其他格式轉成 JPEG。
- 請 Claude 判讀：進入「確認檢舉單」時，照片（縮成 1600px 的 JPEG）交給使用者自己帳號的 Claude；個人資料不送。
- 自動填表：資料由使用者自己複製到剪貼簿，再在官方網頁貼上，不經過任何伺服器。

## 測試

- 自動填表：`npm install && npm test`。
- 整個 App 的流程測試目前在開發環境用 jsdom 跑（相機、相簿、照片資料庫、壓縮檔、加密、自動上鎖），尚未放進 repo。

## 已知限制（v0.3）

- App 相機拍的照片不含 GPS，地點要用常用地點、Claude 讀路名牌、貼上地圖位置或自己輸入。照片沒有定位時，App 會判斷原因（App 相機拍的／照片沒有拍攝資訊／有時間但沒有位置）並列出調整方法；「我的 → 照片定位檢查」可以逐張檢查，複製的結果不含座標。
- 從相簿選照片時打開「選項 → 位置」就能帶出定位（2026-10-17 在 Claude iOS App 實測可用）。App 在第一次成功之前，首頁和拍照步驟會一直提醒。
- 一鍵定位捷徑：使用者在 iPhone「捷徑」App 建立「違停定位」（取得目前位置 → 文字「緯度,經度 街道」→ 拷貝到剪貼簿 → 打開 Claude），在現場執行後回 App 的「現場位置」貼上。`parsePasted()` 不管地址順序都能找出縣市、區、路段、門牌；有座標時縣市與區以內建界線資料為準。捷徑的建立步驟還沒在實機確認。
- App 內相機用的是手機內建相機畫面（`<input capture>`），還沒在 Claude iOS App 裡實測；如果按了沒有出現相機，會改成選照片畫面。
- Face ID／指紋解鎖：Claude App 裡的嵌入頁面通常不能用，規劃在私人網站版用 WebAuthn PRF 產生解鎖金鑰；「隱私說明與保護」頁有能力檢查按鈕。
