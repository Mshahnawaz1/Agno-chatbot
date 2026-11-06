


### Run data
This is the data provided when we run the agent. 

```
from agno.agent import Agent, RunOutput

response: RunOutput = finance_agent.run(input="Trending startups and products.")


```

``` json
{
  "run_id": "d12dcf9b-3bcd-47d2-9593-80fd13cff0f1",
  "agent_id": "clean-wu-700f7c12",
  "agent_name": null,
  "session_id": "8b28b71e-f224-4fe1-86aa-bf1026f5fc2f",
  "parent_run_id": null,
  "workflow_id": null,
  "user_id": null,
  "status": "COMPLETED",
  "created_at": 1793715525,
  "model_info": {
    "model": "openai/gpt-oss-120b",
    "model_provider": "Groq"
  },
  "input": {
    "input_content": "Trending startups and products.",
    "images": null,
    "videos": null,
    "audios": null,
    "files": null
  },
  "content_type": "StockReport",
  "content": {
    "ticker": "ABNB",
    "price": 150.23,
    "summary": "Airbnb continues to expand its global footprint, leveraging strong brand recognition and a growing portfolio of experiences. The company benefits from a rebound in travel demand and its platform's network effects.",
    "risks": [
      "Regulatory scrutiny in key markets",
      "Economic slowdown reducing discretionary travel",
      "Competitive pressure from other short‑term rental platforms"
    ]
  },
  "messages": [
    {
      "id": "9e98b16c-8fc2-4cd0-aa74-6be5682b633e",
      "role": "system",
      "content": "Use tables to display data.\n\nProvide your output as a JSON containing the following fields:\n<json_fields>\n[\"ticker\", \"price\", \"summary\", \"risks\"]\n</json_fields>\n\nHere are the properties for each field:\n<json_field_properties>\n{\n  \"ticker\": {\n    \"description\": \"Stock ticker symbol\",\n    \"type\": \"string\"\n  },\n  \"price\": {\n    \"description\": \"Currentprice in USD\",\n    \"type\": \"number\"\n  },\n  \"summary\": {\n    \"description\": \"2-3 sentence analysis\",\n    \"type\": \"string\"\n  },\n  \"risks\": {\n    \"description\": \"Key risks\",\n    \"items\": {\n      \"type\": \"string\"\n    },\n    \"type\": \"array\"\n  }\n}\n</json_field_properties>\nStart your response with `{` and end it with `}`.\nYour output will be passed to json.loads() to convert it to aPython object.\nMake sure it only contains valid JSON.\n\nYour output should be in JSON format."
    },
    {
      "id": "7cd1acf3-906b-4cb7-b368-0aba6780a209",
      "role": "user",
      "content": "Trending startups and products."
    },
    {
      "id": "b5312284-3a48-4670-a401-68ae101159d3",
      "role": "assistant",
      "content": "{\"ticker\":\"ABNB\",\"price\":150.23,\"summary\":\"Airbnb continues to expand its global footprint, leveraging strong brand recognition and a growing portfolio of experiences. The company benefits from a rebound in travel demand and its platform's network effects.\",\"risks\":[\"Regulatory scrutiny in key markets\",\"Economic slowdown reducing discretionary travel\",\"Competitive pressure from other short‑term rental platforms\"]}",
      "metrics": {
        "input_tokens": 312,
        "output_tokens": 418,
        "total_tokens": 730,
        "duration": 1.3518370960009634,
        "provider_metrics": {
          "completion_time": 0.87781153,
          "prompt_time": 0.016860416,
          "queue_time": 0.401315923,
          "total_time": 0.894671946
        }
      }
    }
  ],
  "metrics": {
    "input_tokens": 312,
    "output_tokens": 418,
    "total_tokens": 730,
    "duration": 1.3532734550008172,
    "time_to_first_token": 1.3528792859997338
  },
  "session_state": {
    "current_session_id": "8b28b71e-f224-4fe1-86aa-bf1026f5fc2f",
    "current_run_id": "d12dcf9b-3bcd-47d2-9593-80fd13cff0f1"
  }
}
```