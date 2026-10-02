import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SHOP_ITEMS } from '@/lib/petData';
import { getAuthenticatedUser } from '@/lib/userAuth';
import { getClientIp, checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    const auth = getAuthenticatedUser(request, requestedUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.', status: 'disabled' }, { status: 403 });
    }

    let userId = auth.userId;
    if (auth.status === 'unauthorized' && requestedUserId) {
      const dbUser = db.prepare('SELECT id, status FROM users WHERE id = ?').get(requestedUserId) as any;
      if (dbUser && dbUser.status !== 'disabled') {
        userId = dbUser.id;
      } else {
        return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
      }
    } else if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Từ chối quyền truy cập.' }, { status: 403 });
    }

    const inventory = db.prepare('SELECT item_id, quantity FROM pet_inventory WHERE user_id = ?').all(userId) as { item_id: string; quantity: number }[];
    const ownedMap = new Map<string, number>();
    inventory.forEach((inv) => ownedMap.set(inv.item_id, inv.quantity));

    const catalog = SHOP_ITEMS.map((item) => ({
      ...item,
      isOwned: item.price === 0 || ownedMap.has(item.id),
      quantityOwned: ownedMap.get(item.id) || 0,
    }));

    let user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as { coins: number } | undefined;
    const coins = user?.coins || 0;

    return NextResponse.json({
      success: true,
      coins: coins,
      items: catalog,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Shop API error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit({
      key: `shop_buy:${clientIp}`,
      maxAttempts: 30,
      windowMs: 60 * 1000,
    });
    if (!rateCheck.allowed) {
      return rateLimitExceededResponse('Tần suất mua sắm quá nhanh. Vui lòng thử lại sau giây lát!', rateCheck.resetInSeconds);
    }

    const body = await request.json();
    const { userId: rawUserId, itemId } = body;

    const auth = getAuthenticatedUser(request, rawUserId);
    if (auth.status === 'disabled') {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.', status: 'disabled' }, { status: 403 });
    }

    let userId = auth.userId;
    if (auth.status === 'unauthorized' && rawUserId) {
      const dbUser = db.prepare('SELECT id, status FROM users WHERE id = ?').get(rawUserId) as any;
      if (dbUser && dbUser.status !== 'disabled') {
        userId = dbUser.id;
      } else {
        return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để mua sắm vật phẩm.' }, { status: 401 });
      }
    } else if (auth.status === 'unauthorized') {
      return NextResponse.json({ error: auth.error || 'Vui lòng đăng nhập để mua sắm vật phẩm.' }, { status: 401 });
    }
    if (auth.status === 'forbidden') {
      return NextResponse.json({ error: auth.error || 'Bạn không có quyền dùng Coins của tài khoản khác (IDOR).' }, { status: 403 });
    }

    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Vật phẩm không tồn tại trong cửa hàng!' }, { status: 400 });
    }

    const user = db.prepare('SELECT id, coins, status, email, email_verified FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    if (user.status === 'disabled') {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.' }, { status: 403 });
    }

    // Check if already owned non-consumable item
    const existing = db.prepare('SELECT * FROM pet_inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId) as any;
    if (existing && item.type !== 'food') {
      return NextResponse.json({ error: 'Bạn đã sở hữu vật phẩm này rồi!' }, { status: 400 });
    }

    // Atomic Balance Deduction: WHERE coins >= price ngăn chặn tuyệt đối Race Condition & số dư âm
    const deductRes = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(item.price, userId, item.price);
    if (deductRes.changes === 0) {
      return NextResponse.json(
        { error: `Bạn không đủ Coins! Cần ${item.price} Coins (hiện có ${user.coins || 0} Coins). Hãy làm bài tập để tích lũy thêm!` },
        { status: 400 }
      );
    }

    const freshUser = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as any;
    const newCoins = freshUser?.coins || 0;

    // Add to inventory
    if (existing) {
      db.prepare('UPDATE pet_inventory SET quantity = quantity + 1 WHERE id = ?').run(existing.id);
    } else {
      const invId = `inv-${userId}-${itemId}-${Date.now()}`;
      db.prepare(`
        INSERT INTO pet_inventory (id, user_id, item_id, item_type, quantity, is_equipped)
        VALUES (?, ?, ?, ?, 1, 0)
      `).run(invId, userId, itemId, item.type);
    }

    // Record coin transaction
    const txId = `tx-${userId}-${Date.now()}`;
    db.prepare(`
      INSERT INTO coin_transactions (id, user_id, amount, balance_after, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(txId, userId, -item.price, newCoins, `Mua vật phẩm: ${item.name}`);

    return NextResponse.json({
      success: true,
      message: `Đã mua thành công ${item.name}!`,
      item,
      remainingCoins: newCoins,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Purchase error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
