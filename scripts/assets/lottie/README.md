// Nguồn Lottie cho GIF email (vector 512×512, bản gốc từ LottieFiles/lottie.host).
//
// File `.lottie` là ZIP chứa `manifest.json` + animation JSON. Giữ trong repo để
// `scripts/render-lottie-gifs.mjs` tái tạo được ảnh mà không cần tải lại —
// link lottie.host là bản CDN có checksum TRÙNG KHỚP với 2 file này, nên tải
// lại cũng không cho chất lượng cao hơn.
//
// | file            | dùng cho email        | nội dung                    |
// |-----------------|-----------------------|-----------------------------|
// | cat-dance.lottie| xác thực (OTP)        | mèo nhảy múa (512², 90f@30) |
// | cat-loading.lottie| quên mật khẩu       | mèo chóng mặt (512², 144f@60) |
