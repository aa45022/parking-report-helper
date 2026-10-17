# 專案說明（給 AI 協作者）

- 這是台灣「人行道／斑馬線違停」檢舉輔助系統。規劃見 `docs/PLAN.md`，研究與來源見 `docs/RESEARCH.md`。
- 與使用者溝通一律用**繁體中文（台灣用語）**，說明要一步一步、避免術語；必要的術語要附白話解釋。
- 不可違反的原則：
  - 系統絕不代送檢舉、不填驗證碼、不自動點 Email 認證連結、不自動按送出。
  - 個人資料（姓名、身分證、電話、地址、Email）與照片只存在使用者裝置，不可送到伺服器或寫進 log。
  - 唯一例外：使用者按下「開始判讀」時，照片可以交給使用者自己帳號的 Claude 判讀（Artifact 的 `sample` 功能）。個人資料永遠不送 Claude。
  - 個人資料存放要經過 `persistProfile()`：有隱私密碼時用 AES-GCM 加密（金鑰由 PBKDF2-SHA256 60 萬次產生），密碼和金鑰不可儲存；使用者可選擇不儲存身分證字號。
  - 新增任何送給 Claude 的內容（`sample` 呼叫）或對外連線前，要先確認不含個人資料，並更新 App 裡的「隱私說明與保護」頁。
  - 測試資料只能用假資料（例如 王小明、A123456789），不可放入真實個資。
  - 照片原檔只存在 App 的 IndexedDB（`prh-photos`），不進手機相簿；只有使用者按「存到檔案」時才經 `downloads` 交給手機。刪除案件或依「照片存放」設定到期時，要一併刪除照片。
  - Face ID／指紋只能用 WebAuthn PRF 產生解鎖金鑰（不可只當開關），隱私密碼要保留為備用。
- 開發中的測試版在 `prototype/`，以**私人** Claude Artifact 發布：https://claude.ai/artifact/1etj4kg6yARfBafwF58MDA 。修改後用同一個檔案路徑重新發布，網址不變；發布時要一併帶上 `data/*` 與 `autofill.js`，權限為 `sample`（含圖片）與 `downloads`。
- 三種外觀（`road` 路標、`night` 夜巡、`green` 小綠人）共用同一套畫面，只用 `:root[data-skin]` 的 CSS 變數和少量覆寫切換；新增或修改畫面時三種都要檢查。
- 自動填表（`prototype/autofill.js`）只在使用者自己的瀏覽器裡填欄位，修改後要跑 `npm test`。
  - 法規、縣市規格、文字範本要寫成資料檔，不寫死在程式裡；每筆資料要附來源與查證日期。
- 不使用 AGPL 授權的套件（例如 Ultralytics）。
- 照片 EXIF 用 ExifReader，不用 exifr（HEIC 讀取有 bug）。
