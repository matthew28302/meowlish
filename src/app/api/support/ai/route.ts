import { NextResponse } from 'next/server';
import { getClientIp, checkRateLimitPersistent, rateLimitExceededResponse } from '@/lib/rateLimit';
import { logAccess, logError } from '@/lib/systemLogs';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const MEOWLISH_SYSTEM_PROMPT = `
Bạn là "Trợ Lý Mèo AI Meowlish" (Meowlish AI Assistant 🐱✨) - Người bạn đồng hành thông thái, đáng yêu và tận tâm của học viên trên nền tảng học tiếng Anh tương tác Meowlish (English For Me).

Nhiệm vụ của bạn là giải đáp tức thì, chuẩn xác và sinh động các thắc mắc của học viên về phương pháp học, mẹo thi cử, cách dùng các tính năng trên website Meowlish.

DƯỚI ĐÂY LÀ KIẾN THỨC TOÀN DIỆN VỀ NỀN TẢNG MEOWLISH:
1. HỌC TẬP HIỆU QUẢ:
- Bách khoa 26.500+ từ vựng song ngữ chuẩn CEFR (A1 đến C2), có phiên âm IPA, giải nghĩa thực chiến, cụm collocations và ví dụ tình huống IT / đời sống (truy cập tại /encyclopedia).
- Ngữ Pháp Lego (Lego Grammar tại /grammar): Phương pháp ghép câu trực quan bằng các khối màu sắc (Chủ ngữ màu Xanh lá, Động từ màu Cam, Tân ngữ màu Tím, Trạng từ màu Vàng). Học viên kéo thả các khối theo đúng trật tự, giúp ghi nhớ cấu trúc tự nhiên mà không cần học vẹt quy tắc ngữ pháp khô khan.
- Luyện Nói AI Voice & Luyện Nghe phản xạ (/practice/speaking): Chấm điểm phát âm chuẩn xác từng âm tiết IPA, phát hiện lỗi sai phát âm và luyện phản xạ giao tiếp tự nhiên.
- Sổ tay từ vựng Bookmark & Flashcards SRS: Hệ thống lặp lại ngắt quãng (Spaced Repetition System) giúp tối ưu hóa khả năng ghi nhớ từ vựng dài hạn.
- Bài kiểm tra Quiz & Thi thử (/exam): Có câu hỏi trắc nghiệm sau mỗi bài học, và phòng thi thử các chứng chỉ quốc tế TOEIC, IELTS, TOEFL với hệ thống chấm điểm và giải thích chi tiết.

2. NUÔI & NÂNG CẤP THÚ CƯNG (PixelFarm tại /pet):
- 4 linh vật đồng hành đáng yêu: Cú Lexi (thông thái), Mèo Mochi (tinh nghịch), Cún Taro (trung thành), Cáo Kitsune (nhanh nhẹn).
- 3 chỉ số sức khỏe của pet: Đói (Hunger), Hạnh phúc (Happiness), Năng lượng (Energy).
- Khi thú cưng bị đói / buồn: Bấm nút "Cho ăn" hoặc "Chơi đùa". Nếu hết thức ăn, chỉ cần hoàn thành 1 bài học từ vựng hoặc làm đúng bài quiz là nhận ngay thức ăn ngon lành cho bé!
- Cửa hàng thời trang (Shop): Sắm nón phù thủy, kính râm coder, áo thun hoàng gia, vương miện cho bé cưng.
- Cảnh quan môi trường sống: Thay đổi sang Vườn Xanh Bình Yên, Làng Lá Ninja, hoặc Đảo Hải Tặc Phiêu Lưu.

3. TÍCH LŨY COINS & CỬA HÀNG (SHOP):
- Cách kiếm nhiều Coins nhất:
  + Làm đúng bài tập Từ Vựng, Ngữ Pháp Lego, Luyện Nói: Nhận +5 đến +50 Coins mỗi bài hoàn thành.
  + Duy trì chuỗi ngày Streak: Mỗi ngày hoàn thành ít nhất 1 bài học, Streak tăng thêm 1 ngày.
  + Hoàn thành bài thi thử và mini-game phản xạ.
- Tiêu Coins: Mua phụ kiện thời trang cho thú cưng và mua cảnh quan mới.

4. BẢO MẬT TÀI KHOẢN & 2FA:
- Bật xác thực 2 bước (2FA): Mở khung Đăng Nhập (nút Đăng Nhập trên thanh điều hướng), tìm thẻ "Bảo Mật 2 Lớp (2FA)" và gạt Bật, hệ thống sẽ gửi mã OTP 6 số qua email xác nhận. Từ lần đăng nhập sau sẽ yêu cầu nhập mã OTP.
- Quên mật khẩu: Bấm "Quên mật khẩu?" tại khung đăng nhập, điền email hoặc tên tài khoản để nhận mã OTP đổi mật khẩu mới tức thì.
- Đồng bộ dữ liệu: Toàn bộ tiến độ học tập, Coins, đồ đạc thú cưng được sao lưu thời gian thực an toàn lên đám mây Filebase S3.

5. HỖ TRỢ & GỬI TICKET GÓP Ý:
- Nếu gặp lỗi kỹ thuật hoặc muốn góp ý tính năng, học viên chuyển sang tab "Góp Ý & Báo Lỗi" ngay trên trang /support để tạo phiếu hỗ trợ chuẩn mã #TK-XXXX. Ban Quản Trị sẽ tiếp nhận và gửi email xác nhận ngay lập tức, học viên có thể theo dõi trạng thái tại mục "Lịch Sử Phiếu Hỗ Trợ".

PHONG CÁCH TRẢ LỜI CỦA BẠN:
- Giọng điệu: Vui tươi, dễ thương, tích cực, ân cần, mang phong thái bé mèo Meowlish thông minh (xưng "Meowlish / Mình", gọi "bạn / bạn học viên").
- Sử dụng emoji sinh động: 🐱, 🍉, 🐾, 💎, ✨, 📚, 🧩, 🚀.
- Trình bày mạch lạc, dùng gạch đầu dòng rõ ràng, giải thích ngắn gọn, đi thẳng vào trọng tâm, có kèm gợi ý trang truy cập (vd: /pet, /grammar, /encyclopedia, /support).
`;

