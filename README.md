# 🎄 BIN NA RECAP 2025

<p align="center">
  <strong>Không gian Noel 3D lung linh — nơi những khoảnh khắc đáng nhớ được thắp sáng bằng ảnh của bạn.</strong>
</p>

<p align="center">
  ✨ Three.js · 🖐️ Nhận diện cử chỉ tay · 📸 Bộ sưu tập ảnh cá nhân · 🌌 Hiệu ứng hạt và ánh sáng
</p>

---

## 🌟 Giới thiệu

**BIN NA RECAP 2025** là một trải nghiệm web tương tác lấy cảm hứng từ cây thông Noel. Hàng nghìn vật thể 3D, ánh sáng vàng ấm và những khung ảnh viền vàng cùng tạo nên một không gian kỷ niệm có thể thay đổi theo cử chỉ bàn tay.

Bạn có thể nạp ảnh của mình từ máy tính hoặc chuẩn bị ảnh trong thư mục `images/`. Các bức ảnh sẽ xuất hiện như những món trang trí trên cây; khi xòe tay, không gian bung thành một dải hạt lấp lánh, còn khi chụm ngón tay, một bức ảnh được đưa ra phía trước để ngắm nhìn.

## 🎁 Trải nghiệm nổi bật

- **Cây thông 3D sống động:** được tạo từ 1.500 vật thể trang trí gồm khối xanh lá, khối vàng, quả cầu vàng, điểm nhấn đỏ và kẹo gậy sọc.
- **Ngôi sao trên đỉnh cây** cùng hệ thống đèn, môi trường phản chiếu và hiệu ứng Bloom tạo ánh sáng rực rỡ.
- **2.500 hạt bụi** lấp lánh chuyển động quanh không gian.
- **Ảnh kỷ niệm trong khung vàng:** ảnh được tự động căn theo tỷ lệ gốc và sắp xếp dọc theo thân cây.
- **Ba trạng thái tương tác:** cây thông, không gian phân tán và chế độ xem ảnh nổi bật.
- **Điều khiển bằng webcam:** MediaPipe nhận diện một bàn tay để chuyển trạng thái và xoay cảnh.
- **Tùy chỉnh bộ ảnh:** chọn cả thư mục hoặc chọn nhiều tệp ảnh riêng lẻ.
- **Giao diện tối giản:** nền đen, điểm nhấn vàng champagne, tiêu đề phong cách lễ hội và khung webcam ở góc màn hình.
- **Tương thích nhiều kích thước cửa sổ:** khung cảnh 3D tự điều chỉnh khi thay đổi kích thước trình duyệt.

## 🖐️ Điều khiển bằng cử chỉ

Cho phép truy cập webcam, đưa một bàn tay vào khung hình và thực hiện các thao tác:

| Cử chỉ | Trạng thái | Hiệu ứng |
| --- | --- | --- |
| Nắm tay | **TREE** | Thu các vật thể và ảnh về bố cục cây thông |
| Xòe bàn tay | **SCATTER** | Bung các vật thể thành không gian hạt; di chuyển tay để xoay cảnh |
| Chụm ngón cái và ngón trỏ | **FOCUS** | Chọn ngẫu nhiên một ảnh và đưa ảnh đó ra phía trước |

> Khi webcam không khả dụng hoặc bạn từ chối quyền truy cập, phần cảnh 3D vẫn có thể hiển thị; các thao tác bằng cử chỉ sẽ không hoạt động.

### Phím tắt

| Phím | Tác dụng |
| --- | --- |
| `H` | Ẩn hoặc hiện các nút chọn ảnh và khung webcam |

## 📸 Thêm ảnh kỷ niệm

### Cách 1: Chọn ảnh trên giao diện

- Chọn **Select Folder** để nạp ảnh từ một thư mục.
- Chọn **Select Files** để chọn một hoặc nhiều tệp ảnh.

Ảnh được tải trực tiếp trong trình duyệt và thêm vào cảnh 3D hiện tại.

### Cách 2: Chuẩn bị ảnh trong `images/`

Đặt ảnh cạnh các tệp dự án theo cấu trúc:

```text
images/
├── 1.jpg
├── 2.png
├── 3.webp
└── ...
```

Trang tự dò tên tệp theo số từ `1` đến `200`. Các phần mở rộng được dò là `jpg`, `jpeg`, `png`, `webp` và `bmp`. Những tệp không tồn tại sẽ được bỏ qua.

> Bốn ảnh mẫu từ Unsplash cũng được tải qua Internet khi mở trang. Để các ảnh mẫu và thư viện hoạt động, cần có kết nối mạng.

