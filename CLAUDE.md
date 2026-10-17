# 專案說明（給 AI 協作者）

- 這是台灣「人行道／斑馬線違停」檢舉輔助系統。規劃見 `docs/PLAN.md`，研究與來源見 `docs/RESEARCH.md`。
- 與使用者溝通一律用**繁體中文（台灣用語）**，說明要一步一步、避免術語；必要的術語要附白話解釋。
- 不可違反的原則：
  - 系統絕不代送檢舉、不填驗證碼、不自動點 Email 認證連結、不自動按送出。
  - 個人資料（姓名、身分證、電話、地址、Email）與照片只存在使用者裝置，不可送到伺服器或寫進 log。
  - 唯一例外：使用者按下「開始判讀」時，照片可以交給使用者自己帳號的 Claude 判讀（Artifact 的 `sample` 功能）。個人資料永遠不送 Claude。
- 開發中的測試版在 `prototype/`，以**私人** Claude Artifact 發布：https://claude.ai/artifact/1etj4kg6yARfBafwF58MDA 。修改後用同一個檔案路徑重新發布，網址不變。
  - 法規、縣市規格、文字範本要寫成資料檔，不寫死在程式裡；每筆資料要附來源與查證日期。
- 不使用 AGPL 授權的套件（例如 Ultralytics）。
- 照片 EXIF 用 ExifReader，不用 exifr（HEIC 讀取有 bug）。
