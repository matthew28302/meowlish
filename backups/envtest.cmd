@echo off
REM Kiem tra DATA_BACKEND co truyen duoc vao process con khong.
set DATA_BACKEND=postgres
node -e "console.log('cmd child DATA_BACKEND =', JSON.stringify(process.env.DATABASE_URL ? 'DATABASE_URL co' : 'DATABASE_URL khong'), '| DATA_BACKEND =', JSON.stringify(process.env.DATA_BACKEND))"
