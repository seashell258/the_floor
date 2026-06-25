# Canva 文字配圖片pdf 製作流程

## 概述

此流程產出：**一個 Canva 簡報檔（36 頁）**，每頁右半是照片，左下是名稱，無多餘裝飾。可匯出為 PDF（多頁）。

---

## 一、圖片素材在canva上，某資料夾裡面，可以先詢問我

- 圖片命名：`1.jpg`、`2.webp`、…`36.png`（支援 `.jpg`、`.jpeg`、`.avif`、`.JPG`、png）

---

## 二、上傳圖片到 Canva

### 為何需要上傳？
Canva MCP 的 `upload-asset-from-url` 只接受 HTTPS 網址，無法直接讀取本機檔案。必須手動上傳。

### 是否需要不同資料夾？
**是，強烈建議**。Canva 用 asset ID 識別圖片（非檔名），技術上不衝突，但：
- 不同主題的圖片全部叫 `1.jpg`～`36.jpg`，之後難以分辨
- 分資料夾後，agent 可以用資料夾名稱精準找到該主題的 asset ID 列表

### 操作步驟
1. 開啟 Canva → 左側「專案」→「上傳」
2. 新建資料夾，命名與主題一致（例如：`台灣行道樹＆園藝植物`）
3. 將 36 張圖片全部上傳到該資料夾
4. 上傳完成後告知 agent「完成」

---

## 三、取得 Asset ID 列表

Agent 使用以下工具，從剛上傳的資料夾取得 asset ID，**依 `created_descending` 排序**：

```
mcp__canva__search-folders  →  找到資料夾 ID
mcp__canva__list-folder-items (sort: created_descending)  →  取得 36 個 asset ID
```

> 排序方式必須用 `created_descending`，讓最新上傳的排最前面，對應圖片編號 1→36。

---

## 四、生成設計（generate-design）

### 限制
- `generate-design` 一次最多接受 **10 個 asset_id**
- `instagram_post` 類型會加入 AI 裝飾，不符需求
- 正確做法：使用 `presentation` 類型 + `comprehensive` 長度

### 呼叫參數
```json
{
  "design_type": "presentation",
  "length": "comprehensive",
  "asset_ids": [前10張圖片的 asset_id],
  "text_context": "榕樹\n虎尾蘭\n茄苳\n（...共36行植物名稱...）",
  "user_intent": "建立36頁植物圖鑑，每頁一張植物照片搭配植物名稱"
}
```

### 選候選設計
- 通常會產生 2-3 個候選，選擇**版面較簡潔、無多餘裝飾**的那個
- 使用 `mcp__canva__create-design-from-candidate` 建立正式設計

---

## 五、開始編輯 Transaction

```
mcp__canva__start-editing-transaction (design_id)
→ 取得 transaction_id，後續所有編輯都要帶此 ID
```

---

## 六、修正圖片（第 11～36 頁）

因 `generate-design` 只送入前 10 張圖，第 11-36 頁圖片是 AI 隨機填入的，需要全部替換。

使用 `mcp__canva__perform-editing-operations`，一次 batch 送入 26 個 `update_fill` 操作：

```json
{
  "type": "update_fill",
  "element_id": "第N頁的圖片元素ID",
  "asset_id": "第N張植物照片的 asset_id"
}
```

> 圖片元素 ID 可從 `get-design-content` 或 `perform-editing-operations` 的回傳值中的 `fills` 陣列取得。

---

## 七、修正文字（若 AI 截斷了植物名稱）

AI 有時會縮短較長的植物名稱（例如「臺灣櫸（雞油）」→「臺灣櫸樹」），需要用 `replace_text` 修正：

```json
{
  "type": "replace_text",
  "element_id": "標題文字元素ID",
  "text": "正確植物名稱"
}
```

> 在每次 `perform-editing-operations` 回傳的 `richtexts` 陣列中，可以看到每頁目前的文字內容，用來驗證是否正確。

---

## 八、刪除副標題（AI 自動生成的多餘文字）

AI 會在每頁加入副標題（英文或中文描述句），需要全部刪除：

```json
{
  "type": "delete_element",
  "element_id": "副標題元素ID"
}
```

36 個 `delete_element` 可以一次 batch 送入同一個 `perform-editing-operations` 呼叫。

> 副標題元素 ID 可從第一次 `perform-editing-operations` 回傳的 `richtexts` 中識別（通常每頁有兩個文字元素：植物名稱標題 + 副標題）。

---

## 九、Commit Transaction

確認所有編輯正確後，提交儲存：

```
mcp__canva__commit-editing-transaction (design_id, transaction_id)
```

> Commit 前可從 `perform-editing-operations` 回傳的縮圖預覽確認成果。

---

## 十、匯出

### 匯出 PDF（多頁，推薦）
```json
{
  "design_id": "設計ID",
  "format": { "type": "pdf", "export_quality": "regular" }
}
```

### 匯出 PNG（逐頁）
```json
{
  "format": { "type": "png", "pages": [1, 2, 3, ...] }
}
```

回傳的 `urls` 陣列即為下載連結，有效期限約 18 小時。

---

## 快速提示清單（給 Agent 的 Prompt）

下次製作新主題時，可以這樣告訴 agent：

```
請在 Canva 製作一個36頁的植物圖鑑 Carousel：
- 圖片已上傳到 Canva 資料夾「[資料夾名稱]」
- 每頁：右半是植物照片，左下是植物名稱，不要任何多餘裝飾
- 植物名稱（依序對應圖片1到36）：
  [名稱1]
  [名稱2]
  ...
  [名稱36]
- 完成後匯出 PDF
- 請參考 docs/canva-carousel-workflow.md 的流程
```

---

## 已知限制與注意事項

| 問題 | 說明 |
|------|------|
| generate-design 最多 10 個 asset | 超過 10 張圖必須在生成後用 update_fill 補上 |
| AI 會加副標題 | 每次都需要 delete_element 清除 |
| AI 可能截斷長名稱 | 生成後需核對全部36頁的 richtexts |
| 匯出連結有時效 | 約18小時，需盡快下載 |
| 版面是16:9橫式 | 若需正方形（Instagram 1:1），目前 Canva MCP 無法精確控制版面比例 |
