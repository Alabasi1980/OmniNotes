# OmniNotes API Integration Guide

هذا الكتيّب يشرح كيفية **استهلاك OmniNotes API** من أي مشروع (Web/Mobile/Desktop/Service) للقراءة والكتابة (Notes / Catalogs / Attachments / AI).

---

## 1) نظرة عامة

### ما الذي يقدمه الـ API؟

* **Catalogs**: إنشاء/تعديل/حذف/قراءة كاتالوجات (تصنيف هرمي عبر `ParentId`).
* **Notes**: إنشاء/تعديل/حذف/استعلام مع فلاتر (بحث، نوع، كاتالوج، Tag، أرشفة، فترة زمنية، Pagination).
* **Attachments**: رفع ملف لملاحظة، تنزيله، وحذفه.
* **Health**: فحص جاهزية الخدمة والاتصال بقاعدة البيانات.
* **AI (اختياري)**: اقتراح وسوم (Tags) عبر Gemini من خلال الـ Backend.

### خصائص عامة

* جميع المعرفات **GUID**.
* التواريخ **UTC** بصيغة ISO-8601.
* الـ API يعتمد JSON للطلبات/الاستجابات، و`multipart/form-data` لرفع الملفات.

---

## 2) Base URL

مثال محلي (حسب إعدادك):

* API: `http://localhost:5174`
* Frontend (اختياري): `http://localhost:3002`

كل المسارات أدناه تُبنى على:
`{BASE_URL}/api/...`

---

## 3) المصادقة والأمان

* حاليًا: **لا يوجد Authentication** (لا JWT ولا API Key).
* لتطبيقات Production يوصى بإضافة Authentication لاحقًا (JWT / API Key / OAuth) حسب حاجتك.

---

## 4) تنسيقات البيانات (DTOs)

### Catalog DTO

```json
{
  "id": "guid",
  "name": "string",
  "parentId": "guid|null"
}
```

### Note DTO

```json
{
  "id": "guid",
  "catalogId": "guid",
  "title": "string",
  "type": "string",
  "contentMd": "string",
  "metadataJson": "string",
  "isArchived": true,
  "createdAtUtc": "2026-01-18T18:33:28.157Z",
  "updatedAtUtc": "2026-01-18T18:33:28.157Z",
  "tags": ["string"],
  "attachments": [
    {
      "id": "guid",
      "noteId": "guid",
      "fileName": "string",
      "contentType": "string",
      "sizeBytes": 123,
      "downloadUrl": "/api/attachments/{id}"
    }
  ]
}
```

### Attachment Upload Response

```json
{
  "attachment": {
    "id": "guid",
    "noteId": "guid",
    "fileName": "string",
    "contentType": "string",
    "sizeBytes": 123,
    "downloadUrl": "/api/attachments/{id}"
  }
}
```

---

## 5) الأخطاء (Errors)

الـ API يعيد أخطاء HTTP قياسية:

* `400 BadRequest` عند فشل التحقق (مثال: `CatalogId not found.`)
* `404 NotFound` عند عدم وجود المورد
* `503 ServiceUnavailable` (قد تظهر في AI إذا لم يتم ضبط مفتاح Gemini)

> ملاحظة: رسالة الخطأ قد تكون نصية (string) أو JSON حسب الـ endpoint.

---

## 6) Catalogs API

### 6.1 جلب كل الكاتالوجات

`GET /api/catalogs`

**Response:** `200 OK` → `CatalogDto[]`

### 6.2 جلب كاتالوج بالـ ID

`GET /api/catalogs/{id}`

### 6.3 إنشاء كاتالوج

`POST /api/catalogs`

**Body**

```json
{ "name": "Inbox", "parentId": null }
```

**Response**

* `201 Created` + `CatalogDto`

### 6.4 تعديل كاتالوج

`PUT /api/catalogs/{id}`

**Body**

```json
{ "name": "Programming", "parentId": null }
```

### 6.5 حذف كاتالوج

`DELETE /api/catalogs/{id}`

**ملاحظات**

* سيُرفض الحذف (`400`) إذا:

  * للكاتالوج أبناء (`Catalog has children...`)
  * أو لديه ملاحظات (`Catalog has notes...`)

---

## 7) Notes API

### 7.1 البحث/الاستعلام (مع فلاتر + Pagination)

`GET /api/notes`

**Query Parameters**

* `q` نص بحث داخل (`Title`, `ContentMd`, `MetadataJson`)
* `type` نوع الملاحظة
* `catalogId` GUID
* `tag` وسم واحد
* `archived` (`true/false`)
* `fromUtc` / `toUtc` (UTC datetime)
* `page` (افتراضي 1)
* `pageSize` (افتراضي 20، حد أعلى 100)

**مثال**
`GET /api/notes?catalogId={guid}&type=general&page=1&pageSize=20`

### 7.2 جلب ملاحظة

`GET /api/notes/{id}`

### 7.3 إنشاء ملاحظة

`POST /api/notes`

**Body**

```json
{
  "catalogId": "guid",
  "title": "note1",
  "type": "general",
  "contentMd": "my note",
  "metadataJson": "{}",
  "tags": ["csharp", "sql"]
}
```

**ملاحظات مهمة**

* `catalogId` **مطلوب** ويجب أن يكون موجودًا في جدول Catalogs.
* `title` و `type` مطلوبان.
* `metadataJson` إذا كان فارغًا يتم ضبطه إلى `"{}"`.

