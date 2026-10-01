---
name: sql-injection-testing
description: Chuyên sâu rà soát các điểm nối cơ sở dữ liệu SQLite, các câu lệnh truy vấn động thiếu an toàn chống lại SQL Injection.
---

# SQL Injection Testing & Hardening Guide

Nguyên tắc vàng chống tiêm nhiễm câu lệnh SQL vào CSDL SQLite:

## 1. Nguyên Tắc Tuyệt Đối: 100% Parameterized Queries
- Tất cả các thao tác với SQLite qua thư viện `better-sqlite3` bắt buộc dùng dấu `?` placeholder:
  ```typescript
  // ĐÚNG CHUẨN:
  db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(coins, userId);

  // NGUY HIỂM - CẤM TUYỆT ĐỐI:
  // db.prepare(`SELECT * FROM users WHERE username = '${cleanUsername}'`);
  ```

## 2. Kiểm Soát Kiểu Dữ Liệu Đầu Vào
- Ép kiểu số học nguyên thủy (`parseInt(..., 10)`) cho các tham số số như `coins`, `level`, `exp`, `score`.
- Ràng buộc giới hạn độ dài (`slice(0, N)`) cho các chuỗi truy vấn đầu vào nhằm ngăn ngừa các chuỗi payload tràn bộ nhớ đệm hoặc DoS CSDL.

## 3. SQLite PRAGMA & Toàn Vẹn CSDL
- Luôn đảm bảo chế độ `PRAGMA foreign_keys = ON;` để duy trì ràng buộc khóa ngoại.
- Chế độ ghi `PRAGMA journal_mode = WAL;` và `PRAGMA busy_timeout = 5000;` để ngăn chặn deadlock hoặc corrupt file database.
- Thực hiện kiểm tra toàn vẹn định kỳ bằng lệnh `PRAGMA integrity_check;`.
