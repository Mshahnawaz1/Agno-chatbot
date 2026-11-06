user_id = d4e52952-7d61-469c-b585-bddabb8f16aa

Start the html server,
python3 -m http.server 8080 


### DATA formats 
``` json
new user
{
  "id": "15a2bcb2-cfdd-493d-afc1-fca5db4cd53b",
  "email": "Veld@gmail.com",
  "name": "Veldora",
  "created_at": "2026-11-04 08:52:55"
}

new session

{
  "id": "44b54dce-f670-40f5-8e19-53cf080210ef",
  "user_id": "15a2bcb2-cfdd-493d-afc1-fca5db4cd53b",
  "title": "This is the first sessios for new user veldora, ms",
  "created_at": "2026-11-04 08:55:07"
}

chat response 

{
  "session_id": "44b54dce-f670-40f5-8e19-53cf080210ef",
  "run_id": "775f4ee9-cea6-4233-8070-d1e1e148643b",
  "content": "Artificial intelligence simulates human cognition, learning, reasoning, and decision-making systems."
}
```


### CMD for tests 

``` bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: API KEY' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'


  curl -N -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer d4e52952-7d61-469c-b585-bddabb8f16aa" \
  -d '{"message": "What is the weather in bilaspur today?"}'
  ```