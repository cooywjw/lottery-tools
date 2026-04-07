# -*- coding: utf-8 -*-
import requests, json

TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ3OTg0LCJlbWFpbCI6ImNvb3l3andAMTYzLmNvbSIsInVzZXJuYW1lIjoiY29veXdqdyIsIm1lbWJlckxldmVsIjowLCJpYXQiOjE3NzU0ODM0NTksImV4cCI6MTc3ODA3NTQ1OX0.Tm4xmqgUTr2BSb2s33jgQzrM3JBEaRIqHuO-nQ_qhw8'
API = 'https://api.opennana.com'

s = requests.Session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Authorization': f'Bearer {TOKEN}',
    'Referer': 'https://opennana.com/',
})

# Test
r = s.get(f'{API}/api/prompts/12708', timeout=10)
print('Status:', r.status_code)
print('Response:', r.text[:200])

# Try a recently posted one
r2 = s.get(f'{API}/api/prompts/3613', timeout=10)
print('\nID 3613:', r2.status_code, r2.text[:200])
