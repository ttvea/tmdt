# BACKEND FIX - Supabase Realtime & Payment Provider

## 1. Enable Realtime Replication for tables
Vào Supabase Dashboard:
1. https://supabase.com/dashboard/project/qmpjcgabxhpseyidscml
2. Database → Replication
3. Ở mục "Source" → bật thêm `enrollments` và `orders`
4. Save

Hoặc chạy SQL này trong SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

## 2. Fix payment provider constraint (optional)
```sql
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check 
  CHECK (provider IN ('VNPAY', 'CASH'));