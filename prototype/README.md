# 測試版（Claude 私人 Artifact）

- 網址：https://claude.ai/artifact/1etj4kg6yARfBafwF58MDA （只有擁有者看得到）
- 用手機登入 Claude 後打開網址即可使用。

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 整個 App（畫面與程式） |
| `data/jurisdictions.json` | 各縣市官方檢舉網站的欄位規格與網址 |
| `data/violations.json` | 可檢舉判斷規則、罰鍰、證據要求 |
| `data/taiwan_towns.geojson` | 鄉鎮市區界線（內政部國土測繪中心 1140318 版，簡化版；取自 iroowu/traffic-violation-reporter，MIT），用來從 GPS 離線判斷縣市與行政區 |

## 外部套件

- [ExifReader](https://github.com/mattiasw/ExifReader) 4.46.0（MPL-2.0），從 jsDelivr 載入，用來讀照片的拍攝時間與 GPS。

## 資料存放

- 個人資料與案件：存在手機瀏覽器的 localStorage，不上傳。
- 照片：只在記憶體中處理，案件只保留小縮圖。按「開始判讀」時，照片會交給使用者自己帳號的 Claude 判讀。