## 🚀 Chạy dự án

Đây là dự án web tĩnh, không cần cài đặt gói bằng npm. Do sử dụng ES Modules và webcam, hãy mở trang qua máy chủ cục bộ thay vì mở trực tiếp tệp HTML bằng `file://`.

### Với Visual Studio Code

1. Mở thư mục dự án trong Visual Studio Code.
2. Cài tiện ích **Live Server** nếu máy bạn chưa có.
3. Mở `caynoelcocam.html`, chọn **Open with Live Server**.
4. Truy cập địa chỉ localhost mà Live Server cung cấp. Cổng mặc định đã được cấu hình là `5501`.
5. Cho phép trình duyệt truy cập camera để sử dụng điều khiển bằng cử chỉ.

Bạn cũng có thể dùng bất kỳ máy chủ phát triển tĩnh nào khác để phục vụ thư mục dự án qua `localhost`.

### Yêu cầu

- Trình duyệt hiện đại hỗ trợ JavaScript Modules, WebGL và các API webcam.
- **Internet** để tải Three.js, MediaPipe, mô hình nhận diện tay, Google Fonts và ảnh mẫu từ CDN/dịch vụ ngoài.
- **Quyền camera** để sử dụng nhận diện cử chỉ. Webcam thường chỉ hoạt động trong ngữ cảnh bảo mật như `localhost` hoặc HTTPS.
- Thiết bị có hỗ trợ WebGL; hiệu năng có thể thay đổi tùy cấu hình máy và trình duyệt.

## 🧰 Công nghệ sử dụng

| Công nghệ | Vai trò |
| --- | --- |
| HTML5, CSS3, JavaScript Modules | Cấu trúc trang, giao diện và logic ứng dụng |
| [Three.js](https://threejs.org/) `0.160.0` | Dựng cảnh 3D, vật thể, ánh sáng và kết xuất |
| Three.js `RoomEnvironment` | Tạo môi trường phản chiếu cho cảnh 3D |
| Three.js Post-processing | `EffectComposer`, `RenderPass` và `UnrealBloomPass` cho hiệu ứng phát sáng |
| [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) `0.10.3` | Nhận diện vị trí bàn tay và cử chỉ |
| Google Fonts — Cinzel | Kiểu chữ cho tiêu đề |

Các thư viện được khai báo bằng **Import Map** trong HTML và tải từ jsDelivr CDN.

## 🗂️ Cấu trúc dự án

```text
.
├── caynoelcocam.html   # Trang chính, giao diện và Import Map
├── caynoelcocam.css    # Bố cục, màu sắc và hiệu ứng giao diện
├── caynoelcocam.js     # Cảnh 3D, ảnh, webcam và logic cử chỉ
├── images/             # (Tùy chọn) Ảnh tự dò theo tên 1–200
├── LICENSE             # Giấy phép MIT đi kèm dự án
└── README.md           # Tài liệu dự án
```

## ⚙️ Thông tin kỹ thuật

- Kích thước cây được tạo từ **1.500 hạt trang trí**, cao 24 đơn vị và bán kính gốc 8 đơn vị.
- Không gian có thêm **2.500 hạt bụi**.
- Webcam yêu cầu tối đa một bàn tay, với độ phân giải mục tiêu 640 × 480 và tốc độ khung hình mục tiêu 30 FPS.
- Trình kết xuất dùng WebGL với khử răng cưa và giới hạn pixel ratio để cân bằng chất lượng hiển thị.
- Đường dẫn ảnh cục bộ trong `images/` và ảnh do người dùng chọn chỉ có hiệu lực khi chạy website tại đúng nơi phục vụ các tệp đó; trang không tải ảnh từ thiết bị người dùng lên máy chủ.

## 🔒 Quyền riêng tư

Ảnh được chọn được đọc trong trình duyệt để hiển thị trong cảnh 3D; dự án không có mã tải ảnh người dùng lên máy chủ. Webcam được xin quyền để nhận diện bàn tay. Ngoài ra, trang tải thư viện/mô hình từ các CDN và ảnh mẫu từ Unsplash, do đó trình duyệt sẽ kết nối tới các dịch vụ này khi sử dụng.

## 📄 Giấy phép

Dự án đi kèm giấy phép [MIT](./LICENSE). Vui lòng xem tệp giấy phép để biết đầy đủ điều khoản và thông tin bản quyền được giữ nguyên từ dự án gốc.

## 👤 Tác giả

**Lê Phú An**

---

<p align="center">
  🎄 <strong>Chúc bạn có một mùa Noel rực rỡ và thật nhiều khoảnh khắc đáng nhớ!</strong> ✨
</p>
