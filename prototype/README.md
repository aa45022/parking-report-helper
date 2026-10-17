# 測試版（Claude 私人 Artifact）

- 網址：https://claude.ai/artifact/1etj4kg6yARfBafwF58MDA （只有擁有者看得到）
- 用手機登入 Claude 後打開網址即可使用。
- 目前版本：v0.2.1

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 整個 App（首頁、檢舉 5 步驟、紀錄、我的） |
| `autofill.js` | 在官方檢舉網頁上執行的自動填表程式（做成 Safari 書籤使用） |
| `data/jurisdictions.json` | 各縣市官方檢舉網站的欄位規格與網址 |
| `data/violations.json` | 可檢舉判斷規則、罰鍰、證據要求 |
| `data/autofill.json` | 自動填表用的欄位標籤對照 |
| `data/taiwan_towns.geojson` | 鄉鎮市區界線（內政部國土測繪中心 1140318 版，簡化版；取自 iroowu/traffic-violation-reporter，MIT），用來從 GPS 離線判斷縣市與行政區 |
| `tests/autofill.test.js` | 自動填表程式的測試（`npm install && npm test`） |

## Artifact 權限

- `sample`（含圖片）：用使用者自己的 Claude 帳號讀車牌、法規小幫手、寫陳情信。
- `downloads`：匯出 CSV 紀錄、存備份檔。

## 外部套件

- [ExifReader](https://github.com/mattiasw/ExifReader) 4.46.0（MPL-2.0），從 jsDelivr 載入，用來讀照片的拍攝時間與 GPS。

## 資料存放

- 個人資料：存在手機瀏覽器的 localStorage，不上傳、不送 Claude。設定「隱私密碼」後以 AES-GCM 加密存放（PBKDF2-SHA256 60 萬次產生金鑰，密碼與金鑰不儲存）；可選擇不儲存身分證字號。
- 案件、常用地點、設定：存在手機瀏覽器的 localStorage，不上傳。
- 照片：只在記憶體中處理，案件只保留小縮圖。按「開始判讀」時，照片會交給使用者自己帳號的 Claude 判讀。
- 自動填表：資料由使用者自己複製到剪貼簿，再在官方網頁貼上，不經過任何伺服器。
