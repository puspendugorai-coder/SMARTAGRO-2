---
title: Smartagro
emoji: 🌱
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🌿 SmartAgro — AI-Powered Precision Agriculture Platform

<div align="center">

![SmartAgro](https://img.shields.io/badge/SmartAgro-Precision%20Agriculture-22c55e?style=for-the-badge&logo=leaf&logoColor=white)

<br/>

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Deployed on Hugging Face](https://img.shields.io/badge/Deployed%20on-Hugging%20Face-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/spaces/AlphaCoder7206/Smartagro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Made for India](https://img.shields.io/badge/Made%20for-India%20🇮🇳-FF9933?style=flat-square)](https://github.com)

**Empowering India's farmers with real-time mandi intelligence, AI crop diagnostics, satellite vegetation health, and multi-period weather risk alerts — across 23 regional languages.**

### 🚀 Live Demo
## 👉 [Click Here to Open the App](https://huggingface.co/spaces/AlphaCoder7206/Smartagro)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌾 About the Project

**SmartAgro** is a comprehensive, full-stack precision agriculture PWA built specifically for Indian farmers to make data-driven farming decisions. It brings together real-time Government mandi price intelligence, AI-powered computer vision crop disease diagnostics, location-aware satellite vegetation health monitoring, climate-based crop recommendations, and multi-period agricultural risk alerts into a modern, responsive, and multilingual dashboard.

> Built with ❤️ for India's 140 million farmers.

---

## ✨ Key Features

### 📊 Live Mandi Market Intelligence
- **Government Agmarknet Data**: Real-time commodity price tracking integrated with `data.gov.in` and cached historical mandi price indexes across **100+ Indian cities** and **50+ major crops**.
- **Market Trends & Visualization**: Interactive price trend charts (Line, Bar, Radar), price momentum tracking, 30-day historical graphs, and demand intensity analysis.
- **MSP Reference Benchmarks**: Minimum Support Price benchmarks for key commodities to ensure fair pricing.
- **Social Sharing**: Direct share functionality for mandi market summaries and commodity price insights via WhatsApp.

### 🔬 Gemini AI Vision Crop Diagnostics
- **Leaf & Crop Photo Analysis**: Upload or capture photos of diseased crops for instant AI diagnostics powered by Gemini Vision AI.
- **In-Depth Diagnosis**: Identifies crop diseases, pest infestations, and nutrient deficiencies with confidence scoring.
- **Actionable Remedies**: Delivers organic eco-friendly treatments, precise chemical dosages, preventive measures, and estimated recovery timelines.
- **Offline Diagnosis Fallback**: Provides symptom-based diagnostic fallbacks when connectivity is limited.

### 🛰️ Satellite View & Vegetation Health
- **Interactive Satellite Mapping**: High-resolution satellite view powered by Esri World Imagery centered on user coordinates.
- **NASA MODIS NDVI Vegetation Health**: Live Vegetation Health Index (NDVI) scoring and visual progress gauge to monitor environmental conditions.

### 🌤️ Weather Intelligence & AI Crop Recommendations
- **Real-Time Weather & 6-Day Forecast**: Weather metrics including temperature, humidity, wind speed, pressure, and visibility.
- **Climate-Tailored Crop Selection**: AI crop match algorithms suggesting high-profit seasonal crops tailored to local soil, rainfall, and climate parameters.
- **Crop Advisory Calendar**: Week-by-week actionable farming calendar for sowing, irrigation, fertilization, pest control, and harvest timing.
- **Smooth Buffering Feedback**: Integrated skeleton loaders and buffering overlays to provide seamless visual feedback during AI computation.

### 🔔 Multi-Period Smart Alerts Center
- **Multi-Horizon Alerts**: Categorized agricultural advisories across Current Alerts, 6-Day Weekly Forecast Alerts, 30-Day Monthly Outlook, and Seasonal Advisories.
- **Synchronized Forecast Data**: Synchronized alert engine ensuring Today's alerts match Day 0 of weekly forecast advisories.
- **Crop Risk Forecast & Best Harvest Window**: Forecast danger percentages for recommended crops and best harvest day recommendations based on weather parameters.
- **Pesticide Safety & Crop Safety Guide**: Dosage guidelines and chemical combination warnings to prevent crop damage.
- **Device Notifications**: Web Push notification support for severe weather advisories.

### 🎙️ AI Kisan Voice & Text Assistant
- Floating AI farming assistant providing real-time text and voice-activated assistance for agricultural inquiries.

### 🌐 Multilingual & PWA Experience
- **23 Indian Regional Languages**: AI-driven dynamic translation engine supporting Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Maithili, Santali, Kashmiri, Nepali, Sindhi, Konkani, Manipuri, Bodo, Dogri, Sanskrit, and English.
- **Progressive Web App (PWA)**: Full offline service worker caching, Web App Manifest support, app installation, and Day/Night dark theme toggle.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Python 3.11, Flask 3.0, Gunicorn |
| **Frontend UI** | HTML5, Vanilla CSS3 (CSS Grid, Flexbox, Glassmorphism), Vanilla JavaScript (ES6+) |
| **AI / Machine Learning** | Groq API (qwen3.6-27b) , Gemini API | 
| **GIS / Mapping** | Leaflet.js, Esri World Imagery Satellite Tiles |
| **Data Sources** | Government of India Agmarknet API (`data.gov.in`), OpenWeatherMap API, NASA MODIS NDVI Data |
| **Data Visualization** | Chart.js |
| **Icons & Typography** | Font Awesome 6, Google Fonts (Syne, Inter) |
| **PWA & Offline** | Service Worker API, Cache Storage API, Web App Manifest |
| **Deployment** | Hugging Face Spaces (Dockerized Container) |

---

## 📁 Project Structure

```
SmartAgro-2/
├── app.py                      # Flask backend API routes, Groq AI integrations & translations
├── Dockerfile                  # Production container definition for Hugging Face Spaces
├── requirements.txt            # Python dependencies
├── market_history_cache.json   # Mandi market price historical fallback cache
├── api_usage_tracker.json      # API usage and quota tracking
├── static/
│   ├── css/                    # Modular styling (main.css, dashboard.css, alerts.css, market.css, diagnose.css)
│   ├── js/                     # Client logic (main.js, dashboard.js, alerts.js, market.js, diagnose.js, kisan-helper.js, translations.js)
│   ├── icons/                  # PWA icons
│   ├── manifest.json           # Web App Manifest
│   └── service-worker.js       # PWA offline service worker
└── templates/
    ├── index.html              # Dashboard & Crop Advisory page
    ├── diagnose.html           # AI Crop Disease Diagnostics page
    ├── market.html             # Mandi Market Prices & Trends page
    ├── alerts.html             # Farm Alerts & Forecast Center page
    └── offline.html            # PWA offline fallback page
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | `GET` | Main Dashboard & Crop Advisory Interface |
| `/diagnose` | `GET` | Crop Disease Diagnostic Interface |
| `/market` | `GET` | Mandi Market Prices Interface |
| `/alerts` | `GET` | Live & Forecast Alerts Center |
| `/api/weather` | `GET` | Retrieves current weather & 6-day forecast by coordinates |
| `/api/crop-recommendations` | `POST` | Generates climate-matched crop recommendations, calendar & pesticide guide |
| `/api/alerts` | `POST` | Retrieves current weather & pest risk alerts |
| `/api/alerts-forecast` | `POST` | Generates 6-day forecast day-wise alerts & risk summary |
| `/api/monthly-alerts` | `POST` | Generates 30-day long-term agricultural risk outlook |
| `/api/seasonal-alerts` | `POST` | Generates seasonal farming advisories by city |
| `/api/crop-risk` | `POST` | Computes 6-day weather risk percentage for recommended crops |
| `/api/diagnose` | `POST` | Processes crop image upload with Groq AI Vision model |
| `/api/market-prices` | `GET/POST` | Fetches live Agmarknet & historical mandi commodity prices |
| `/api/translate-*` | `POST` | Dynamic AI translation for market, alerts, and dashboard (23 languages) |
| `/api/chat` | `POST` | Kisan Voice & Text AI Assistant endpoint |

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- **Government of India Open Data Platform (`data.gov.in`)** for Agmarknet Mandi data
- **Groq Cloud API** for ultra-fast LLaMA 3 AI inference & vision processing
- **OpenWeatherMap & NASA MODIS** for weather & satellite environmental insights
- **Hugging Face Spaces** for Docker hosting infrastructure
