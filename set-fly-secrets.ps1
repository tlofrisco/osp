# Set Fly.io Secrets for OSP Temporal Worker
$env:PATH += ";C:\Users\tlofr\.fly\bin"

Write-Host "🔧 Setting Fly.io secrets..."

# Set secrets one by one
flyctl secrets set TEMPORAL_API_KEY="eyJhbGciOiJFUzI1NiIsICJraWQiOiJXdnR3YUEifQ.eyJhY2NvdW50X2lkIjoidjVlZ2oiLCAiYXVkIjpbInRlbXBvcmFsLmlvIl0sICJleHAiOjE3ODAzMzMyNDEsICJpc3MiOiJ0ZW1wb3JhbC5pbyIsICJqdGkiOiJXVkMyS2g2MVI4V0JvY3prbXUzZ3NiOGdpY3BhYmpjRSIsICJrZXlfaWQiOiJXVkMyS2g2MVI4V0JvY3prbXUzZ3NiOGdpY3BhYmpjRSIsICJzdWIiOiIzMGQ3NDBiYTlkZmQ0ZGNjYjI0NDhjNDA4ZDA0"

flyctl secrets set PUBLIC_SUPABASE_URL="https://gqhrgbhmunksvwndwwzr.supabase.co"

flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaHJnYmhtdW5rc3Z3bmR3d3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0Njc3NCwiZXhwIjoyMDU2NzIyNzc0fQ.DoTbcQacpAJ_2dQvEElhTOBoBNOSZWVzh515gK3uwq0"

flyctl secrets set NODE_ENV="production"

Write-Host "✅ All secrets set!"
Write-Host "📋 Listing current secrets:"
flyctl secrets list 