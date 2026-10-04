'use client';

import { useEffect } from 'react';

/**
 * Đóng modal bằng phím Esc — accessibility-testing: "modals trap + Esc-close".
 *
 * Lý do cần: `.custom-scrollbar` đặt `touch-action: pan-y` và nhiều modal trong
 * app chỉ có nút X + click nền. Người dùng bàn phím (và người dùng mobile sau khi
 * đóng bàn phím màn hình) không có đường thoát nào ngoài việc tìm nút X.
 *
 * Cách dùng:
 *   const [open, setOpen] = useState(false);
 *   useEscapeToClose(open, () => setOpen(false));
 *
 * @param isOpen     modal đang mở hay không
 * @param onClose    callback đóng
 * @param enabled    set false để tạm vô hiệu (ví dụ trong lúc đang submit)
 */
export function useEscapeToClose(isOpen: boolean, onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!isOpen || !enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Chỉ đóng khi Esc thực sự nhả, tránh nuốt phím mà component con dùng.
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, enabled]);
}

export default useEscapeToClose;