@echo off
start cmd /k "cd backend && manage.py runserver 0.0.0.0:8100"
start cmd /k "cd sta-shadcn && npm run dev"
start cmd /k "cd sta-shadcn && node serverWS"

@REM start cmd /k "cd backend && waitress-serve --port=8100 backend.wsgi:application"
@REM start cmd /k "cd sta-shadcn && npm run start"
@REM start cmd /k "cd sta-shadcn && node serverWS"