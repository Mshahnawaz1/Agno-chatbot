# Agno chatbot

A chatbot project built using [Agno](https://www.agno.com/), exploring AI agent development and integration with FastAPI.

[![Architecture diagram](https://gitdiagram.com/diagram-badge.svg)](https://gitdiagram.com/mshahnawaz1/agno-chatbot?utm_source=readme&utm_medium=badge)


## 📂 Project Structure

```text
Agno-chatbot/
│
├── learn_agno/
│   └── ... 
├── agno-fastapi/
│   ├── frontend/
│   │   └── ...
│   ├── requirements.txt
│   └── ...
├── .gitignore
├── pyproject.toml
├── uv.lock
└── README.md
```

## 📁 Directory Navigation

| Directory / File | Description |
|---|---|
| [`learn_agno/`](learn_agno/) | Initial implementation, learning, and experimentation with Agno modules and concepts. |
| [`agno-fastapi/`](agno-fastapi/) | Main directory containing the chatbot application built with Agno and FastAPI. |
| [`agno-fastapi/frontend/`](agno-fastapi/frontend/) | Simple chatbot UI developed using HTML, CSS, and plain JavaScript. |
| [`agno-fastapi/requirements.txt`](agno-fastapi/requirements.txt) | Python dependencies required to run the chatbot backend. |
| [`pyproject.toml`](pyproject.toml) | Project configuration and dependency management. |
| [`uv.lock`](uv.lock) | Lockfile containing pinned dependency versions. |

## 🚀 Getting Started

Navigate to the main application directory:

```bash
cd agno-fastapi
pip install -r requirements.txt

uvicorn app.main:app --reload 
```

Run frontend
``` bash
cd frontend
python3 -m http.server 8080 
```

## 🛠️ Tech Stack

- **Agent Framework:** Agno
- **Backend:** FastAPI
- **Frontend:** HTML, CSS, JavaScript
- **Language:** Python

---