// Fallback tri thức offline nếu cả 2 mạng AI đều không phản hồi
function getOfflineFallbackAnswer(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('xu') || q.includes('coin') || q.includes('tiền') || q.includes('kiếm')) {
    return `Meow! 🐱 Để kiếm thật nhiều Coins trên Meowlish, bạn có 4 cách siêu đỉnh nè:\n\n1. 📚 **Hoàn thành bài học:** Mỗi bài Từ Vựng & Ngữ Pháp mới hoàn thành thưởng **+5 đến +50 Coins**!\n2. 🔥 **Duy trì chuỗi Streak:** Học đều đặn mỗi ngày — mỗi ngày có 1 bài hoàn thành là Streak tăng thêm 1!\n3. 🏆 **Thi thử & Quiz:** Làm bài thi thử (/exam) với điểm cao để nhận thêm Coins!\n4. 🧩 **Đấu trường & Đua xe:** Tham gia PVP hoặc đua xe với mức cược 50–500 Coins để nhân đôi số xu nha! ✨`;
  }
  if (q.includes('pet') || q.includes('thú cưng') || q.includes('đói') || q.includes('mèo') || q.includes('cú') || q.includes('cún') || q.includes('cáo') || q.includes('nuôi')) {
    return `Meow meow! 🐾 Khi bé cưng bị đói hoặc buồn, bạn hãy làm theo các bước này nhé:\n\n1. 🍽️ **Cho bé ăn:** Ghé ngay trang **/pet (Thú Cưng)**, bấm nút **"Cho ăn"** hoặc mua thức ăn ngon lành trong Cửa Hàng.\n2. 💡 **Cách nhận thêm thức ăn:** Nếu hết thức ăn, chỉ cần bạn hoàn thành 1 bài học từ vựng là nhận ngay phần thưởng thức ăn thơm ngon cho bé cưng!\n3. 🎩 **Làm đẹp cho Pet:** Dùng Coins sắm nón phù thủy, áo coder và đổi cảnh quan Vườn Xanh hoặc Làng Lá nhé! ✨`;
  }
  if (q.includes('lego') || q.includes('ngữ pháp') || q.includes('grammar')) {
    return `Meow! 🧩 **Ngữ Pháp Lego** là phương pháp độc quyền tại Meowlish giúp bạn tạm biệt những công thức khô khan:\n\n• Mỗi thành phần câu là một khối màu sắc sinh động (Chủ ngữ màu Xanh lá 🟩, Động từ màu Cam 🟧, Tân ngữ màu Tím 🟪, Trạng từ màu Vàng 🟨).\n• Bạn chỉ cần kéo ghép các khối theo đúng logic câu để luyện phản xạ tự nhiên.\n• Trải nghiệm ngay tại mục **/grammar** nhé bạn ơi! 🚀`;
  }
  if (q.includes('kiểm tra') || q.includes('thi') || q.includes('test') || q.includes('toeic') || q.includes('ielts')) {
    return `Meow! 📝 Bạn có thể làm bài kiểm tra và thi thử bằng 2 cách:\n\n1. 🎯 **Sau mỗi bài học:** Cuối mỗi Unit từ vựng hay ngữ pháp đều có bài Mini-Quiz 5-10 câu để kiểm tra độ hiểu bài.\n2. 🏆 **Phòng Thi Thử Đánh Giá Năng Lực:** Truy cập mục **/exam** để luyện đề thi theo định dạng TOEIC / IELTS với đồng hồ đếm ngược và giải thích đáp án chi tiết! ✨`;
  }
  if (q.includes('2fa') || q.includes('bảo mật') || q.includes('mật khẩu') || q.includes('tài khoản')) {
    return `Meow! 🔒 Để bảo vệ tài khoản Meowlish an toàn tuyệt đối:\n\n1. 🛡️ **Bật 2FA:** Mở **khung Đăng Nhập** (nút Đăng Nhập trên thanh điều hướng), tìm thẻ **Bảo Mật 2 Lớp (2FA)** và gạt Bật. Mỗi lần đăng nhập, hệ thống sẽ gửi mã OTP 6 số qua email của bạn.\n2. 🔑 **Đổi mật khẩu:** Nếu quên mật khẩu, chỉ cần bấm "Quên mật khẩu?" trong khung đăng nhập để nhận mã OTP khôi phục.\n3. ☁️ **Đồng bộ Cloud:** Tiến độ và điểm số của bạn luôn được sao lưu đám mây S3 Filebase liên tục! 🌟`;
  }
  return `Meow! 🐱 Chào bạn, mình là Trợ Lý Mèo Meowlish! Mình luôn sẵn sàng hỗ trợ bạn về:\n\n• 📚 **Bách khoa 26.500+ từ vựng & Ngữ pháp Lego** (/encyclopedia, /grammar)\n• 🐾 **Nuôi và chăm sóc thú cưng PixelFarm** (/pet)\n• 💎 **Cách tích lũy thật nhiều Coins & giữ lửa Streak**\n• 🎙️ **Luyện nói AI Voice & chuẩn phát âm IPA** (/practice/speaking)\n• 🎫 **Gửi ticket hỗ trợ kỹ thuật** (#TK-XXXX)\n\nBạn hãy thử hỏi cụ thể hơn nhé, Meowlish sẽ giải đáp ngay trong tích tắc! ✨`;
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  // H1 (audit 2026-10-08): endpoint tốn phí AI (Groq/Gemini) — limiter bền vững
  // giữa các instance (Upstash Redis khi có env, fallback in-memory khi chưa
  // cấu hình). KHÔNG yêu cầu đăng nhập: guest được dùng, chỉ chống spam.
  // 20 lần/phút/IP là đủ thoải mái cho hội thoại thật và vẫn chặn script.
  const rateCheck = await checkRateLimitPersistent(
    `support_ai:${clientIp}`,
    20,
    60 * 1000
  );

  if (!rateCheck.allowed) {
    return rateLimitExceededResponse('Bạn đã đặt câu hỏi quá nhanh. Meowlish cần uống chút sữa, vui lòng chờ ít phút nhé! 🐱🥛', rateCheck.resetInSeconds);
  }

  try {
    const body = await request.json();
    const { message, history } = body;

    const userMessage = String(message || '').trim();
    if (!userMessage) {
      return NextResponse.json({ error: 'Vui lòng nhập câu hỏi của bạn.' }, { status: 400 });
    }

    if (userMessage.length > 500) {
      return NextResponse.json({ error: 'Câu hỏi tối đa 500 ký tự để Meowlish trả lời nhanh nhất nhé!' }, { status: 400 });
    }

    // Xây dựng message history
    const conversationMessages = [
      { role: 'system', content: MEOWLISH_SYSTEM_PROMPT },
    ];

    if (Array.isArray(history)) {
      for (const item of history.slice(-4)) {
        if (item && (item.role === 'user' || item.role === 'assistant') && item.content) {
          conversationMessages.push({
            role: item.role,
            content: String(item.content).slice(0, 500),
          });
        }
      }
    }

    conversationMessages.push({
      role: 'user',
      content: userMessage,
    });

    // 1. TIER 1: GROQ AI
    if (GROQ_API_KEY) {
      const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: conversationMessages,
              temperature: 0.35,
              max_tokens: 800,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const answer = data.choices?.[0]?.message?.content;
            if (answer && answer.trim()) {
              logAccess({
                action: 'support_ai_chat',
                ip: clientIp,
                details: `AI Answer via Groq (${model}): "${userMessage.slice(0, 60)}"`,
                status: 'success',
              });
              return NextResponse.json({
                success: true,
                answer: answer.trim(),
                provider: 'groq',
                model,
              });
            }
          }
        } catch (err: any) {
          console.warn(`[Support AI] Groq model ${model} failed:`, err?.message);
        }
      }
    }

    // 2. TIER 2: GEMINI AI
    if (GEMINI_API_KEY) {
      const geminiModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
      const promptCombined = conversationMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      for (const model of geminiModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptCombined }] }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 800,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer && answer.trim()) {
              logAccess({
                action: 'support_ai_chat',
                ip: clientIp,
                details: `AI Answer via Gemini (${model}): "${userMessage.slice(0, 60)}"`,
                status: 'success',
              });
              return NextResponse.json({
                success: true,
                answer: answer.trim(),
                provider: 'gemini',
                model,
              });
            }
          }
        } catch (err: any) {
          console.warn(`[Support AI] Gemini model ${model} failed:`, err?.message);
        }
      }
    }

    // 3. TIER 3: OFFLINE KNOWLEDGE BASE FALLBACK
    const fallbackAnswer = getOfflineFallbackAnswer(userMessage);
    logAccess({
      action: 'support_ai_chat',
      ip: clientIp,
      details: `AI Answer via Offline KB: "${userMessage.slice(0, 60)}"`,
      status: 'success',
    });
    return NextResponse.json({
      success: true,
      answer: fallbackAnswer,
      provider: 'offline_kb',
    });
  } catch (err: any) {
    logError({
      endpoint: 'POST /api/support/ai',
      error_message: err?.message || 'Lỗi chat trợ lý AI hỗ trợ',
      stack_trace: err?.stack,
      ip: clientIp,
    });
    return NextResponse.json({
      success: true,
      answer: 'Meow! 🐱 Có vẻ đường truyền mạng đang hơi chập chờn một chút. Bạn có thể ghé mục Cẩm Nang hoặc gửi Ticket ở tab bên cạnh để Ban Quản Trị hỗ trợ trực tiếp nhé!',
      provider: 'error_fallback',
    });
  }
}
