# 違停檢舉輔助系統（parking-report-helper）

在人行道或斑馬線上看到違停的汽車，拍完照之後 1 分鐘內就能把檢舉準備好，最後由本人在官方網站送出。

> 狀態：**規劃階段**，還沒有可以使用的程式。

## 文件

| 文件 | 內容 |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | 規劃設計書：產品定位、使用流程、功能、架構、技術設計、路線圖、風險、待決定事項 |
| [docs/RESEARCH.md](docs/RESEARCH.md) | 研究彙整：法規、各縣市檢舉系統、競品、技術選項，附來源 |
| [docs/PROPOSAL-v0.2.md](docs/PROPOSAL-v0.2.md) | 第二版改善提案：測試回饋、定位問題的兩條路、新介面設計、完整功能清單 |

## 核心原則

- **最後由本人送出**：不代送、不繞過驗證碼、不自動點認證信。
- **隱私優先**：個人資料和照片只存在使用者手機，伺服器不保存。
- **有效檢舉**：只引導可以檢舉的違規，送出前先檢查證據夠不夠。

## 致謝

各縣市檢舉網站規格參考 [iroowu/traffic-violation-reporter](https://github.com/iroowu/traffic-violation-reporter)（MIT 授權）。