### 7.4 تعديل ملاحظة

`PUT /api/notes/{id}`

**Body**

```json
{
  "catalogId": "guid",
  "title": "note1 updated",
  "type": "general",
  "contentMd": "updated",
  "metadataJson": "{}",
  "isArchived": false,
  "tags": ["csharp"]
}
```

### 7.5 حذف ملاحظة

`DELETE /api/notes/{id}`

**Behavior**

* يحذف الملاحظة + يحذف ملفات المرفقات على القرص (إن وجدت) ويُنظّف مجلد الملاحظة إن أصبح فارغًا.

### سياسة الوسوم (Tags)

* يتم **تطبيع** الوسوم إلى lower-case وتفريغ المسافات وإزالة التكرار.
* تمرير tags كقائمة strings.

---

## 8) Attachments API

### 8.1 رفع مرفق لملاحظة

`POST /api/attachments?noteId={noteId}`
**Content-Type:** `multipart/form-data`

**Form field**

* `file` (IFormFile)

**Response:** `200 OK` → `UploadAttachmentResponse`

**ملاحظات**

* `noteId` يجب أن يكون موجودًا.
* حد الحجم يعتمد على إعداد `FileStorage:MaxUploadBytes`.

### 8.2 تنزيل مرفق

`GET /api/attachments/{id}`
**Response:** ملف (stream) مع `ContentType` واسم الملف الأصلي.

### 8.3 حذف مرفق

`DELETE /api/attachments/{id}`
**Response:** `204 No Content`

**نصيحة للعميل**

* `downloadUrl` غالبًا يكون نسبيًا مثل `/api/attachments/{id}`
  ابنه على base URL:
* `new URL(downloadUrl, baseUrl).toString()`

---

## 9) Health API

### فحص جاهزية الخدمة وقاعدة البيانات

`GET /api/health`

**Response مثال**

```json
{ "status": "ok", "db": "ok" }
```

---

## 10) AI API (اختياري)

> هذا الجزء يعتمد على أنك أضفت `AiController` وربط Gemini في الـ API.

### اقتراح وسوم

`POST /api/ai/suggest-tags`

**Body**

```json
{ "content": "Markdown content here..." }
```

**Response**

```json
{ "tags": ["tag1", "tag2"] }
```

### إعداد Gemini على السيرفر

ضع المفتاح في السيرفر فقط (appsettings أو user-secrets):

* `Gemini:ApiKey`
* `Gemini:Model` (مثال: `gemini-2.5-flash`)

---

## 11) إعدادات التشغيل (Configuration)

### SQL Server

`ConnectionStrings:Default`

مثال (Windows Auth):

```json
"Default": "Server=.;Database=OmniNotesDb;Trusted_Connection=True;TrustServerCertificate=True;"
```

### تخزين المرفقات

`FileStorage`

* `RootPath`: مسار حفظ الملفات على السيرفر
* `MaxUploadBytes`: الحد الأقصى للحجم

مثال:

```json
"FileStorage": {
  "RootPath": "C:\\inetpub\\wwwroot\\omni\\omninotes-files",
  "MaxUploadBytes": 20971520
}
```

### CORS (لعملاء المتصفح)

في `Program.cs`:

* اسم السياسة: `ui`
* أصل الواجهة (مثال): `http://localhost:3002`

إذا تغير عنوان الواجهة (IIS/Port)، حدّث الـ origin.

---

## 12) أمثلة استهلاك سريعة

### 12.1 cURL: إنشاء كاتالوج

```bash
curl -X POST "http://localhost:5174/api/catalogs" \
  -H "Content-Type: application/json" \
  -d '{"name":"Inbox","parentId":null}'
```

### 12.2 cURL: إنشاء ملاحظة

```bash
curl -X POST "http://localhost:5174/api/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "catalogId":"PUT_CATALOG_GUID",
    "title":"note1",
    "type":"general",
    "contentMd":"my note",
    "metadataJson":"{}",
    "tags":["csharp","sql"]
  }'
```

### 12.3 C# HttpClient: جلب الملاحظات

```csharp
using System.Net.Http.Json;

var http = new HttpClient { BaseAddress = new Uri("http://localhost:5174/") };
var notes = await http.GetFromJsonAsync<List<NoteDto>>("api/notes?page=1&pageSize=20");
```

### 12.4 رفع ملف (cURL)

```bash
curl -X POST "http://localhost:5174/api/attachments?noteId=PUT_NOTE_GUID" \
  -F "file=@D:/path/to/file.pdf"
```

---

## 13) تشغيل على IIS (مختصر)

* ثبّت **ASP.NET Core Hosting Bundle** على الجهاز.
* AppPool: **No Managed Code**
* Publish إلى مجلد ثم اربط موقع IIS عليه.
* تأكد من صلاحيات الكتابة على `FileStorage.RootPath` لحساب AppPool.

---

## 14) Checklist لأي مشروع يستهلك OmniNotes API

1. **حدد Base URL** (Dev/Prod).
2. عند إنشاء Note: اجلب Catalogs أولًا واختر `catalogId` صحيح.
3. عند عرض المرفقات: ابنِ رابط التنزيل من `downloadUrl`.
4. لعملاء المتصفح: تأكد من CORS.
5. للمرفقات: تأكد من حجم الملف وقيود `MaxUploadBytes`.
6. (اختياري) للـ AI: لا تضع مفتاح Gemini في العميل؛ فقط في السيرفر.

---
